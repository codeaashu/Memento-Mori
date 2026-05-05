import { cleanId } from "./utils.js";
import { handleCreateServerFn } from "./handleCreateServerFn.js";
import { handleCreateMiddleware } from "./handleCreateMiddleware.js";
import { handleCreateIsomorphicFn } from "./handleCreateIsomorphicFn.js";
import { handleEnvOnlyFn } from "./handleEnvOnly.js";
import { handleClientOnlyJSX } from "./handleClientOnlyJSX.js";
import * as t from "@babel/types";
import { deadCodeElimination, findReferencedIdentifiers, generateFromAst, parseAst } from "@tanstack/router-utils";
import crypto from "node:crypto";
import babel from "@babel/core";
//#region src/start-compiler/compiler.ts
function isLookupKind(kind) {
	return kind in BuiltInLookupSetup || isExternalLookupKind(kind);
}
function getExternalLookupKind(transform) {
	return `External:${transform.name}`;
}
function isExternalLookupKind(kind) {
	return typeof kind === "string" && kind.startsWith("External:");
}
function isCompilerTransformEnabledForEnv(transform, env) {
	if (!transform.environment) return true;
	if (Array.isArray(transform.environment)) return transform.environment.includes(env);
	return transform.environment === env;
}
var BuiltInLookupSetup = {
	ServerFn: {
		type: "methodChain",
		candidateCallIdentifier: new Set(["handler"])
	},
	Middleware: {
		type: "methodChain",
		candidateCallIdentifier: new Set([
			"server",
			"client",
			"createMiddlewares"
		])
	},
	IsomorphicFn: {
		type: "methodChain",
		candidateCallIdentifier: new Set(["server", "client"])
	},
	ServerOnlyFn: {
		type: "directCall",
		factoryNames: new Set(["createServerOnlyFn"])
	},
	ClientOnlyFn: {
		type: "directCall",
		factoryNames: new Set(["createClientOnlyFn"])
	},
	ClientOnlyJSX: {
		type: "jsx",
		componentName: "ClientOnly"
	}
};
var KindDetectionPatterns = {
	ServerFn: /\bcreateServerFn\b|\.\s*handler\s*\(/,
	Middleware: /createMiddleware/,
	IsomorphicFn: /createIsomorphicFn/,
	ServerOnlyFn: /createServerOnlyFn/,
	ClientOnlyFn: /createClientOnlyFn/,
	ClientOnlyJSX: /<ClientOnly|import\s*\{[^}]*\bClientOnly\b/
};
var LookupKindsPerEnv = {
	client: new Set([
		"Middleware",
		"ServerFn",
		"IsomorphicFn",
		"ServerOnlyFn",
		"ClientOnlyFn"
	]),
	server: new Set([
		"ServerFn",
		"IsomorphicFn",
		"ServerOnlyFn",
		"ClientOnlyFn",
		"ClientOnlyJSX"
	])
};
function getLookupKindsForEnv(env, opts) {
	const kinds = new Set(LookupKindsPerEnv[env]);
	for (const transform of opts?.compilerTransforms ?? []) if (isCompilerTransformEnabledForEnv(transform, env)) kinds.add(getExternalLookupKind(transform));
	return kinds;
}
/**
* Registry mapping each LookupKind to its handler function.
* When adding a new kind, add its handler here.
*/
var BuiltInKindHandlers = {
	ServerFn: handleCreateServerFn,
	Middleware: handleCreateMiddleware,
	IsomorphicFn: handleCreateIsomorphicFn,
	ServerOnlyFn: handleEnvOnlyFn,
	ClientOnlyFn: handleEnvOnlyFn
};
var BuiltInKindHandlerOrder = [
	"ServerFn",
	"Middleware",
	"IsomorphicFn",
	"ServerOnlyFn",
	"ClientOnlyFn"
];
var AllBuiltInLookupKinds = Object.keys(BuiltInLookupSetup);
/**
* Detects which LookupKinds are present in the code using string matching.
* This is a fast pre-scan before AST parsing to limit the work done during compilation.
*/
function detectKindsInCode(code, env, opts) {
	const detected = /* @__PURE__ */ new Set();
	const validForEnv = getLookupKindsForEnv(env, opts);
	for (const kind of AllBuiltInLookupKinds) if (validForEnv.has(kind) && KindDetectionPatterns[kind].test(code)) detected.add(kind);
	for (const transform of opts?.compilerTransforms ?? []) {
		if (!isCompilerTransformEnabledForEnv(transform, env)) continue;
		if (transform.detect.test(code)) detected.add(getExternalLookupKind(transform));
	}
	return detected;
}
var IdentifierToKinds = /* @__PURE__ */ new Map();
for (const kind of AllBuiltInLookupKinds) {
	const setup = BuiltInLookupSetup[kind];
	if (setup.type === "methodChain") for (const id of setup.candidateCallIdentifier) {
		let kinds = IdentifierToKinds.get(id);
		if (!kinds) {
			kinds = /* @__PURE__ */ new Set();
			IdentifierToKinds.set(id, kinds);
		}
		kinds.add(kind);
	}
}
function getLookupSetup(kind, externalLookupSetup) {
	if (kind in BuiltInLookupSetup) return BuiltInLookupSetup[kind];
	if (isExternalLookupKind(kind)) return externalLookupSetup?.get(kind);
}
/**
* Checks if all kinds in the set are guaranteed to be top-level only.
* Only ServerFn is always declared at module level (must be assigned to a variable).
* Middleware, IsomorphicFn, ServerOnlyFn, ClientOnlyFn can be nested inside functions.
* When all kinds are top-level-only, we can use a fast scan instead of full traversal.
*/
function areAllKindsTopLevelOnly(kinds) {
	return kinds.size === 1 && kinds.has("ServerFn");
}
/**
* Checks if we need to detect JSX elements (e.g., <ClientOnly>).
*/
function needsJSXDetection(kinds, externalLookupSetup) {
	for (const kind of kinds) if (getLookupSetup(kind, externalLookupSetup)?.type === "jsx") return true;
	return false;
}
/**
* Checks if a CallExpression is a direct-call candidate for NESTED detection.
* Returns true if the callee is a known factory function name.
* This is stricter than top-level detection because we need to filter out
* invocations of existing server functions (e.g., `myServerFn()`).
*/
function isNestedDirectCallCandidate(node, lookupKinds, externalLookupSetup) {
	let calleeName;
	if (t.isIdentifier(node.callee)) calleeName = node.callee.name;
	else if (t.isMemberExpression(node.callee) && t.isIdentifier(node.callee.property)) calleeName = node.callee.property.name;
	if (!calleeName) return false;
	for (const kind of lookupKinds) {
		if (isExternalLookupKind(kind)) continue;
		const setup = getLookupSetup(kind, externalLookupSetup);
		if (setup?.type === "directCall" && setup.factoryNames.has(calleeName)) return true;
	}
	return false;
}
function isSimpleDirectCallExpression(node) {
	return t.isIdentifier(node.callee) || t.isMemberExpression(node.callee) && t.isIdentifier(node.callee.object) && t.isIdentifier(node.callee.property);
}
function isTopLevelDirectCallCandidateNode(node) {
	return isSimpleDirectCallExpression(node);
}
/**
* Checks if a CallExpression path is a top-level direct-call candidate.
* Top-level means the call is the init of a VariableDeclarator at program level.
* We accept any simple identifier call or namespace call at top level
* (e.g., `createServerOnlyFn()`, `TanStackStart.createServerOnlyFn()`) and let
* resolution verify it. This handles renamed imports.
*/
function isTopLevelDirectCallCandidate(path) {
	const node = path.node;
	if (!isSimpleDirectCallExpression(node)) return false;
	const parent = path.parent;
	if (!t.isVariableDeclarator(parent) || parent.init !== node) return false;
	const grandParent = path.parentPath.parent;
	if (!t.isVariableDeclaration(grandParent)) return false;
	return t.isProgram(path.parentPath.parentPath?.parent);
}
function isDirectCallCandidateForKind(kind, externalLookupSetup) {
	return getLookupSetup(kind, externalLookupSetup)?.type === "directCall";
}
function hasBuiltInDirectCallKinds(kinds) {
	for (const kind of kinds) {
		if (isExternalLookupKind(kind)) continue;
		if (BuiltInLookupSetup[kind].type === "directCall") return true;
	}
	return false;
}
function hasExternalLookupKinds(kinds) {
	for (const kind of kinds) if (isExternalLookupKind(kind)) return true;
	return false;
}
function hasExternalDirectCallCandidates(candidates) {
	return candidates.identifiers.size > 0 || candidates.namespaces.size > 0;
}
function getExternalDirectCallCandidateKind(path, candidates) {
	const node = path.node;
	if (t.isIdentifier(node.callee)) {
		const kind = candidates.identifiers.get(node.callee.name);
		if (!kind) return void 0;
		return path.scope.getBinding(node.callee.name)?.path.isImportSpecifier() ? kind : void 0;
	}
	if (t.isMemberExpression(node.callee) && t.isIdentifier(node.callee.object) && t.isIdentifier(node.callee.property)) {
		const kind = candidates.namespaces.get(node.callee.object.name)?.get(node.callee.property.name);
		if (!kind) return void 0;
		return path.scope.getBinding(node.callee.object.name)?.path.isImportNamespaceSpecifier() ? kind : void 0;
	}
}
var StartCompiler = class {
	moduleCache = /* @__PURE__ */ new Map();
	initialized = false;
	validLookupKinds;
	externalTransformsByKind = /* @__PURE__ */ new Map();
	externalLookupSetup = /* @__PURE__ */ new Map();
	externalDirectCallKindsBySource = /* @__PURE__ */ new Map();
	resolveIdCache = /* @__PURE__ */ new Map();
	exportResolutionCache = /* @__PURE__ */ new Map();
	knownRootImports = /* @__PURE__ */ new Map();
	entryIdToFunctionId = /* @__PURE__ */ new Map();
	functionIds = /* @__PURE__ */ new Set();
	constructor(options) {
		this.options = options;
		this.validLookupKinds = options.lookupKinds;
		for (const transform of options.compilerTransforms ?? []) {
			const kind = getExternalLookupKind(transform);
			if (!this.validLookupKinds.has(kind)) continue;
			this.externalTransformsByKind.set(kind, transform);
			const factoryNames = /* @__PURE__ */ new Set();
			for (const entry of transform.imports) {
				factoryNames.add(entry.rootExport);
				let rootExports = this.externalDirectCallKindsBySource.get(entry.libName);
				if (!rootExports) {
					rootExports = /* @__PURE__ */ new Map();
					this.externalDirectCallKindsBySource.set(entry.libName, rootExports);
				}
				rootExports.set(entry.rootExport, kind);
			}
			this.externalLookupSetup.set(kind, {
				type: "directCall",
				factoryNames
			});
		}
	}
	/**
	* Generates a unique function ID for a server function.
	* In dev mode, uses a base64-encoded JSON with file path and export name.
	* In build mode, uses SHA256 hash or custom generator.
	*/
	generateFunctionId(opts) {
		if (this.mode === "dev") {
			const encodeModuleSpecifier = this.options.devServerFnModuleSpecifierEncoder;
			if (!encodeModuleSpecifier) throw new Error("devServerFnModuleSpecifierEncoder is required in dev mode.");
			const serverFn = {
				file: encodeModuleSpecifier({
					extractedFilename: opts.extractedFilename,
					root: this.options.root
				}),
				export: opts.functionName
			};
			return Buffer.from(JSON.stringify(serverFn), "utf8").toString("base64url");
		}
		const entryId = `${opts.filename}--${opts.functionName}`;
		let functionId = this.entryIdToFunctionId.get(entryId);
		if (functionId === void 0) {
			const knownFn = Object.values(this.options.getKnownServerFns()).find((serverFn) => serverFn.functionName === opts.functionName && serverFn.extractedFilename === opts.extractedFilename);
			if (knownFn) functionId = knownFn.functionId;
			if (this.options.generateFunctionId) functionId ??= this.options.generateFunctionId({
				filename: opts.filename,
				functionName: opts.functionName
			});
			if (!functionId) functionId = crypto.createHash("sha256").update(entryId).digest("hex");
			if (this.functionIds.has(functionId)) {
				let deduplicatedId;
				let iteration = 0;
				do
					deduplicatedId = `${functionId}_${++iteration}`;
				while (this.functionIds.has(deduplicatedId));
				functionId = deduplicatedId;
			}
			this.entryIdToFunctionId.set(entryId, functionId);
			this.functionIds.add(functionId);
		}
		return functionId;
	}
	get mode() {
		return this.options.mode ?? "dev";
	}
	getExternalDirectCallCandidates(kinds, moduleInfo) {
		const identifiers = /* @__PURE__ */ new Map();
		const namespaces = /* @__PURE__ */ new Map();
		if (this.externalDirectCallKindsBySource.size === 0) return {
			identifiers,
			namespaces
		};
		for (const [localName, binding] of moduleInfo.bindings) {
			if (binding.type !== "import") continue;
			const rootExports = this.externalDirectCallKindsBySource.get(binding.source);
			if (!rootExports) continue;
			if (binding.importedName === "*") {
				const namespaceExports = /* @__PURE__ */ new Map();
				for (const [rootExport, kind] of rootExports) if (kinds.has(kind)) namespaceExports.set(rootExport, kind);
				if (namespaceExports.size > 0) namespaces.set(localName, namespaceExports);
			} else {
				const kind = rootExports.get(binding.importedName);
				if (kind && kinds.has(kind)) identifiers.set(localName, kind);
			}
		}
		return {
			identifiers,
			namespaces
		};
	}
	async resolveIdCached(id, importer) {
		if (this.mode === "dev") return this.options.resolveId(id, importer);
		const cacheKey = importer ? `${importer}::${id}` : id;
		const cached = this.resolveIdCache.get(cacheKey);
		if (cached !== void 0) return cached;
		const resolved = await this.options.resolveId(id, importer);
		this.resolveIdCache.set(cacheKey, resolved);
		return resolved;
	}
	getExportResolutionCache(moduleId) {
		let cache = this.exportResolutionCache.get(moduleId);
		if (!cache) {
			cache = /* @__PURE__ */ new Map();
			this.exportResolutionCache.set(moduleId, cache);
		}
		return cache;
	}
	init() {
		this.knownRootImports.set("@tanstack/start-fn-stubs", new Map([
			["createIsomorphicFn", "IsomorphicFn"],
			["createServerOnlyFn", "ServerOnlyFn"],
			["createClientOnlyFn", "ClientOnlyFn"]
		]));
		this.knownRootImports.set("@tanstack/start-client-core", new Map([
			["createIsomorphicFn", "IsomorphicFn"],
			["createServerOnlyFn", "ServerOnlyFn"],
			["createClientOnlyFn", "ClientOnlyFn"]
		]));
		for (const config of this.options.lookupConfigurations) {
			let libExports = this.knownRootImports.get(config.libName);
			if (!libExports) {
				libExports = /* @__PURE__ */ new Map();
				this.knownRootImports.set(config.libName, libExports);
			}
			libExports.set(config.rootExport, config.kind);
			if (config.kind !== "Root") {
				if (getLookupSetup(config.kind, this.externalLookupSetup)?.type === "jsx") continue;
			}
			const libId = config.libName;
			let rootModule = this.moduleCache.get(libId);
			if (!rootModule) {
				rootModule = {
					bindings: /* @__PURE__ */ new Map(),
					exports: /* @__PURE__ */ new Map(),
					id: libId,
					reExportAllSources: []
				};
				this.moduleCache.set(libId, rootModule);
			}
			rootModule.exports.set(config.rootExport, config.rootExport);
			rootModule.exports.set("*", config.rootExport);
			rootModule.bindings.set(config.rootExport, {
				type: "var",
				init: null,
				resolvedKind: config.kind
			});
			this.moduleCache.set(libId, rootModule);
		}
		this.initialized = true;
	}
	/**
	* Extracts bindings and exports from an already-parsed AST.
	*/
	extractModuleInfo(ast, id) {
		const bindings = /* @__PURE__ */ new Map();
		const exports = /* @__PURE__ */ new Map();
		const reExportAllSources = [];
		for (const node of ast.program.body) if (t.isImportDeclaration(node)) {
			const source = node.source.value;
			for (const s of node.specifiers) if (t.isImportSpecifier(s)) {
				const importedName = t.isIdentifier(s.imported) ? s.imported.name : s.imported.value;
				bindings.set(s.local.name, {
					type: "import",
					source,
					importedName
				});
			} else if (t.isImportDefaultSpecifier(s)) bindings.set(s.local.name, {
				type: "import",
				source,
				importedName: "default"
			});
			else if (t.isImportNamespaceSpecifier(s)) bindings.set(s.local.name, {
				type: "import",
				source,
				importedName: "*"
			});
		} else if (t.isVariableDeclaration(node)) {
			for (const decl of node.declarations) if (t.isIdentifier(decl.id)) bindings.set(decl.id.name, {
				type: "var",
				init: decl.init ?? null
			});
		} else if (t.isExportNamedDeclaration(node)) {
			if (node.declaration) {
				if (t.isVariableDeclaration(node.declaration)) {
					for (const d of node.declaration.declarations) if (t.isIdentifier(d.id)) {
						exports.set(d.id.name, d.id.name);
						bindings.set(d.id.name, {
							type: "var",
							init: d.init ?? null
						});
					}
				}
			}
			for (const sp of node.specifiers) if (t.isExportNamespaceSpecifier(sp)) exports.set(sp.exported.name, sp.exported.name);
			else if (t.isExportSpecifier(sp)) {
				const local = sp.local.name;
				const exported = t.isIdentifier(sp.exported) ? sp.exported.name : sp.exported.value;
				exports.set(exported, local);
				if (node.source) bindings.set(local, {
					type: "import",
					source: node.source.value,
					importedName: local
				});
			}
		} else if (t.isExportDefaultDeclaration(node)) {
			const d = node.declaration;
			if (t.isIdentifier(d)) exports.set("default", d.name);
			else {
				const synth = "__default_export__";
				bindings.set(synth, {
					type: "var",
					init: d
				});
				exports.set("default", synth);
			}
		} else if (t.isExportAllDeclaration(node)) reExportAllSources.push(node.source.value);
		const info = {
			id,
			bindings,
			exports,
			reExportAllSources
		};
		this.moduleCache.set(id, info);
		return info;
	}
	ingestModule({ code, id, parserFilename }) {
		const ast = parseAst({
			code,
			filename: parserFilename ?? cleanId(id)
		});
		return {
			info: this.extractModuleInfo(ast, id),
			ast
		};
	}
	invalidateModule(id) {
		const normalizedId = cleanId(id);
		let hasCachedModule = false;
		for (const moduleId of Array.from(this.moduleCache.keys())) if (cleanId(moduleId) === normalizedId) {
			this.moduleCache.delete(moduleId);
			hasCachedModule = true;
		}
		for (const [moduleId, moduleInfo] of this.moduleCache) {
			if (this.knownRootImports.has(moduleId)) continue;
			for (const binding of moduleInfo.bindings.values()) binding.resolvedKind = void 0;
		}
		this.resolveIdCache.clear();
		this.exportResolutionCache.clear();
		return hasCachedModule;
	}
	async getTransitiveImporters(id) {
		const discoveredImporters = /* @__PURE__ */ new Set();
		const pendingTargets = [cleanId(id)];
		const visitedTargets = /* @__PURE__ */ new Set();
		const resolveCache = /* @__PURE__ */ new Map();
		const resolveSource = (source, importer) => {
			const cacheKey = `${importer}::${source}`;
			let resolved = resolveCache.get(cacheKey);
			if (!resolved) {
				resolved = this.resolveIdCached(source, importer);
				resolveCache.set(cacheKey, resolved);
			}
			return resolved;
		};
		while (pendingTargets.length > 0) {
			const targetId = pendingTargets.pop();
			if (visitedTargets.has(targetId)) continue;
			visitedTargets.add(targetId);
			const importerIds = await Promise.all(Array.from(this.moduleCache.values()).map(async (moduleInfo) => {
				if (this.knownRootImports.has(moduleInfo.id)) return null;
				const moduleId = cleanId(moduleInfo.id);
				if (moduleId === targetId) return null;
				const importSources = new Set(moduleInfo.reExportAllSources);
				for (const binding of moduleInfo.bindings.values()) if (binding.type === "import") importSources.add(binding.source);
				for (const source of importSources) {
					const resolved = await resolveSource(source, moduleInfo.id);
					if (resolved && cleanId(resolved) === targetId) return moduleId;
				}
				return null;
			}));
			for (const importerId of importerIds) {
				if (!importerId || discoveredImporters.has(importerId)) continue;
				discoveredImporters.add(importerId);
				pendingTargets.push(importerId);
			}
		}
		return discoveredImporters;
	}
	async compile({ code, id, parserFilename, detectedKinds }) {
		if (!this.initialized) await this.init();
		const fileKinds = detectedKinds ? new Set([...detectedKinds].filter((k) => this.validLookupKinds.has(k))) : this.validLookupKinds;
		if (fileKinds.size === 0) return null;
		const hasExternalKinds = hasExternalLookupKinds(fileKinds);
		const checkDirectCalls = hasBuiltInDirectCallKinds(fileKinds) || fileKinds.has("ServerFn") && !hasExternalKinds && hasBuiltInDirectCallKinds(this.validLookupKinds);
		const canUseFastPath = areAllKindsTopLevelOnly(fileKinds);
		const { ast } = this.ingestModule({
			code,
			id,
			parserFilename
		});
		const candidatePaths = [];
		const chainCallPaths = /* @__PURE__ */ new Map();
		const jsxCandidatePaths = [];
		const checkJSX = needsJSXDetection(fileKinds, this.externalLookupSetup);
		const moduleInfo = this.moduleCache.get(id);
		const externalDirectCallCandidates = this.getExternalDirectCallCandidates(fileKinds, moduleInfo);
		const checkExternalDirectCalls = hasExternalDirectCallCandidates(externalDirectCallCandidates);
		if (canUseFastPath) {
			const candidateIndices = [];
			for (let i = 0; i < ast.program.body.length; i++) {
				const node = ast.program.body[i];
				let declarations;
				if (t.isVariableDeclaration(node)) declarations = node.declarations;
				else if (t.isExportNamedDeclaration(node) && node.declaration) {
					if (t.isVariableDeclaration(node.declaration)) declarations = node.declaration.declarations;
				}
				if (declarations) {
					for (const decl of declarations) if (decl.init && t.isCallExpression(decl.init)) {
						if (isMethodChainCandidate(decl.init, fileKinds) || checkDirectCalls && isTopLevelDirectCallCandidateNode(decl.init)) {
							candidateIndices.push(i);
							break;
						}
					}
				}
			}
			if (candidateIndices.length === 0) return null;
			babel.traverse(ast, { Program(programPath) {
				const bodyPaths = programPath.get("body");
				for (const idx of candidateIndices) {
					const stmtPath = bodyPaths[idx];
					if (!stmtPath) continue;
					stmtPath.traverse({ CallExpression(path) {
						const node = path.node;
						const parent = path.parent;
						if (t.isMemberExpression(parent) && t.isCallExpression(path.parentPath.parent)) {
							chainCallPaths.set(node, path);
							return;
						}
						if (isMethodChainCandidate(node, fileKinds)) {
							candidatePaths.push({ path });
							return;
						}
						if (checkExternalDirectCalls) {
							const kind = getExternalDirectCallCandidateKind(path, externalDirectCallCandidates);
							if (kind) {
								candidatePaths.push({
									path,
									kind
								});
								return;
							}
						}
						if (isTopLevelDirectCallCandidate(path)) candidatePaths.push({ path });
					} });
				}
				programPath.stop();
			} });
		} else babel.traverse(ast, {
			CallExpression: (path) => {
				const node = path.node;
				const parent = path.parent;
				if (t.isMemberExpression(parent) && t.isCallExpression(path.parentPath.parent)) {
					chainCallPaths.set(node, path);
					return;
				}
				if (isMethodChainCandidate(node, fileKinds)) {
					candidatePaths.push({ path });
					return;
				}
				if (checkExternalDirectCalls) {
					const kind = getExternalDirectCallCandidateKind(path, externalDirectCallCandidates);
					if (kind) {
						candidatePaths.push({
							path,
							kind
						});
						return;
					}
				}
				if (checkDirectCalls && isTopLevelDirectCallCandidate(path)) {
					candidatePaths.push({ path });
					return;
				}
				if (checkDirectCalls) {
					if (isNestedDirectCallCandidate(node, fileKinds, this.externalLookupSetup)) {
						candidatePaths.push({ path });
						return;
					}
				}
			},
			JSXElement: (path) => {
				if (!checkJSX) return;
				const nameNode = path.node.openingElement.name;
				if (!t.isJSXIdentifier(nameNode)) return;
				const componentName = nameNode.name;
				const binding = moduleInfo.bindings.get(componentName);
				if (!binding || binding.type !== "import") return;
				const knownExports = this.knownRootImports.get(binding.source);
				if (!knownExports) return;
				if (knownExports.get(binding.importedName) !== "ClientOnlyJSX") return;
				jsxCandidatePaths.push(path);
			}
		});
		if (candidatePaths.length === 0 && jsxCandidatePaths.length === 0) return null;
		const resolvedCandidates = [];
		const unresolvedCandidates = [];
		for (const candidate of candidatePaths) if (candidate.kind) resolvedCandidates.push({
			path: candidate.path,
			kind: candidate.kind
		});
		else unresolvedCandidates.push(candidate);
		if (unresolvedCandidates.length > 0) resolvedCandidates.push(...await Promise.all(unresolvedCandidates.map(async (candidate) => ({
			path: candidate.path,
			kind: await this.resolveExprKind(candidate.path.node, id)
		}))));
		const validCandidates = resolvedCandidates.filter(({ path, kind }) => {
			if (!this.validLookupKinds.has(kind)) return false;
			if (isLookupKind(kind) && kind !== "ClientOnlyJSX" && !isMethodChainCandidate(path.node, fileKinds)) return isDirectCallCandidateForKind(kind, this.externalLookupSetup);
			return true;
		});
		if (validCandidates.length === 0 && jsxCandidatePaths.length === 0) return null;
		const pathsToRewrite = [];
		for (const { path, kind } of validCandidates) {
			const node = path.node;
			const methodChain = {
				middleware: null,
				inputValidator: null,
				handler: null,
				server: null,
				client: null
			};
			let currentNode = node;
			let currentPath = path;
			while (true) {
				const callee = currentNode.callee;
				if (!t.isMemberExpression(callee)) break;
				if (t.isIdentifier(callee.property)) {
					const name = callee.property.name;
					if (name in methodChain) {
						const args = currentPath.get("arguments");
						const firstArgPath = Array.isArray(args) && args.length > 0 ? args[0] ?? null : null;
						methodChain[name] = {
							callPath: currentPath,
							firstArgPath
						};
					}
				}
				if (!t.isCallExpression(callee.object)) break;
				currentNode = callee.object;
				const nextPath = chainCallPaths.get(currentNode);
				if (!nextPath) break;
				currentPath = nextPath;
			}
			pathsToRewrite.push({
				path,
				kind,
				methodChain
			});
		}
		const refIdents = findReferencedIdentifiers(ast);
		const context = {
			ast,
			id,
			code,
			env: this.options.env,
			envName: this.options.envName,
			mode: this.mode,
			root: this.options.root,
			framework: this.options.framework,
			providerEnvName: this.options.providerEnvName,
			types: t,
			parseExpression: (expressionCode) => babel.template.expression(expressionCode, { placeholderPattern: false })(),
			generateFunctionId: (opts) => this.generateFunctionId(opts),
			getKnownServerFns: this.options.getKnownServerFns,
			serverFnProviderModuleDirectives: this.options.serverFnProviderModuleDirectives,
			onServerFnsById: this.options.onServerFnsById
		};
		const candidatesByKind = /* @__PURE__ */ new Map();
		for (const { path: candidatePath, kind, methodChain } of pathsToRewrite) {
			const candidate = {
				path: candidatePath,
				methodChain
			};
			const existing = candidatesByKind.get(kind);
			if (existing) existing.push(candidate);
			else candidatesByKind.set(kind, [candidate]);
		}
		this.runExternalTransforms("pre", candidatesByKind, context);
		for (const kind of BuiltInKindHandlerOrder) {
			const candidates = candidatesByKind.get(kind);
			if (!candidates) continue;
			const handler = BuiltInKindHandlers[kind];
			handler(candidates, context, kind);
		}
		this.runExternalTransforms("post", candidatesByKind, context);
		for (const jsxPath of jsxCandidatePaths) handleClientOnlyJSX(jsxPath, { env: "server" });
		deadCodeElimination(ast, refIdents);
		const result = generateFromAst(ast, {
			sourceMaps: true,
			sourceFileName: id,
			filename: id
		});
		if (result.map) result.map.sourcesContent = [code];
		return result;
	}
	runExternalTransforms(order, candidatesByKind, context) {
		for (const [kind, transform] of this.externalTransformsByKind) {
			if ((transform.order ?? "pre") !== order) continue;
			const candidates = candidatesByKind.get(kind);
			if (!candidates) continue;
			transform.transform(candidates, context);
		}
	}
	async resolveIdentifierKind(ident, id, visited = /* @__PURE__ */ new Set()) {
		const binding = (await this.getModuleInfo(id)).bindings.get(ident);
		if (!binding) return "None";
		if (binding.resolvedKind) return binding.resolvedKind;
		const vKey = `${id}:${ident}`;
		if (visited.has(vKey)) return "None";
		visited.add(vKey);
		const resolvedKind = await this.resolveBindingKind(binding, id, visited);
		binding.resolvedKind = resolvedKind;
		return resolvedKind;
	}
	/**
	* Recursively find an export in a module, following `export * from` chains.
	* Returns the module info and binding if found, or undefined if not found.
	*/
	async findExportInModule(moduleInfo, exportName, visitedModules = /* @__PURE__ */ new Set()) {
		const isBuildMode = this.mode === "build";
		if (isBuildMode && visitedModules.size === 0) {
			const moduleCache = this.exportResolutionCache.get(moduleInfo.id);
			if (moduleCache) {
				const cached = moduleCache.get(exportName);
				if (cached !== void 0) return cached ?? void 0;
			}
		}
		if (visitedModules.has(moduleInfo.id)) return;
		visitedModules.add(moduleInfo.id);
		const localBindingName = moduleInfo.exports.get(exportName);
		if (localBindingName) {
			const binding = moduleInfo.bindings.get(localBindingName);
			if (binding) {
				const result = {
					moduleInfo,
					binding
				};
				if (isBuildMode) this.getExportResolutionCache(moduleInfo.id).set(exportName, result);
				return result;
			}
		}
		if (moduleInfo.reExportAllSources.length > 0) {
			const results = await Promise.all(moduleInfo.reExportAllSources.map(async (reExportSource) => {
				const reExportTarget = await this.resolveIdCached(reExportSource, moduleInfo.id);
				if (reExportTarget) {
					const reExportModule = await this.getModuleInfo(reExportTarget);
					return this.findExportInModule(reExportModule, exportName, visitedModules);
				}
			}));
			for (const result of results) if (result) {
				if (isBuildMode) this.getExportResolutionCache(moduleInfo.id).set(exportName, result);
				return result;
			}
		}
		if (isBuildMode) this.getExportResolutionCache(moduleInfo.id).set(exportName, null);
	}
	async resolveBindingKind(binding, fileId, visited = /* @__PURE__ */ new Set()) {
		if (binding.resolvedKind) return binding.resolvedKind;
		if (binding.type === "import") {
			const knownExports = this.knownRootImports.get(binding.source);
			if (knownExports) {
				const kind = knownExports.get(binding.importedName);
				if (kind) {
					binding.resolvedKind = kind;
					return kind;
				}
			}
			const target = await this.resolveIdCached(binding.source, fileId);
			if (!target) return "None";
			const importedModule = await this.getModuleInfo(target);
			const found = await this.findExportInModule(importedModule, binding.importedName);
			if (!found) return "None";
			const { moduleInfo: foundModule, binding: foundBinding } = found;
			if (foundBinding.resolvedKind) return foundBinding.resolvedKind;
			const resolvedKind = await this.resolveBindingKind(foundBinding, foundModule.id, visited);
			foundBinding.resolvedKind = resolvedKind;
			return resolvedKind;
		}
		const resolvedKind = await this.resolveExprKind(binding.init, fileId, visited);
		if (isLookupKind(resolvedKind) && getLookupSetup(resolvedKind, this.externalLookupSetup)?.type === "directCall" && binding.init && t.isCallExpression(binding.init)) {
			binding.resolvedKind = "None";
			return "None";
		}
		binding.resolvedKind = resolvedKind;
		return resolvedKind;
	}
	async resolveExprKind(expr, fileId, visited = /* @__PURE__ */ new Set()) {
		if (!expr) return "None";
		while (t.isTSAsExpression(expr) || t.isTSNonNullExpression(expr) || t.isParenthesizedExpression(expr)) expr = expr.expression;
		let result = "None";
		if (t.isCallExpression(expr)) {
			if (!t.isExpression(expr.callee)) return "None";
			const calleeKind = await this.resolveCalleeKind(expr.callee, fileId, visited);
			if (calleeKind === "Root" || calleeKind === "Builder") return "Builder";
			if (t.isMemberExpression(expr.callee)) {
				if (this.validLookupKinds.has(calleeKind)) return calleeKind;
			}
			if (t.isIdentifier(expr.callee)) {
				if (this.validLookupKinds.has(calleeKind)) return calleeKind;
			}
		} else if (t.isMemberExpression(expr) && t.isIdentifier(expr.property)) result = await this.resolveCalleeKind(expr.object, fileId, visited);
		if (result === "None" && t.isIdentifier(expr)) result = await this.resolveIdentifierKind(expr.name, fileId, visited);
		return result;
	}
	async resolveCalleeKind(callee, fileId, visited = /* @__PURE__ */ new Set()) {
		if (t.isIdentifier(callee)) return this.resolveIdentifierKind(callee.name, fileId, visited);
		if (t.isMemberExpression(callee) && t.isIdentifier(callee.property)) {
			const prop = callee.property.name;
			const possibleKinds = IdentifierToKinds.get(prop);
			if (possibleKinds) {
				const base = await this.resolveExprKind(callee.object, fileId, visited);
				for (const kind of possibleKinds) {
					if (!this.validLookupKinds.has(kind)) continue;
					if (kind === "ServerFn") {
						if (base === "Root" || base === "Builder") return "ServerFn";
					} else if (kind === "Middleware") {
						if (base === "Root" || base === "Builder" || base === "Middleware") return "Middleware";
					} else if (kind === "IsomorphicFn") {
						if (base === "Root" || base === "Builder" || base === "IsomorphicFn") return "IsomorphicFn";
					}
				}
			}
			if (t.isIdentifier(callee.object)) {
				const binding = (await this.getModuleInfo(fileId)).bindings.get(callee.object.name);
				if (binding && binding.type === "import" && binding.importedName === "*") {
					const knownKind = this.knownRootImports.get(binding.source)?.get(callee.property.name);
					if (knownKind) return knownKind;
					const targetModuleId = await this.resolveIdCached(binding.source, fileId);
					if (targetModuleId) {
						const targetModule = await this.getModuleInfo(targetModuleId);
						const localBindingName = targetModule.exports.get(callee.property.name);
						if (localBindingName) {
							const exportedBinding = targetModule.bindings.get(localBindingName);
							if (exportedBinding) return await this.resolveBindingKind(exportedBinding, targetModule.id, visited);
						}
					} else return "None";
				}
			}
			return this.resolveExprKind(callee.object, fileId, visited);
		}
		return this.resolveExprKind(callee, fileId, visited);
	}
	async getModuleInfo(id) {
		let cached = this.moduleCache.get(id);
		if (cached) return cached;
		await this.options.loadModule(id);
		cached = this.moduleCache.get(id);
		if (!cached) throw new Error(`could not load module info for ${id}`);
		return cached;
	}
};
/**
* Checks if a CallExpression has a method chain pattern that matches any of the lookup kinds.
* E.g., `.handler()`, `.server()`, `.client()`, `.createMiddlewares()`
*/
function isMethodChainCandidate(node, lookupKinds) {
	const callee = node.callee;
	if (!t.isMemberExpression(callee) || !t.isIdentifier(callee.property)) return false;
	const possibleKinds = IdentifierToKinds.get(callee.property.name);
	if (possibleKinds) {
		for (const kind of possibleKinds) if (lookupKinds.has(kind)) return true;
	}
	return false;
}
//#endregion
export { KindDetectionPatterns, StartCompiler, detectKindsInCode, getExternalLookupKind, getLookupKindsForEnv, isCompilerTransformEnabledForEnv };

//# sourceMappingURL=compiler.js.map