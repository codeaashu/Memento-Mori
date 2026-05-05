import { normalizePath } from "../utils.js";
import { buildResolutionCandidates, buildSourceCandidates, canonicalizeResolvedId, checkFileDenial, clearNormalizeFilePathCache, dedupePatterns, dedupeViolationKey, isFileExcluded, normalizeFilePath } from "../import-protection/utils.js";
import { ImportGraph, buildTrace, formatViolation } from "../import-protection/trace.js";
import { getDefaultImportProtectionRules, getMarkerSpecifiers } from "../import-protection/defaults.js";
import { compileMatchers, matchesAny } from "../import-protection/matchers.js";
import { getImportProtectionEnvType, getImportProtectionRelativePath, getImportProtectionRulesForEnvironment, shouldCheckImportProtectionImporter } from "../import-protection/adapterUtils.js";
import { ImportLocCache, addTraceImportLocations, buildCodeSnippet, buildLineIndex, createImportSpecifierLocationIndex, findImportStatementLocationFromTransformed, findOriginalUsageLocation, findPostCompileUsageLocation, getOrCreateOriginalTransformResult, indexToLineColumn, normalizeSourceMap, pickOriginalCodeFromSourcesContent } from "../import-protection/sourceLocation.js";
import { findOriginalUnsafeUsagePosFromResult, getImportSources, getMockExportNamesBySource, getNamedExports } from "../import-protection/analysis.js";
import { rewriteDeniedImports } from "../import-protection/rewrite.js";
import { ExtensionlessAbsoluteIdResolver } from "../import-protection/extensionlessAbsoluteIdResolver.js";
import { generateDevSelfDenialModule, generateSelfContainedMockModule, loadMockEdgeModule, loadMockRuntimeModule, loadSilentMockModule } from "../import-protection/virtualModules.js";
import { extname, resolve } from "node:path";
//#region src/rsbuild/import-protection.ts
var importSpecifierLocationIndex = createImportSpecifierLocationIndex();
var IMPORT_PROTECTION_VIRTUAL_DIR = "node_modules/.virtual/import-protection";
var MOCK_EDGE_FILE_PREFIX = "mock-edge-";
var MOCK_RUNTIME_FILE_PREFIX = "mock-runtime-";
var MOCK_SILENT_FILE = "mock-silent.mjs";
function toBase64Url(input) {
	return Buffer.from(JSON.stringify(input), "utf8").toString("base64url");
}
function fromBase64Url(input) {
	return JSON.parse(Buffer.from(input, "base64url").toString("utf8"));
}
function getRulesForEnvironment(config, envName) {
	return getImportProtectionRulesForEnvironment(config, envName);
}
function serializePattern(pattern) {
	return typeof pattern === "string" ? pattern : pattern.toString();
}
function dedupeKey(info) {
	return dedupeViolationKey(info);
}
function getOrCreateEnvState(envStates, envName) {
	let env = envStates.get(envName);
	if (!env) {
		env = {
			resolveCache: /* @__PURE__ */ new Map(),
			seenViolations: /* @__PURE__ */ new Set(),
			buildTransformResults: /* @__PURE__ */ new Map(),
			deferredFileViolations: [],
			deferredFileViolationKeys: /* @__PURE__ */ new Set()
		};
		envStates.set(envName, env);
	}
	return env;
}
function getVirtualModulePath(root, envName, filename) {
	return normalizePath(resolve(root, IMPORT_PROTECTION_VIRTUAL_DIR, envName, filename));
}
function queuePendingWrite(shared, envName, filePath, code) {
	let writes = shared.pendingWrites.get(envName);
	if (!writes) {
		writes = /* @__PURE__ */ new Map();
		shared.pendingWrites.set(envName, writes);
	}
	writes.set(filePath, code);
}
function tryWriteVirtualModule(shared, envName, filePath, code) {
	if (shared.virtualModules.get(filePath) === code) return filePath;
	shared.virtualModules.set(filePath, code);
	const vmPlugin = shared.vmPlugins[envName];
	if (!vmPlugin || !shared.readyVmPlugins[envName]) {
		queuePendingWrite(shared, envName, filePath, code);
		return filePath;
	}
	vmPlugin.writeModule(filePath, code);
	return filePath;
}
function flushPendingWrites(shared, envName) {
	const writes = shared.pendingWrites.get(envName);
	if (!writes?.size || !shared.readyVmPlugins[envName]) return;
	for (const [filePath, code] of writes) {
		shared.vmPlugins[envName]?.writeModule(filePath, code);
		writes.delete(filePath);
	}
	if (writes.size === 0) shared.pendingWrites.delete(envName);
}
function ensureSilentMockModule(shared, envName) {
	return tryWriteVirtualModule(shared, envName, getVirtualModulePath(shared.root, envName, MOCK_SILENT_FILE), loadSilentMockModule().code);
}
function ensureRuntimeMockModule(opts) {
	const encoded = toBase64Url({
		mode: opts.mode,
		env: opts.env,
		importer: opts.importer,
		specifier: opts.specifier,
		trace: []
	});
	return tryWriteVirtualModule(opts.shared, opts.envName, getVirtualModulePath(opts.shared.root, opts.envName, `${MOCK_RUNTIME_FILE_PREFIX}${encoded}.mjs`), loadMockRuntimeModule(encoded).code);
}
function ensureMockEdgeModule(opts) {
	const encoded = toBase64Url(opts.payload);
	return tryWriteVirtualModule(opts.shared, opts.envName, getVirtualModulePath(opts.shared.root, opts.envName, `${MOCK_EDGE_FILE_PREFIX}${encoded}.mjs`), loadMockEdgeModule(encoded).code);
}
function getMockEdgePayloadFromFile(filePath) {
	const match = /(?:^|[\\/])mock-edge-([^/\\]+)\.mjs$/.exec(filePath);
	if (!match) return;
	try {
		return fromBase64Url(match[1]);
	} catch {
		return;
	}
}
async function loadOriginalCode(cache, file, loader) {
	let result = cache.get(file);
	if (!result) {
		result = loader(file);
		cache.set(file, result);
	}
	return result;
}
async function loadOriginalCodeFromInputFileSystem(inputFileSystem, file) {
	return new Promise((resolve) => {
		inputFileSystem.readFile(file, (error, data) => {
			if (error || data == null) {
				resolve(void 0);
				return;
			}
			resolve(typeof data === "string" ? data : data.toString("utf8"));
		});
	});
}
async function resolveAgainstImporter(opts) {
	const cacheKey = `${normalizeFilePath(opts.importerId)}:${opts.source}`;
	if (opts.envState.resolveCache.has(cacheKey)) return opts.envState.resolveCache.get(cacheKey) ?? null;
	const importerDir = opts.ctx.context ?? opts.importerId.replace(/[/\\][^/\\]*$/, "");
	const resolved = await new Promise((resolve, reject) => {
		opts.ctx.resolve(importerDir, opts.source, (error, result) => {
			if (error) {
				reject(error);
				return;
			}
			resolve(typeof result === "string" ? result : null);
		});
	}).catch(() => null);
	if (!resolved) {
		opts.envState.resolveCache.set(cacheKey, null);
		return null;
	}
	const canonical = canonicalizeResolvedId(resolved, opts.config.root, (value) => opts.extensionlessResolver.resolve(value));
	opts.envState.resolveCache.set(cacheKey, canonical);
	return canonical;
}
function getModuleResource(module) {
	const candidate = module;
	return candidate.nameForCondition() ?? candidate.resourceResolveData?.resource ?? candidate.resource ?? candidate.userRequest ?? candidate.request;
}
function getModuleFile(module) {
	return normalizeFilePath(getModuleResource(module) ?? module.identifier());
}
var IMPORT_PROTECTION_PARSEABLE_EXTENSIONS = new Set([
	".ts",
	".tsx",
	".mts",
	".cts",
	".js",
	".jsx",
	".mjs",
	".cjs"
]);
function isImportProtectionSourceFile(file) {
	if (!file) return false;
	const extension = extname(normalizeFilePath(file));
	return extension.length > 0 && IMPORT_PROTECTION_PARSEABLE_EXTENSIONS.has(extension);
}
function isImportProtectionSourceModule(module) {
	return isImportProtectionSourceFile(getModuleResource(module));
}
function addTransformResult(cache, key, result) {
	cache.set(normalizePath(key), result);
	cache.set(normalizeFilePath(key), result);
}
function hasTransformResult(cache, key) {
	return cache.has(normalizePath(key)) || cache.has(normalizeFilePath(key));
}
function deferFileViolation(envState, violation) {
	const key = `${violation.importer}:${violation.specifier}:${violation.resolved}:${String(violation.pattern)}`;
	if (envState.deferredFileViolationKeys.has(key)) return;
	envState.deferredFileViolationKeys.add(key);
	envState.deferredFileViolations.push(violation);
}
function hasOriginalUnsafeUsage(result, source, envType) {
	if (!result) return false;
	const originalResult = getOrCreateOriginalTransformResult(result);
	if (!originalResult) return false;
	return !!findOriginalUnsafeUsagePosFromResult(originalResult, source, envType);
}
async function buildTransformResultProvider(opts) {
	const cache = /* @__PURE__ */ new Map();
	if (opts.preloaded) for (const [key, result] of opts.preloaded) cache.set(key, result);
	for (const module of opts.modules) {
		const source = module.originalSource();
		if (!source) continue;
		const sourceAndMap = source.sourceAndMap();
		const code = String(sourceAndMap.source);
		const map = normalizeSourceMap(sourceAndMap.map);
		const file = getModuleFile(module);
		const resource = getModuleResource(module);
		const originalCode = map?.sourcesContent ? pickOriginalCodeFromSourcesContent(map, resource ?? file, opts.root) ?? (resource ? await opts.loadOriginalCode(resource) : void 0) : resource ? await opts.loadOriginalCode(resource) : void 0;
		const result = {
			code,
			filename: resource ?? file,
			map,
			originalCode,
			lineIndex: buildLineIndex(code)
		};
		if (!hasTransformResult(cache, file)) addTransformResult(cache, file, result);
		if (resource && !hasTransformResult(cache, resource)) addTransformResult(cache, resource, result);
	}
	return { getTransformResult(id) {
		return cache.get(normalizePath(id)) ?? cache.get(normalizeFilePath(id));
	} };
}
function getConnectionRequest(dependency) {
	const candidate = dependency;
	return typeof candidate.request === "string" ? candidate.request : void 0;
}
function addEntryModulesToGraph(opts) {
	for (const entry of opts.compilation.entries.values()) for (const dependency of entry.dependencies) {
		const module = opts.compilation.moduleGraph.getConnection(dependency)?.module;
		if (!module) continue;
		opts.graph.addEntry(getModuleFile(module));
	}
}
function buildCompilationGraph(opts) {
	const graph = new ImportGraph();
	const edges = [];
	addEntryModulesToGraph({
		compilation: opts.compilation,
		graph
	});
	for (const module of opts.modules) {
		const importer = getModuleFile(module);
		const connections = opts.compilation.moduleGraph.getOutgoingConnectionsInOrder(module);
		for (const connection of connections) {
			if (!connection.module) continue;
			if (!isActiveConnection(connection)) continue;
			const resolved = getModuleFile(connection.module);
			const specifier = getConnectionRequest(connection.dependency);
			graph.addEdge(resolved, importer, specifier);
			edges.push({
				importer,
				specifier,
				resolved
			});
		}
	}
	return {
		graph,
		edges
	};
}
function isActiveConnection(connection) {
	if (typeof connection.getActiveState !== "function") return true;
	return connection.getActiveState(void 0) === true;
}
function findImportLocationInOriginalCode(provider, importer, source) {
	const result = provider.getTransformResult(importer);
	if (!result) return;
	const originalResult = getOrCreateOriginalTransformResult(result);
	if (!originalResult) return;
	const index = importSpecifierLocationIndex.find(originalResult, source);
	if (index === -1) return;
	const loc = indexToLineColumn(originalResult.lineIndex ?? (originalResult.lineIndex = buildLineIndex(originalResult.code)), index);
	return {
		file: normalizeFilePath(importer),
		line: loc.line,
		column: loc.column
	};
}
async function resolveImporterLocation(opts) {
	if (opts.preferOriginalCode) for (const candidate of opts.sourceCandidates) {
		const loc = findOriginalUsageLocation(opts.provider, opts.importer, candidate, opts.envType) ?? findImportLocationInOriginalCode(opts.provider, opts.importer, candidate);
		if (loc) return loc;
	}
	for (const candidate of opts.sourceCandidates) {
		const loc = await findPostCompileUsageLocation(opts.provider, opts.importer, candidate) || await findImportStatementLocationFromTransformed(opts.provider, opts.importer, candidate, opts.importLocCache, importSpecifierLocationIndex.find);
		if (loc) return loc;
	}
	if (!opts.preferOriginalCode) for (const candidate of opts.sourceCandidates) {
		const loc = findImportLocationInOriginalCode(opts.provider, opts.importer, candidate);
		if (loc) return loc;
	}
}
async function rebuildAndAnnotateTrace(opts) {
	const trace = buildTrace(opts.graph, opts.importer, opts.maxTraceDepth);
	await addTraceImportLocations(opts.provider, trace, opts.importLocCache, importSpecifierLocationIndex.find);
	if (trace.length > 0) {
		const last = trace[trace.length - 1];
		if (!last.specifier) last.specifier = opts.specifier;
		if (opts.importerLoc && last.line == null) {
			last.line = opts.importerLoc.line;
			last.column = opts.importerLoc.column;
		}
	}
	return trace;
}
async function buildViolationInfo(opts) {
	const importerLoc = await resolveImporterLocation({
		provider: opts.provider,
		importLocCache: opts.importLocCache,
		importer: opts.importer,
		sourceCandidates: buildSourceCandidates(opts.source, opts.resolved, opts.config.root),
		preferOriginalCode: opts.preferOriginalCode,
		envType: opts.envType
	});
	const trace = await rebuildAndAnnotateTrace({
		provider: opts.provider,
		graph: opts.graph,
		importLocCache: opts.importLocCache,
		importer: opts.importer,
		specifier: opts.source,
		importerLoc,
		maxTraceDepth: opts.config.maxTraceDepth
	});
	const snippet = importerLoc ? buildCodeSnippet(opts.provider, opts.importer, importerLoc) : void 0;
	return {
		env: opts.envName,
		envType: opts.envType,
		behavior: opts.config.effectiveBehavior,
		type: opts.type,
		pattern: opts.pattern,
		specifier: opts.source,
		importer: opts.importer,
		...opts.resolved ? { resolved: opts.resolved } : {},
		...importerLoc ? { importerLoc } : {},
		trace,
		snippet
	};
}
async function getMarkerKindForFile(opts) {
	if (!isImportProtectionSourceFile(opts.file)) return;
	let cached = opts.markerKindCache.get(opts.file);
	if (!cached) {
		cached = (async () => {
			const code = opts.provider.getTransformResult(opts.file)?.originalCode ?? await opts.loadOriginalCode(opts.file);
			if (!code) return;
			const imports = getImportSources(code, opts.file);
			const hasServerOnly = imports.some((source) => opts.config.markerSpecifiers.serverOnly.has(source));
			const hasClientOnly = imports.some((source) => opts.config.markerSpecifiers.clientOnly.has(source));
			if (hasServerOnly && !hasClientOnly) return "server";
			if (hasClientOnly && !hasServerOnly) return "client";
		})();
		opts.markerKindCache.set(opts.file, cached);
	}
	return cached;
}
async function reportViolation(opts) {
	const key = dedupeKey(opts.info);
	if (opts.config.logMode !== "always" && opts.envState.seenViolations.has(key)) return;
	opts.envState.seenViolations.add(key);
	if (opts.config.onViolation) {
		if (await opts.config.onViolation(opts.info) === false) return;
	}
	const message = formatViolation(opts.info, opts.config.root);
	const error = new opts.rspack.WebpackError(message);
	if (opts.config.effectiveBehavior === "error") opts.compilation.errors.push(error);
	else opts.compilation.warnings.push(error);
}
function registerImportProtection(api, opts) {
	const extensionlessResolver = new ExtensionlessAbsoluteIdResolver();
	const envStates = /* @__PURE__ */ new Map();
	const fileReadCache = /* @__PURE__ */ new Map();
	const config = {
		enabled: true,
		root: "",
		command: api.context.action === "dev" ? "serve" : "build",
		srcDirectory: "",
		framework: opts.framework,
		effectiveBehavior: "error",
		mockAccess: "error",
		logMode: "once",
		maxTraceDepth: 20,
		compiledRules: {
			client: {
				specifiers: [],
				files: [],
				excludeFiles: []
			},
			server: {
				specifiers: [],
				files: [],
				excludeFiles: []
			}
		},
		includeMatchers: [],
		excludeMatchers: [],
		ignoreImporterMatchers: [],
		markerSpecifiers: {
			serverOnly: /* @__PURE__ */ new Set(),
			clientOnly: /* @__PURE__ */ new Set()
		},
		envTypeMap: new Map(opts.environments.map((env) => [env.name, env.type])),
		onViolation: void 0
	};
	const shared = {
		root: "",
		virtualModules: /* @__PURE__ */ new Map(),
		vmPlugins: {},
		readyVmPlugins: {},
		inputFileSystems: {},
		pendingWrites: /* @__PURE__ */ new Map()
	};
	function applyUserConfig() {
		const { startConfig, resolvedStartConfig } = opts.getConfig();
		config.root = resolvedStartConfig.root;
		config.srcDirectory = resolvedStartConfig.srcDirectory;
		shared.root = resolvedStartConfig.root;
		const userOpts = startConfig.importProtection;
		if (userOpts?.enabled === false) {
			config.enabled = false;
			return;
		}
		config.enabled = true;
		const behavior = userOpts?.behavior;
		if (typeof behavior === "string") config.effectiveBehavior = behavior;
		else config.effectiveBehavior = config.command === "serve" ? behavior?.dev ?? "mock" : behavior?.build ?? "error";
		config.logMode = userOpts?.log ?? "once";
		config.mockAccess = userOpts?.mockAccess ?? "error";
		config.maxTraceDepth = userOpts?.maxTraceDepth ?? 20;
		config.onViolation = userOpts?.onViolation ? (info) => userOpts.onViolation?.(info) : void 0;
		const defaults = getDefaultImportProtectionRules();
		const pick = (user, fallback) => user ? [...user] : [...fallback];
		const clientSpecifiers = dedupePatterns([...defaults.client.specifiers, ...userOpts?.client?.specifiers ?? []]);
		config.compiledRules.client = {
			specifiers: compileMatchers(clientSpecifiers),
			files: compileMatchers(pick(userOpts?.client?.files, defaults.client.files)),
			excludeFiles: compileMatchers(pick(userOpts?.client?.excludeFiles, defaults.client.excludeFiles))
		};
		config.compiledRules.server = {
			specifiers: compileMatchers(dedupePatterns(pick(userOpts?.server?.specifiers, defaults.server.specifiers))),
			files: compileMatchers(pick(userOpts?.server?.files, defaults.server.files)),
			excludeFiles: compileMatchers(pick(userOpts?.server?.excludeFiles, defaults.server.excludeFiles))
		};
		config.includeMatchers = compileMatchers(userOpts?.include ?? []);
		config.excludeMatchers = compileMatchers(userOpts?.exclude ?? []);
		config.ignoreImporterMatchers = compileMatchers(userOpts?.ignoreImporters ?? []);
		const markers = getMarkerSpecifiers();
		config.markerSpecifiers = {
			serverOnly: new Set(markers.serverOnly),
			clientOnly: new Set(markers.clientOnly)
		};
	}
	api.onBeforeBuild(() => {
		applyUserConfig();
		clearNormalizeFilePathCache();
		extensionlessResolver.clear();
		fileReadCache.clear();
		envStates.clear();
	});
	api.onBeforeDevCompile(() => {
		applyUserConfig();
		clearNormalizeFilePathCache();
		extensionlessResolver.clear();
		fileReadCache.clear();
		for (const envState of envStates.values()) {
			envState.resolveCache.clear();
			envState.buildTransformResults.clear();
			envState.deferredFileViolations.length = 0;
			envState.deferredFileViolationKeys.clear();
		}
	});
	api.modifyRspackConfig((rspackConfig, utils) => {
		applyUserConfig();
		const envName = utils.environment.name;
		const VMP = utils.rspack.experiments.VirtualModulesPlugin;
		const vmPlugin = new VMP({});
		shared.vmPlugins[envName] = vmPlugin;
		shared.readyVmPlugins[envName] = false;
		rspackConfig.plugins.push(vmPlugin);
		rspackConfig.plugins.push({ apply(compiler) {
			shared.inputFileSystems[envName] = compiler.inputFileSystem;
			compiler.hooks.thisCompilation.tap("TanStackStartImportProtectionVirtualModulesReady", () => {
				shared.readyVmPlugins[envName] = true;
				flushPendingWrites(shared, envName);
			});
		} });
	});
	for (const environment of opts.environments) api.transform({
		test: /\.[cm]?[tj]sx?$/,
		environments: [environment.name],
		order: "post"
	}, async (ctx) => {
		if (!config.enabled) return ctx.code;
		const envName = environment.name;
		const envType = getImportProtectionEnvType(config, envName);
		const envState = getOrCreateEnvState(envStates, envName);
		const id = ctx.resource;
		const file = normalizeFilePath(ctx.resourcePath);
		if (!shouldCheckImportProtectionImporter(config, file)) return ctx.code;
		const matchers = getRulesForEnvironment(config, envName);
		const relativeFile = getImportProtectionRelativePath(config.root, file);
		const importSources = getImportSources(ctx.code, file);
		const transformedImportSources = new Set(importSources);
		const transformInputFileSystem = shared.inputFileSystems[envName];
		const loadOriginalCodeForTransform = transformInputFileSystem ? (target) => loadOriginalCodeFromInputFileSystem(transformInputFileSystem, target) : () => Promise.resolve(void 0);
		const originalCode = config.command === "build" ? await loadOriginalCode(fileReadCache, file, loadOriginalCodeForTransform) : void 0;
		const buildImportSources = originalCode ? getImportSources(originalCode, file) : [];
		const buildTransformResult = config.command === "build" ? {
			code: ctx.code,
			filename: file,
			map: void 0,
			originalCode,
			lineIndex: buildLineIndex(ctx.code)
		} : void 0;
		if (config.command === "build") {
			const relativeBuildFile = getImportProtectionRelativePath(config.root, file);
			addTransformResult(envState.buildTransformResults, file, buildTransformResult);
			addTransformResult(envState.buildTransformResults, relativeBuildFile, buildTransformResult);
			if (id !== file) addTransformResult(envState.buildTransformResults, id, buildTransformResult);
		}
		const hasServerOnlyMarker = importSources.some((source) => config.markerSpecifiers.serverOnly.has(source));
		const hasClientOnlyMarker = importSources.some((source) => config.markerSpecifiers.clientOnly.has(source));
		if (hasServerOnlyMarker && hasClientOnlyMarker) throw new Error(`[import-protection] File "${relativeFile}" has both server-only and client-only markers. This is not allowed.`);
		const markerKind = hasServerOnlyMarker ? "server" : hasClientOnlyMarker ? "client" : void 0;
		if (checkFileDenial(relativeFile, matchers) || envType === "client" && markerKind === "server" || envType === "server" && markerKind === "client") {
			let exportNames = [];
			try {
				exportNames = getNamedExports(ctx.code, file);
			} catch {
				exportNames = [];
			}
			if (config.command === "build") return generateSelfContainedMockModule(exportNames);
			const runtimeId = ensureRuntimeMockModule({
				shared,
				envName,
				mode: config.mockAccess,
				env: envName,
				importer: file,
				specifier: relativeFile
			});
			return generateDevSelfDenialModule(exportNames, runtimeId);
		}
		const deniedSpecifierReplacements = /* @__PURE__ */ new Map();
		const exportsBySource = (() => {
			try {
				return getMockExportNamesBySource(ctx.code, file);
			} catch {
				return /* @__PURE__ */ new Map();
			}
		})();
		for (const source of importSources) {
			const specifierMatch = matchesAny(source, matchers.specifiers);
			if (!specifierMatch && config.command === "build") {
				const resolved = await resolveAgainstImporter({
					envState,
					config,
					ctx,
					importerId: id,
					source,
					extensionlessResolver
				});
				if (resolved) {
					const relativeResolved = getImportProtectionRelativePath(config.root, resolved);
					const buildFileMatch = checkFileDenial(relativeResolved, matchers);
					if (buildFileMatch && hasOriginalUnsafeUsage(buildTransformResult, source, envType)) deferFileViolation(envState, {
						importer: file,
						specifier: source,
						resolved,
						relativeResolved,
						pattern: buildFileMatch.pattern,
						useOriginalLocation: true
					});
				}
				continue;
			}
			if (!specifierMatch) continue;
			const resolved = await resolveAgainstImporter({
				envState,
				config,
				ctx,
				importerId: id,
				source,
				extensionlessResolver
			});
			const runtimeId = config.command === "build" ? ensureSilentMockModule(shared, envName) : ensureRuntimeMockModule({
				shared,
				envName,
				mode: config.mockAccess,
				env: envName,
				importer: file,
				specifier: source
			});
			const replacement = ensureMockEdgeModule({
				shared,
				envName,
				payload: {
					exports: exportsBySource.get(source) ?? [],
					runtimeId,
					violation: {
						env: envName,
						envType,
						importer: file,
						specifier: source,
						...resolved ? { resolved } : {},
						patternText: serializePattern(specifierMatch.pattern)
					}
				}
			});
			deniedSpecifierReplacements.set(source, replacement);
		}
		if (config.command === "build") for (const source of buildImportSources) {
			if (transformedImportSources.has(source)) continue;
			if (matchesAny(source, matchers.specifiers)) continue;
			const resolved = await resolveAgainstImporter({
				envState,
				config,
				ctx,
				importerId: id,
				source,
				extensionlessResolver
			});
			if (!resolved) continue;
			const relativeResolved = getImportProtectionRelativePath(config.root, resolved);
			const buildFileMatch = checkFileDenial(relativeResolved, matchers);
			if (!buildFileMatch || !hasOriginalUnsafeUsage(buildTransformResult, source, envType)) continue;
			deferFileViolation(envState, {
				importer: file,
				specifier: source,
				resolved,
				relativeResolved,
				pattern: buildFileMatch.pattern,
				useOriginalLocation: true
			});
		}
		if (deniedSpecifierReplacements.size === 0) return ctx.code;
		const rewritten = rewriteDeniedImports(ctx.code, id, new Set(deniedSpecifierReplacements.keys()), (source) => deniedSpecifierReplacements.get(source) ?? source);
		if (!rewritten) return ctx.code;
		return {
			code: rewritten.code,
			map: normalizeSourceMap(rewritten.map) ?? null
		};
	});
	api.processAssets({
		stage: "report",
		environments: opts.environments.map((environment) => environment.name)
	}, async (context) => {
		if (!config.enabled) return;
		const envName = context.environment.name;
		const envType = getImportProtectionEnvType(config, envName);
		const envState = getOrCreateEnvState(envStates, envName);
		const matchers = getRulesForEnvironment(config, envName);
		const processFileReadCache = /* @__PURE__ */ new Map();
		const loadOriginalCodeFromCompilation = (file) => loadOriginalCode(processFileReadCache, file, context.compilation.inputFileSystem ? (target) => loadOriginalCodeFromInputFileSystem(context.compilation.inputFileSystem, target) : () => Promise.resolve(void 0));
		const relevantModules = Array.from(context.compilation.modules).filter(isImportProtectionSourceModule);
		const provider = await buildTransformResultProvider({
			modules: relevantModules,
			root: config.root,
			loadOriginalCode: loadOriginalCodeFromCompilation,
			preloaded: envState.buildTransformResults
		});
		const importLocCache = new ImportLocCache();
		const markerKindCache = /* @__PURE__ */ new Map();
		const { graph, edges } = buildCompilationGraph({
			compilation: context.compilation,
			modules: relevantModules
		});
		const liveFileEdgeKeys = new Set(edges.filter((edge) => !!edge.specifier).map((edge) => `${normalizeFilePath(edge.importer)}::${edge.specifier}::${normalizeFilePath(edge.resolved)}`));
		const survivingModules = /* @__PURE__ */ new Set();
		for (const module of relevantModules) for (const candidate of buildResolutionCandidates(getModuleFile(module))) survivingModules.add(candidate);
		const didModuleSurvive = (id) => buildResolutionCandidates(id).some((candidate) => survivingModules.has(candidate));
		for (const module of relevantModules) {
			const payload = getMockEdgePayloadFromFile(getModuleFile(module));
			if (!payload) continue;
			if (!shouldCheckImportProtectionImporter(config, payload.violation.importer)) continue;
			const info = await buildViolationInfo({
				config,
				provider,
				graph,
				importLocCache,
				envName,
				envType,
				importer: payload.violation.importer,
				source: payload.violation.specifier,
				resolved: payload.violation.resolved,
				type: "specifier",
				pattern: payload.violation.patternText,
				preferOriginalCode: true
			});
			await reportViolation({
				config,
				envState,
				compilation: context.compilation,
				rspack: context.compiler.rspack,
				info
			});
		}
		for (const edge of edges) {
			if (!edge.specifier) continue;
			if (!shouldCheckImportProtectionImporter(config, edge.importer)) continue;
			const relativeResolved = getImportProtectionRelativePath(config.root, edge.resolved);
			if (isFileExcluded(relativeResolved, matchers)) continue;
			const fileMatch = checkFileDenial(relativeResolved, matchers);
			if (fileMatch) {
				const info = await buildViolationInfo({
					config,
					provider,
					graph,
					importLocCache,
					envName,
					envType,
					importer: edge.importer,
					source: edge.specifier,
					resolved: edge.resolved,
					type: "file",
					pattern: fileMatch.pattern
				});
				await reportViolation({
					config,
					envState,
					compilation: context.compilation,
					rspack: context.compiler.rspack,
					info
				});
				continue;
			}
			const markerKind = await getMarkerKindForFile({
				config,
				provider,
				loadOriginalCode: loadOriginalCodeFromCompilation,
				markerKindCache,
				file: edge.resolved
			});
			if (!(envType === "client" && markerKind === "server" || envType === "server" && markerKind === "client")) continue;
			const info = await buildViolationInfo({
				config,
				provider,
				graph,
				importLocCache,
				envName,
				envType,
				importer: edge.importer,
				source: edge.specifier,
				resolved: edge.resolved,
				type: "marker"
			});
			await reportViolation({
				config,
				envState,
				compilation: context.compilation,
				rspack: context.compiler.rspack,
				info
			});
		}
		for (const violation of envState.deferredFileViolations) {
			const liveEdgeKey = `${normalizeFilePath(violation.importer)}::${violation.specifier}::${normalizeFilePath(violation.resolved)}`;
			if (liveFileEdgeKeys.has(liveEdgeKey)) continue;
			if (!didModuleSurvive(violation.resolved)) continue;
			if (!didModuleSurvive(violation.importer)) continue;
			const info = await buildViolationInfo({
				config,
				provider,
				graph,
				importLocCache,
				envName,
				envType,
				importer: violation.importer,
				source: violation.specifier,
				resolved: violation.resolved,
				type: "file",
				pattern: violation.pattern,
				preferOriginalCode: violation.useOriginalLocation
			});
			await reportViolation({
				config,
				envState,
				compilation: context.compilation,
				rspack: context.compiler.rspack,
				info
			});
		}
	});
}
//#endregion
export { registerImportProtection };

//# sourceMappingURL=import-protection.js.map