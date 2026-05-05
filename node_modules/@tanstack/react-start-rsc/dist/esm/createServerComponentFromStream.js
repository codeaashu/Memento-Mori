"use client";
import { unwrapRscCssEnvelope } from "./rscCssEnvelope.js";
import { awaitLazyElements } from "./awaitLazyElements.js";
import { createRscProxy } from "./createRscProxy.js";
import { use } from "react";
import { trackPostProcessPromise } from "@tanstack/start-client-core";
import { createFromReadableStream } from "virtual:tanstack-rsc-browser-decode";
//#region src/createServerComponentFromStream.ts
/**
* Creates a renderable RSC proxy from a raw Flight stream.
* Client-side only - used by the client serialization adapter for `renderServerComponent`.
*
* Returns a Proxy that:
* - Can be rendered directly as `{data}` in JSX
* - Supports nested access: `{data.foo.bar}`
* - Masquerades as a React element
*/
function createRenderableFromStream(stream) {
	const { getTree, streamWrapper, cssHrefs } = setupStreamDecode(stream);
	return createRscProxy(getTree, {
		stream: streamWrapper,
		cssHrefs,
		renderable: true
	});
}
/**
* Creates a composite RSC proxy from a raw Flight stream.
* Client-side only - used by the client serialization adapter for `createCompositeComponent`.
*
* Returns a Proxy that:
* - NOT directly renderable
* - Supports nested access: `src.foo.bar`
* - Must be rendered via `<CompositeComponent src={...} />`
*/
function createCompositeFromStream(stream, options) {
	const { getTree, streamWrapper, cssHrefs } = setupStreamDecode(stream);
	return createRscProxy(getTree, {
		stream: streamWrapper,
		cssHrefs,
		renderable: false,
		slotUsagesStream: options?.slotUsagesStream
	});
}
/**
* Shared stream decode setup for both renderable and composite.
*/
function setupStreamDecode(stream) {
	const decodeThenable = createFromReadableStream(stream);
	const cssHrefs = /* @__PURE__ */ new Set();
	let cachedTree = void 0;
	let cacheReady = false;
	const transformedTreePromise = Promise.resolve(decodeThenable).then(async (result) => {
		await awaitLazyElements(result, (href) => {
			cssHrefs.add(href);
		});
		cachedTree = unwrapRscCssEnvelope(result);
		cacheReady = true;
		return cachedTree;
	});
	trackPostProcessPromise(transformedTreePromise);
	const streamWrapper = { createReplayStream: () => stream };
	const getTree = () => {
		if (cacheReady) return cachedTree;
		return use(transformedTreePromise);
	};
	return {
		getTree,
		streamWrapper,
		cssHrefs
	};
}
//#endregion
export { createCompositeFromStream, createRenderableFromStream };

//# sourceMappingURL=createServerComponentFromStream.js.map