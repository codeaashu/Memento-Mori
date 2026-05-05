import { RENDERABLE_RSC, RSC_SLOT_USAGES_STREAM, SERVER_COMPONENT_STREAM, isServerComponent } from "./ServerComponentTypes.js";
import { unwrapRscCssEnvelope } from "./rscCssEnvelope.js";
import { awaitLazyElements } from "./awaitLazyElements.js";
import { createRscProxy } from "./createRscProxy.js";
import { getStartContext } from "@tanstack/start-storage-context";
import { createSerializationAdapter } from "@tanstack/react-router";
import { AsyncLocalStorage } from "node:async_hooks";
import { RawStream } from "@tanstack/router-core";
import { createFromReadableStream, setOnClientReference } from "virtual:tanstack-rsc-ssr-decode";
//#region src/serialization.server.ts
var decodeCollectorStorage = new AsyncLocalStorage();
var jsCollectorStorage = new AsyncLocalStorage();
setOnClientReference(({ deps, runtime }) => {
	const ctx = getStartContext({ throwIfNotFound: false });
	const cssCollector = decodeCollectorStorage.getStore();
	if (cssCollector) for (const href of deps.css) cssCollector.add(href);
	const jsCollector = jsCollectorStorage.getStore();
	if (jsCollector) for (const href of deps.js) jsCollector.add(href);
	if (!ctx || runtime === "rsbuild") return;
	if (!ctx.requestAssets) ctx.requestAssets = [];
	const seenHrefs = /* @__PURE__ */ new Set();
	for (const asset of ctx.requestAssets) if (asset.tag === "link" && asset.attrs?.href) seenHrefs.add(asset.attrs.href);
	for (const href of deps.js) {
		if (seenHrefs.has(href)) continue;
		seenHrefs.add(href);
		ctx.requestAssets.push({
			tag: "link",
			attrs: {
				rel: "modulepreload",
				href
			}
		});
	}
	for (const href of deps.css) {
		if (seenHrefs.has(href)) continue;
		seenHrefs.add(href);
		ctx.requestAssets.push({
			tag: "link",
			attrs: {
				rel: "preload",
				href,
				as: "style"
			}
		});
	}
});
var ssrHandler = {
	async decode(stream) {
		const readableStream = stream.createReplayStream();
		const cssCollector = /* @__PURE__ */ new Set();
		const jsCollector = /* @__PURE__ */ new Set();
		return decodeCollectorStorage.run(cssCollector, async () => {
			return jsCollectorStorage.run(jsCollector, async () => {
				const decodedTree = await createFromReadableStream(readableStream);
				await awaitLazyElements(decodedTree, (href) => {
					cssCollector.add(href);
				});
				return {
					tree: unwrapRscCssEnvelope(decodedTree),
					cssHrefs: cssCollector.size > 0 ? cssCollector : void 0,
					jsPreloads: jsCollector.size > 0 ? jsCollector : void 0
				};
			});
		});
	},
	createRenderableProxy(stream, decoded) {
		return createRscProxy(() => decoded.tree, {
			stream,
			cssHrefs: decoded.cssHrefs,
			jsPreloads: decoded.jsPreloads,
			renderable: true
		});
	},
	createCompositeProxy(stream, decoded, slotUsagesStream) {
		return createRscProxy(() => decoded.tree, {
			stream,
			cssHrefs: decoded.cssHrefs,
			jsPreloads: decoded.jsPreloads,
			renderable: false,
			slotUsagesStream
		});
	}
};
globalThis.__RSC_SSR__ = ssrHandler;
/**
* Helper to check if a value is a renderable RSC (from renderServerComponent).
* The value can be either an object (proxy target) or a function (stub for server functions).
*/
function isRenderableRsc(value) {
	if (value === null || value === void 0) return false;
	if (typeof value !== "object" && typeof value !== "function") return false;
	return RENDERABLE_RSC in value && value[RENDERABLE_RSC] === true;
}
/**
* Server-side serialization adapter for RSC (renderable + composite).
*/
var adapter = createSerializationAdapter({
	key: "$RSC",
	test: (value) => {
		return isServerComponent(value);
	},
	toSerializable: (component) => {
		const stream = component[SERVER_COMPONENT_STREAM].createReplayStream();
		const kind = isRenderableRsc(component) ? "renderable" : "composite";
		const slotUsagesStream = kind === "composite" && process.env.NODE_ENV === "development" && RSC_SLOT_USAGES_STREAM in component ? component[RSC_SLOT_USAGES_STREAM] : void 0;
		return {
			kind,
			stream: new RawStream(stream, { hint: "text" }),
			slotUsagesStream
		};
	},
	fromSerializable: () => {
		throw new Error("Server should never deserialize RSC data");
	}
});
/**
* Factory function for server-side RSC serialization adapter.
*/
var rscSerializationAdapter = () => [adapter];
//#endregion
export { rscSerializationAdapter };

//# sourceMappingURL=serialization.server.js.map