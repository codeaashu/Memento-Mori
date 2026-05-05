import { START_ENVIRONMENT_NAMES } from "../constants.js";
import { createVirtualModule } from "./createVirtualModule.js";
import { EMPTY_SERIALIZATION_ADAPTERS_MODULE, generateSerializationAdaptersModule } from "../serialization-adapters-module.js";
import { VIRTUAL_MODULES } from "@tanstack/start-server-core";
//#region src/vite/serialization-adapters-plugin.ts
function serializationAdaptersPlugin(opts) {
	return createVirtualModule({
		name: "tanstack-start:plugin-adapters",
		moduleId: VIRTUAL_MODULES.pluginAdapters,
		enforce: "pre",
		load() {
			const adapters = opts.adapters;
			if (!adapters || adapters.length === 0) return EMPTY_SERIALIZATION_ADAPTERS_MODULE;
			if (this.environment.name === START_ENVIRONMENT_NAMES.client) return generateSerializationAdaptersModule({
				adapters,
				runtime: "client"
			});
			if (this.environment.name === START_ENVIRONMENT_NAMES.server) return generateSerializationAdaptersModule({
				adapters,
				runtime: "server"
			});
			return EMPTY_SERIALIZATION_ADAPTERS_MODULE;
		}
	});
}
//#endregion
export { serializationAdaptersPlugin };

//# sourceMappingURL=serialization-adapters-plugin.js.map