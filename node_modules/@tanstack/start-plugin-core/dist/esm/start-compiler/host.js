import { StartCompiler, getLookupKindsForEnv } from "./compiler.js";
import { getLookupConfigurationsForEnv } from "./config.js";
//#region src/start-compiler/host.ts
function createStartCompiler(options) {
	return new StartCompiler({
		env: options.env,
		envName: options.envName,
		root: options.root,
		lookupKinds: getLookupKindsForEnv(options.env, { compilerTransforms: options.compilerTransforms }),
		lookupConfigurations: getLookupConfigurationsForEnv(options.env, options.framework, { compilerTransforms: options.compilerTransforms }),
		mode: options.mode,
		framework: options.framework,
		providerEnvName: options.providerEnvName,
		generateFunctionId: options.generateFunctionId,
		onServerFnsById: options.onServerFnsById,
		compilerTransforms: options.compilerTransforms,
		serverFnProviderModuleDirectives: options.serverFnProviderModuleDirectives,
		getKnownServerFns: options.getKnownServerFns,
		devServerFnModuleSpecifierEncoder: options.encodeModuleSpecifierInDev,
		loadModule: options.loadModule,
		resolveId: options.resolveId
	});
}
function mergeServerFnsById(current, next) {
	for (const [id, fn] of Object.entries(next)) {
		const existing = current[id];
		if (existing) {
			current[id] = {
				...fn,
				isClientReferenced: existing.isClientReferenced || fn.isClientReferenced
			};
			continue;
		}
		current[id] = fn;
	}
}
function matchesCodeFilters(code, filters) {
	for (const pattern of filters) if (pattern.test(code)) return true;
	return false;
}
//#endregion
export { createStartCompiler, matchesCodeFilters, mergeServerFnsById };

//# sourceMappingURL=host.js.map