import { RSBUILD_ENVIRONMENT_NAMES } from "./planning.js";
import { NodeRequest, sendNodeResponse } from "srvx/node";
//#region src/rsbuild/dev-server.ts
/**
* Returns a `server.setup` function for rsbuild v2.
*
* Two middleware positions are used:
*
* 1. **Setup body** (BEFORE built-ins): Intercepts `/_serverFn/` URLs so
*    they never reach rsbuild's htmlFallback/htmlCompletion middleware,
*    which can swallow long base64 function IDs.
*
* 2. **Returned callback** (AFTER built-ins, BEFORE fallback): Handles
*    all remaining SSR requests (page navigations). This position lets
*    rsbuild's asset middleware serve compiled JS/CSS first.
*
* See rsbuild source: devMiddlewares.ts `applyDefaultMiddlewares()`.
*/
function createServerSetup(opts) {
	return (context) => {
		if (context.action !== "dev") return () => {};
		const serverFnBase = opts.serverFnBasePath;
		const handleSSR = async (req, res, next) => {
			const ssrEnv = context.server.environments[RSBUILD_ENVIRONMENT_NAMES.server];
			if (!ssrEnv) {
				console.error(`[tanstack-start] SSR environment "${RSBUILD_ENVIRONMENT_NAMES.server}" not found`);
				return next();
			}
			try {
				const serverEntry = await ssrEnv.loadBundle("index");
				if (req.originalUrl) req.url = req.originalUrl;
				const webReq = new NodeRequest({
					req,
					res
				});
				return sendNodeResponse(res, await serverEntry.default.fetch(webReq));
			} catch (e) {
				console.error("[tanstack-start] SSR error:", e);
				if (new NodeRequest({
					req,
					res
				}).headers.get("content-type")?.includes("application/json")) return sendNodeResponse(res, new Response(JSON.stringify({
					status: 500,
					error: "Internal Server Error",
					message: "An unexpected error occurred. Please try again later.",
					timestamp: (/* @__PURE__ */ new Date()).toISOString()
				}, null, 2), {
					status: 500,
					headers: { "Content-Type": "application/json" }
				}));
				return sendNodeResponse(res, new Response(`<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8" /><title>Error</title></head>
  <body>
    <h1>Internal Server Error</h1>
    <pre>${e instanceof Error ? e.message : String(e)}</pre>
  </body>
</html>`, {
					status: 500,
					headers: { "Content-Type": "text/html" }
				}));
			}
		};
		context.server.middlewares.use(async (req, res, next) => {
			if ((req.url || "/").startsWith(serverFnBase)) return handleSSR(req, res, next);
			return next();
		});
		return () => {
			context.server.middlewares.use(handleSSR);
		};
	};
}
//#endregion
export { createServerSetup };

//# sourceMappingURL=dev-server.js.map