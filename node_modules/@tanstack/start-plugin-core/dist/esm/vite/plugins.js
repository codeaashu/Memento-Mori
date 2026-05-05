import { ENTRY_POINTS } from "../constants.js";
import { createVirtualModule } from "./createVirtualModule.js";
import { normalizePath } from "vite";
//#region src/vite/plugins.ts
function createVirtualClientEntryPlugin(opts) {
	return createVirtualModule({
		name: "tanstack-start-core:virtual-client-entry",
		moduleId: ENTRY_POINTS.client,
		enforce: "pre",
		load() {
			return `import ${JSON.stringify(normalizePath(opts.getClientEntry()).replaceAll("\\", "/"))}`;
		}
	});
}
function createPostBuildPlugin(opts) {
	return {
		name: "tanstack-start-core:post-build",
		enforce: "post",
		buildApp: {
			order: "post",
			async handler(builder) {
				const { startConfig } = opts.getConfig();
				await opts.postServerBuild({
					builder,
					startConfig
				});
			}
		}
	};
}
function createDevBaseRewritePlugin(opts) {
	return {
		name: "tanstack-start-core:dev-base-rewrite",
		configureServer(server) {
			if (!opts.shouldRewriteDevBase()) return;
			const basePrefix = opts.resolvedStartConfig.basePaths.publicBase.replace(/\/$/, "");
			server.middlewares.use((req, _res, next) => {
				if (req.url && !req.url.startsWith(basePrefix)) req.url = basePrefix + req.url;
				next();
			});
		}
	};
}
//#endregion
export { createDevBaseRewritePlugin, createPostBuildPlugin, createVirtualClientEntryPlugin };

//# sourceMappingURL=plugins.js.map