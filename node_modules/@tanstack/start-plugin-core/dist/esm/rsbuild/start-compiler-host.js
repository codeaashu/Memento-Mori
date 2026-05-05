import { TRANSFORM_ID_REGEX } from "../constants.js";
import { cleanId } from "../start-compiler/utils.js";
import { detectKindsInCode } from "../start-compiler/compiler.js";
import { getTransformCodeFilterForEnv } from "../start-compiler/config.js";
import { createStartCompiler, matchesCodeFilters, mergeServerFnsById } from "../start-compiler/host.js";
import { RSBUILD_ENVIRONMENT_NAMES } from "./planning.js";
import { pathToFileURL } from "node:url";
import { AsyncLocalStorage } from "node:async_hooks";
//#region src/rsbuild/start-compiler-host.ts
/**
* Rsbuild dev server fn ref strategy: uses file:// URLs for absolute paths.
* These are directly importable by Node's ESM VM runner without any bundler
* path conventions (unlike Vite's /@id/ prefix).
*/
var rsbuildDevServerFnModuleSpecifierEncoder = ({ extractedFilename }) => pathToFileURL(extractedFilename).href;
/**
* Registers the shared StartCompiler as rsbuild transforms for client + ssr environments.
*
* Uses `api.transform()` to hook into the rsbuild loader pipeline, and the
* transform context's native `resolve()` for module resolution.
*/
function registerStartCompilerTransforms(api, opts) {
	const compilers = /* @__PURE__ */ new Map();
	const inputFileSystems = /* @__PURE__ */ new Map();
	const transformContextStorage = new AsyncLocalStorage();
	const serverFnsById = opts.serverFnsById ?? {};
	const getRoot = () => typeof opts.root === "function" ? opts.root() : opts.root;
	const onServerFnsById = (d) => {
		mergeServerFnsById(serverFnsById, d);
		opts.onServerFnsByIdChange?.();
	};
	const isDev = api.context.action === "dev";
	const mode = isDev ? "dev" : "build";
	const environments = [{
		name: RSBUILD_ENVIRONMENT_NAMES.client,
		type: "client"
	}, {
		name: RSBUILD_ENVIRONMENT_NAMES.server,
		type: "server"
	}];
	const codeFilters = {
		client: getTransformCodeFilterForEnv("client"),
		server: getTransformCodeFilterForEnv("server", { compilerTransforms: opts.compilerTransforms })
	};
	for (const env of environments) {
		const envCodeFilters = codeFilters[env.type];
		const compilerTransforms = env.name === RSBUILD_ENVIRONMENT_NAMES.server ? opts.compilerTransforms : void 0;
		const serverFnProviderModuleDirectives = env.name === opts.providerEnvName ? opts.serverFnProviderModuleDirectives : void 0;
		api.transform({
			test: TRANSFORM_ID_REGEX[0],
			environments: [env.name],
			order: "pre"
		}, async (ctx) => {
			return transformContextStorage.run(ctx, async () => {
				const code = ctx.code;
				const id = ctx.resourcePath + (ctx.resourceQuery || "");
				if (!matchesCodeFilters(code, envCodeFilters)) return code;
				let compiler = compilers.get(env.name);
				if (!compiler) {
					const root = getRoot();
					compiler = createStartCompiler({
						env: env.type,
						envName: env.name,
						root,
						mode,
						framework: opts.framework,
						providerEnvName: opts.providerEnvName,
						generateFunctionId: opts.generateFunctionId,
						compilerTransforms,
						serverFnProviderModuleDirectives,
						onServerFnsById,
						getKnownServerFns: () => serverFnsById,
						encodeModuleSpecifierInDev: isDev ? rsbuildDevServerFnModuleSpecifierEncoder : void 0,
						loadModule: async (moduleId) => {
							const activeCtx = transformContextStorage.getStore();
							if (!activeCtx) throw new Error(`could not load module ${moduleId}: missing active rsbuild transform context for ${env.name}`);
							const inputFileSystem = inputFileSystems.get(env.name);
							if (!inputFileSystem) throw new Error(`could not load module ${moduleId}: missing rspack input filesystem for ${env.name}`);
							const cleanedId = cleanId(moduleId);
							activeCtx.addDependency(cleanedId);
							const loaded = await readFileFromInputFileSystem(inputFileSystem, cleanedId);
							const moduleCode = Buffer.isBuffer(loaded) ? loaded.toString("utf8") : loaded;
							compiler.ingestModule({
								code: moduleCode,
								id: cleanedId
							});
						},
						resolveId: async (source, importer) => {
							const activeCtx = transformContextStorage.getStore();
							if (!activeCtx) throw new Error(`could not resolve ${source}: missing active rsbuild transform context for ${env.name}`);
							const context = importer ? importer.replace(/[/\\][^/\\]*$/, "") : getRoot();
							return await new Promise((resolve, reject) => {
								activeCtx.resolve(context, source, (error, resolved) => {
									if (error) {
										reject(error);
										return;
									}
									if (!resolved) {
										resolve(null);
										return;
									}
									resolve(cleanId(resolved));
								});
							});
						}
					});
					compilers.set(env.name, compiler);
				}
				const detectedKinds = detectKindsInCode(code, env.type, { compilerTransforms });
				const result = await compiler.compile({
					id,
					code,
					detectedKinds
				});
				if (!result) return code;
				return {
					code: result.code,
					map: result.map ?? null
				};
			});
		});
	}
	api.modifyRspackConfig((config, utils) => {
		config.plugins.push({ apply(compiler) {
			if (compiler.inputFileSystem) inputFileSystems.set(utils.environment.name, compiler.inputFileSystem);
			compiler.hooks.watchRun.tap("TanStackStartCompilerModuleInvalidation", (watchCompiler) => {
				const startCompiler = compilers.get(utils.environment.name);
				if (!startCompiler) return;
				for (const file of watchCompiler.modifiedFiles ?? []) startCompiler.invalidateModule(file);
				for (const file of watchCompiler.removedFiles ?? []) startCompiler.invalidateModule(file);
			});
		} });
	});
	return { serverFnsById };
}
function readFileFromInputFileSystem(inputFileSystem, file) {
	return new Promise((resolve, reject) => {
		inputFileSystem.readFile(file, (error, data) => {
			if (error) {
				reject(error);
				return;
			}
			if (data == null) {
				reject(/* @__PURE__ */ new Error(`could not read module source for ${file}`));
				return;
			}
			resolve(data);
		});
	});
}
//#endregion
export { registerStartCompilerTransforms };

//# sourceMappingURL=start-compiler-host.js.map