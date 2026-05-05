Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
let react = require("react");
let _tanstack_react_query = require("@tanstack/react-query");
let _tanstack_router_ssr_query_core = require("@tanstack/router-ssr-query-core");
let react_jsx_runtime = require("react/jsx-runtime");
//#region src/index.tsx
function setupRouterSsrQueryIntegration(opts) {
	(0, _tanstack_router_ssr_query_core.setupCoreRouterSsrQueryIntegration)(opts);
	if (opts.wrapQueryClient === false) return;
	const OGWrap = opts.router.options.Wrap || react.Fragment;
	opts.router.options.Wrap = ({ children }) => {
		return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_tanstack_react_query.QueryClientProvider, {
			client: opts.queryClient,
			children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(OGWrap, { children })
		});
	};
}
//#endregion
exports.setupRouterSsrQueryIntegration = setupRouterSsrQueryIntegration;

//# sourceMappingURL=index.cjs.map