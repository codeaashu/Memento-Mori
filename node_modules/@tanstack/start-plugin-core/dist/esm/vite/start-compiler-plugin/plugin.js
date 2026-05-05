import { SERVER_FN_LOOKUP, TRANSFORM_ID_REGEX, VITE_ENVIRONMENT_NAMES } from "../../constants.js";
import { resolveViteId } from "../../utils.js";
import { createVirtualModule } from "../createVirtualModule.js";
import { cleanId } from "../../start-compiler/utils.js";
import { detectKindsInCode } from "../../start-compiler/compiler.js";
import { getTransformCodeFilterForEnv } from "../../start-compiler/config.js";
import { createStartCompiler, mergeServerFnsById } from "../../start-compiler/host.js";
import { generateServerFnResolverModule } from "../../start-compiler/server-fn-resolver-module.js";
import { createViteDevServerFnModuleSpecifierEncoder, decodeViteDevServerModuleSpecifier } from "./module-specifier.js";
import { mergeHotUpdateModules } from "./hot-update.js";
import { resolve } from "pathe";
import { VIRTUAL_MODULES } from "@tanstack/start-server-core";
//#region src/vite/start-compiler-plugin/plugin.ts
var validateServerFnIdVirtualModule = `virtual:tanstack-start-validate-server-fn-id`;
var TSS_SERVERFN_SPLIT_PARAM = "tss-serverfn-split";
function invalidateMatchingFileModules(environment, ids, shouldInvalidate) {
	const seen = /* @__PURE__ */ new Set();
	const invalidatedModules = [];
	for (const id of ids) {
		const fileModules = environment.moduleGraph.getModulesByFile(cleanId(id));
		if (!fileModules) continue;
		for (const fileModule of fileModules) {
			if (!shouldInvalidate(fileModule)) continue;
			environment.moduleGraph.invalidateModule(fileModule, seen);
			invalidatedModules.push(fileModule);
		}
	}
	return invalidatedModules;
}
function invalidateServerFnProviderModules(environment, ids) {
	return invalidateMatchingFileModules(environment, ids, (fileModule) => fileModule.id?.includes(TSS_SERVERFN_SPLIT_PARAM) ?? false);
}
function invalidateServerFnLookupModules(environment, ids) {
	invalidateMatchingFileModules(environment, ids, (fileModule) => fileModule.id?.includes("server-fn-module-lookup") ?? false);
}
function getServerFnProviderIds(ids) {
	const providerIds = /* @__PURE__ */ new Set();
	for (const id of ids) {
		const cleanedId = cleanId(id);
		providerIds.add(`${cleanedId}?${TSS_SERVERFN_SPLIT_PARAM}`);
	}
	return providerIds;
}
function invalidateModuleNodes(environment, modules) {
	const seen = /* @__PURE__ */ new Set();
	for (const mod of modules) environment.moduleGraph.invalidateModule(mod, seen);
}
function getDevServerFnValidatorModule() {
	return `
export async function getServerFnById(id, _access) {
  const validateIdImport = ${JSON.stringify(validateServerFnIdVirtualModule)} + '?id=' + id
  await import(/* @vite-ignore */ '/@id/__x00__' + validateIdImport)
  const decoded = Buffer.from(id, 'base64url').toString('utf8')
  const devServerFn = JSON.parse(decoded)
  const mod = await import(/* @vite-ignore */ devServerFn.file)
  return mod[devServerFn.export]
}
`;
}
function parseIdQuery(id) {
	if (!id.includes("?")) return {
		filename: id,
		query: {}
	};
	const [filename, rawQuery] = id.split(`?`, 2);
	return {
		filename,
		query: Object.fromEntries(new URLSearchParams(rawQuery))
	};
}
function startCompilerPlugin(opts) {
	const compilers = /* @__PURE__ */ new Map();
	const serverFnsById = {};
	const onServerFnsById = (d) => {
		mergeServerFnsById(serverFnsById, d);
	};
	let root = process.cwd();
	const ssrEnvName = VITE_ENVIRONMENT_NAMES.server;
	const ssrIsProvider = opts.providerEnvName === ssrEnvName;
	const appliedResolverEnvironments = new Set(ssrIsProvider ? [opts.providerEnvName] : [ssrEnvName, opts.providerEnvName]);
	function perEnvServerFnPlugin(environment) {
		const compilerTransforms = environment.name === opts.providerEnvName ? opts.compilerTransforms : void 0;
		const serverFnProviderModuleDirectives = environment.name === opts.providerEnvName ? opts.serverFnProviderModuleDirectives : void 0;
		const transformCodeFilter = getTransformCodeFilterForEnv(environment.type, { compilerTransforms });
		return {
			name: `tanstack-start-core::server-fn:${environment.name}`,
			enforce: "pre",
			applyToEnvironment(env) {
				return env.name === environment.name;
			},
			configResolved(config) {
				root = config.root;
			},
			transform: {
				filter: {
					id: {
						exclude: new RegExp(`${SERVER_FN_LOOKUP}$`),
						include: TRANSFORM_ID_REGEX
					},
					code: { include: transformCodeFilter }
				},
				async handler(code, id) {
					let compiler = compilers.get(this.environment.name);
					if (!compiler) {
						const mode = this.environment.mode === "build" ? "build" : "dev";
						compiler = createStartCompiler({
							env: environment.type,
							envName: environment.name,
							root,
							mode,
							framework: opts.framework,
							providerEnvName: opts.providerEnvName,
							generateFunctionId: opts.generateFunctionId,
							compilerTransforms,
							serverFnProviderModuleDirectives,
							onServerFnsById,
							getKnownServerFns: () => serverFnsById,
							encodeModuleSpecifierInDev: mode === "dev" ? createViteDevServerFnModuleSpecifierEncoder(root) : void 0,
							loadModule: async (id) => {
								if (mode === "build") {
									const code = (await this.load({ id })).code ?? "";
									compiler.ingestModule({
										code,
										id
									});
									return;
								}
								if (this.environment.mode !== "dev") this.error(`could not load module ${id}: unknown environment mode ${this.environment.mode}`);
								await this.environment.transformRequest(`${id}?${SERVER_FN_LOOKUP}`);
							},
							resolveId: async (source, importer) => {
								const r = await this.resolve(source, importer);
								if (r) {
									if (!r.external) return cleanId(r.id);
								}
								return null;
							}
						});
						compilers.set(this.environment.name, compiler);
					}
					const detectedKinds = detectKindsInCode(code, environment.type, { compilerTransforms });
					return await compiler.compile({
						id,
						code,
						detectedKinds
					});
				}
			},
			hotUpdate(ctx) {
				const compiler = compilers.get(this.environment.name);
				const idsToInvalidate = /* @__PURE__ */ new Set();
				const transitiveCompilerImportersToInvalidate = /* @__PURE__ */ new Set();
				const importerModulesToInvalidate = /* @__PURE__ */ new Set();
				ctx.modules.forEach((m) => {
					if (m.id) {
						idsToInvalidate.add(m.id);
						const deleted = compiler?.invalidateModule(m.id);
						if (deleted) transitiveCompilerImportersToInvalidate.add(cleanId(m.id));
						if (deleted) m.importers.forEach((importer) => {
							if (importer.id) {
								idsToInvalidate.add(importer.id);
								importerModulesToInvalidate.add(importer);
								transitiveCompilerImportersToInvalidate.add(cleanId(importer.id));
							}
						});
					}
				});
				const finishHotUpdate = async () => {
					if (environment.type === "server" && compiler) {
						const pendingImporters = [...transitiveCompilerImportersToInvalidate];
						const seenImporters = new Set(pendingImporters);
						while (pendingImporters.length > 0) {
							const importerId = pendingImporters.pop();
							const nestedImporters = await compiler.getTransitiveImporters(importerId);
							for (const nestedImporterId of nestedImporters) {
								if (seenImporters.has(nestedImporterId)) continue;
								seenImporters.add(nestedImporterId);
								pendingImporters.push(nestedImporterId);
							}
						}
						for (const importerId of seenImporters) {
							idsToInvalidate.add(importerId);
							compiler.invalidateModule(importerId);
						}
					}
					invalidateModuleNodes(this.environment, importerModulesToInvalidate);
					invalidateServerFnLookupModules(this.environment, idsToInvalidate);
					if (environment.type !== "server") return;
					invalidateModuleNodes(this.environment, ctx.modules);
					const providerIdsToInvalidate = getServerFnProviderIds(idsToInvalidate);
					for (const providerId of providerIdsToInvalidate) compiler?.invalidateModule(providerId);
					const providerModules = invalidateServerFnProviderModules(this.environment, [...idsToInvalidate, ...providerIdsToInvalidate]);
					return mergeHotUpdateModules(ctx.modules, providerModules);
				};
				return finishHotUpdate();
			}
		};
	}
	return [
		...opts.environments.map(perEnvServerFnPlugin),
		{
			name: "tanstack-start-core:capture-server-fn-module-lookup",
			apply: "serve",
			applyToEnvironment(env) {
				return !!opts.environments.find((e) => e.name === env.name);
			},
			transform: {
				filter: { id: new RegExp(`${SERVER_FN_LOOKUP}$`) },
				handler(code, id) {
					compilers.get(this.environment.name)?.ingestModule({
						code,
						id: cleanId(id)
					});
				}
			}
		},
		{
			name: "tanstack-start-core:validate-server-fn-id",
			apply: "serve",
			load: {
				filter: { id: new RegExp(resolveViteId(validateServerFnIdVirtualModule)) },
				async handler(id) {
					const fnId = parseIdQuery(id).query.id;
					if (fnId && serverFnsById[fnId]) return `export {}`;
					if (fnId) try {
						const decoded = JSON.parse(Buffer.from(fnId, "base64url").toString("utf8"));
						if (typeof decoded.file === "string" && typeof decoded.export === "string") {
							const sourceFile = decodeViteDevServerModuleSpecifier(decoded.file);
							if (sourceFile) {
								const absPath = resolve(root, sourceFile);
								if (this.environment.mode !== "dev") this.error(`could not validate server function ID ${fnId}: unknown environment mode ${this.environment.mode}`);
								await this.environment.transformRequest(`${absPath}?${SERVER_FN_LOOKUP}`);
								if (serverFnsById[fnId]) return `export {}`;
							}
						}
					} catch {}
					this.error(`Invalid server function ID: ${fnId}`);
				}
			}
		},
		createVirtualModule({
			name: "tanstack-start-core:server-fn-resolver",
			moduleId: VIRTUAL_MODULES.serverFnResolver,
			enforce: "pre",
			applyToEnvironment: (env) => {
				return appliedResolverEnvironments.has(env.name);
			},
			load() {
				if (this.environment.name !== opts.providerEnvName) {
					const mod = opts.environments.find((e) => e.name === this.environment.name)?.getServerFnById;
					if (mod) return mod;
					this.error(`No getServerFnById implementation found for caller environment: ${this.environment.name}`);
				}
				if (this.environment.mode !== "build") return getDevServerFnValidatorModule();
				return generateServerFnResolverModule({
					serverFnsById,
					includeClientReferencedCheck: !ssrIsProvider
				});
			}
		})
	];
}
//#endregion
export { startCompilerPlugin };

//# sourceMappingURL=plugin.js.map