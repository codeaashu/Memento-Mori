import { ServerFunctionSerializationAdapter } from "./ServerFunctionSerializationAdapter.js";
import { hydrate } from "@tanstack/router-core/ssr/client";
import { startInstance } from "#tanstack-start-entry";
import { hasPluginAdapters, pluginSerializationAdapters } from "#tanstack-start-plugin-adapters";
import { getRouter } from "#tanstack-router-entry";
//#region src/client/hydrateStart.ts
async function hydrateStart() {
	const router = await getRouter();
	let serializationAdapters;
	if (startInstance) {
		const startOptions = await startInstance.getOptions();
		startOptions.serializationAdapters = startOptions.serializationAdapters ?? [];
		window.__TSS_START_OPTIONS__ = startOptions;
		serializationAdapters = startOptions.serializationAdapters;
		router.options.defaultSsr = startOptions.defaultSsr;
	} else {
		serializationAdapters = [];
		window.__TSS_START_OPTIONS__ = { serializationAdapters };
	}
	if (hasPluginAdapters) serializationAdapters.push(...pluginSerializationAdapters);
	serializationAdapters.push(ServerFunctionSerializationAdapter);
	if (router.options.serializationAdapters) serializationAdapters.push(...router.options.serializationAdapters);
	router.update({
		basepath: process.env.TSS_ROUTER_BASEPATH,
		serializationAdapters
	});
	if (!router.stores.matchesId.get().length) await hydrate(router);
	return router;
}
//#endregion
export { hydrateStart };

//# sourceMappingURL=hydrateStart.js.map