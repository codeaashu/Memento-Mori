const require_utils = require("../utils.cjs");
const require_invariant = require("../invariant.cjs");
const require_lru_cache = require("../lru-cache.cjs");
const require_root = require("../root.cjs");
const require_manifest = require("../manifest.cjs");
const require_constants = require("./constants.cjs");
const require_transformer = require("./serializer/transformer.cjs");
const require_seroval_plugins = require("./serializer/seroval-plugins.cjs");
const require_ssr_match_id = require("./ssr-match-id.cjs");
const require_tsrScript = require("./tsrScript.cjs");
let seroval = require("seroval");
//#region src/ssr/ssr-server.ts
const SCOPE_ID = "tsr";
const TSR_PREFIX = require_constants.GLOBAL_TSR + ".router=";
const P_PREFIX = require_constants.GLOBAL_TSR + ".p(()=>";
const P_SUFFIX = ")";
function dehydrateMatch(match) {
	const dehydratedMatch = {
		i: require_ssr_match_id.dehydrateSsrMatchId(match.id),
		u: match.updatedAt,
		s: match.status
	};
	for (const [key, shorthand] of [
		["__beforeLoadContext", "b"],
		["loaderData", "l"],
		["error", "e"],
		["ssr", "ssr"]
	]) if (match[key] !== void 0) dehydratedMatch[shorthand] = match[key];
	if (match.globalNotFound) dehydratedMatch.g = true;
	return dehydratedMatch;
}
const INITIAL_SCRIPTS = [(0, seroval.getCrossReferenceHeader)(SCOPE_ID), require_tsrScript.default];
var ScriptBuffer = class {
	constructor(router) {
		this._scriptBarrierLifted = false;
		this._cleanedUp = false;
		this._pendingMicrotask = false;
		this.router = router;
		this._queue = INITIAL_SCRIPTS.slice();
	}
	enqueue(script) {
		if (this._cleanedUp) return;
		this._queue.push(script);
		if (this._scriptBarrierLifted && !this._pendingMicrotask) {
			this._pendingMicrotask = true;
			queueMicrotask(() => {
				this._pendingMicrotask = false;
				this.injectBufferedScripts();
			});
		}
	}
	liftBarrier() {
		if (this._scriptBarrierLifted || this._cleanedUp) return;
		this._scriptBarrierLifted = true;
		if (this._queue.length > 0 && !this._pendingMicrotask) {
			this._pendingMicrotask = true;
			queueMicrotask(() => {
				this._pendingMicrotask = false;
				this.injectBufferedScripts();
			});
		}
	}
	/**
	* Flushes any pending scripts synchronously.
	* Call this before emitting onSerializationFinished to ensure all scripts are injected.
	*
	* IMPORTANT: Only injects if the barrier has been lifted. Before the barrier is lifted,
	* scripts should remain in the queue so takeBufferedScripts() can retrieve them
	*/
	flush() {
		if (!this._scriptBarrierLifted) return;
		if (this._cleanedUp) return;
		this._pendingMicrotask = false;
		const scriptsToInject = this.takeAll();
		if (scriptsToInject && this.router?.serverSsr) this.router.serverSsr.injectScript(scriptsToInject);
	}
	takeAll() {
		const bufferedScripts = this._queue;
		this._queue = [];
		if (bufferedScripts.length === 0) return;
		if (bufferedScripts.length === 1) return bufferedScripts[0] + ";document.currentScript.remove()";
		return bufferedScripts.join(";") + ";document.currentScript.remove()";
	}
	injectBufferedScripts() {
		if (this._cleanedUp) return;
		if (this._queue.length === 0) return;
		const scriptsToInject = this.takeAll();
		if (scriptsToInject && this.router?.serverSsr) this.router.serverSsr.injectScript(scriptsToInject);
	}
	cleanup() {
		this._cleanedUp = true;
		this._queue = [];
		this.router = void 0;
	}
};
const isProd = process.env.NODE_ENV === "production";
const MANIFEST_CACHE_SIZE = 100;
const manifestCaches = /* @__PURE__ */ new WeakMap();
const inlineCssCaches = /* @__PURE__ */ new WeakMap();
function getManifestCache(manifest) {
	const cache = manifestCaches.get(manifest);
	if (cache) return cache;
	const newCache = require_lru_cache.createLRUCache(MANIFEST_CACHE_SIZE);
	manifestCaches.set(manifest, newCache);
	return newCache;
}
function getInlineCssCache(manifest) {
	const cache = inlineCssCaches.get(manifest);
	if (cache) return cache;
	const newCache = require_lru_cache.createLRUCache(MANIFEST_CACHE_SIZE);
	inlineCssCaches.set(manifest, newCache);
	return newCache;
}
function getInlineCssHrefsForMatches(manifest, matches) {
	const styles = manifest?.inlineCss?.styles;
	if (!styles) return [];
	const seen = /* @__PURE__ */ new Set();
	const hrefs = [];
	for (const match of matches) {
		const assets = manifest?.routes[match.routeId]?.assets ?? [];
		for (const asset of assets) {
			const href = require_manifest.getStylesheetHref(asset);
			if (!href || seen.has(href) || styles[href] === void 0) continue;
			seen.add(href);
			hrefs.push(href);
		}
	}
	return hrefs;
}
function getInlineCssForHrefs(manifest, hrefs) {
	const styles = manifest.inlineCss?.styles;
	if (!styles || hrefs.length === 0) return void 0;
	const cacheKey = hrefs.join("\0");
	if (isProd) {
		const cached = getInlineCssCache(manifest).get(cacheKey);
		if (cached !== void 0) return cached;
	}
	const css = hrefs.map((href) => styles[href]).join("");
	if (isProd) getInlineCssCache(manifest).set(cacheKey, css);
	return css;
}
function getInlineCssAssetForMatches(manifest, matches) {
	if (!manifest?.inlineCss) return void 0;
	const css = getInlineCssForHrefs(manifest, getInlineCssHrefsForMatches(manifest, matches));
	return css === void 0 ? void 0 : require_manifest.createInlineCssStyleAsset(css);
}
function stripInlinedStylesheetAssets(manifest, routes, matches) {
	if (!manifest.inlineCss) return routes;
	const nextRoutes = {};
	for (const [routeId, route] of Object.entries(routes)) {
		const assets = route.assets?.filter((asset) => !require_manifest.isInlinableStylesheet(manifest, asset));
		const nextRoute = { ...route };
		if (assets) if (assets.length > 0) nextRoute.assets = assets;
		else delete nextRoute.assets;
		nextRoutes[routeId] = nextRoute;
	}
	if (getInlineCssAssetForMatches(manifest, matches)) {
		const rootRoute = nextRoutes["__root__"] ?? {};
		nextRoutes[require_root.rootRouteId] = {
			...rootRoute,
			assets: [require_manifest.createInlineCssPlaceholderAsset(), ...rootRoute.assets ?? []]
		};
	}
	return nextRoutes;
}
function attachRouterServerSsrUtils({ router, manifest, getRequestAssets, includeUnmatchedRouteAssets = true }) {
	router.ssr = { get manifest() {
		const requestAssets = getRequestAssets?.();
		const inlineCssAsset = getInlineCssAssetForMatches(manifest, router.stores.matches.get());
		if (!requestAssets?.length && !inlineCssAsset) return manifest;
		return {
			...manifest,
			routes: {
				...manifest?.routes,
				[require_root.rootRouteId]: {
					...manifest?.routes?.[require_root.rootRouteId],
					assets: [
						...requestAssets ?? [],
						...inlineCssAsset ? [inlineCssAsset] : [],
						...manifest?.routes?.["__root__"]?.assets ?? []
					]
				}
			}
		};
	} };
	let _dehydrated = false;
	let _serializationFinished = false;
	const renderFinishedListeners = [];
	const serializationFinishedListeners = [];
	const scriptBuffer = new ScriptBuffer(router);
	let injectedHtmlBuffer = "";
	router.serverSsr = {
		injectHtml: (html) => {
			if (!html) return;
			injectedHtmlBuffer += html;
			router.emit({ type: "onInjectedHtml" });
		},
		injectScript: (script) => {
			if (!script) return;
			const html = `<script${router.options.ssr?.nonce ? ` nonce='${router.options.ssr.nonce}'` : ""}>${script}<\/script>`;
			router.serverSsr.injectHtml(html);
		},
		dehydrate: async (opts) => {
			if (_dehydrated) {
				if (process.env.NODE_ENV !== "production") throw new Error("Invariant failed: router is already dehydrated!");
				require_invariant.invariant();
			}
			let matchesToDehydrate = router.stores.matches.get();
			if (router.isShell()) matchesToDehydrate = matchesToDehydrate.slice(0, 1);
			const matches = matchesToDehydrate.map(dehydrateMatch);
			let manifestToDehydrate = void 0;
			if (manifest) {
				const currentRouteIdsList = matchesToDehydrate.map((m) => m.routeId);
				const manifestCacheKey = `${currentRouteIdsList.join("\0")}\0includeUnmatchedRouteAssets=${includeUnmatchedRouteAssets}`;
				let filteredRoutes;
				if (isProd) filteredRoutes = getManifestCache(manifest).get(manifestCacheKey);
				if (!filteredRoutes) {
					const currentRouteIds = new Set(currentRouteIdsList);
					const nextFilteredRoutes = {};
					for (const routeId in manifest.routes) {
						const routeManifest = manifest.routes[routeId];
						if (currentRouteIds.has(routeId)) nextFilteredRoutes[routeId] = routeManifest;
						else if (includeUnmatchedRouteAssets && routeManifest.assets && routeManifest.assets.length > 0) nextFilteredRoutes[routeId] = { assets: routeManifest.assets };
					}
					filteredRoutes = stripInlinedStylesheetAssets(manifest, nextFilteredRoutes, matchesToDehydrate);
					if (isProd) getManifestCache(manifest).set(manifestCacheKey, filteredRoutes);
				}
				manifestToDehydrate = { routes: { ...filteredRoutes } };
				if (opts?.requestAssets?.length) {
					const existingRoot = manifestToDehydrate.routes[require_root.rootRouteId];
					manifestToDehydrate.routes[require_root.rootRouteId] = {
						...existingRoot,
						assets: [...opts.requestAssets, ...existingRoot?.assets ?? []]
					};
				}
			}
			const dehydratedRouter = {
				manifest: manifestToDehydrate,
				matches
			};
			const lastMatchId = matchesToDehydrate[matchesToDehydrate.length - 1]?.id;
			if (lastMatchId) dehydratedRouter.lastMatchId = require_ssr_match_id.dehydrateSsrMatchId(lastMatchId);
			const dehydratedData = await router.options.dehydrate?.();
			if (dehydratedData) dehydratedRouter.dehydratedData = dehydratedData;
			_dehydrated = true;
			const trackPlugins = { didRun: false };
			const serializationAdapters = router.options.serializationAdapters;
			const plugins = serializationAdapters ? serializationAdapters.map((t) => /* @__PURE__ */ require_transformer.makeSsrSerovalPlugin(t, trackPlugins)).concat(require_seroval_plugins.defaultSerovalPlugins) : require_seroval_plugins.defaultSerovalPlugins;
			const signalSerializationComplete = () => {
				_serializationFinished = true;
				try {
					serializationFinishedListeners.forEach((l) => l());
					router.emit({ type: "onSerializationFinished" });
				} catch (err) {
					console.error("Serialization listener error:", err);
				} finally {
					serializationFinishedListeners.length = 0;
					renderFinishedListeners.length = 0;
				}
			};
			(0, seroval.crossSerializeStream)(dehydratedRouter, {
				refs: /* @__PURE__ */ new Map(),
				plugins,
				onSerialize: (data, initial) => {
					let serialized = initial ? TSR_PREFIX + data : data;
					if (trackPlugins.didRun) serialized = P_PREFIX + serialized + P_SUFFIX;
					scriptBuffer.enqueue(serialized);
				},
				onError: (err) => {
					console.error("Serialization error:", err);
					if (err && err.stack) console.error(err.stack);
					signalSerializationComplete();
				},
				scopeId: SCOPE_ID,
				onDone: () => {
					scriptBuffer.enqueue(require_constants.GLOBAL_TSR + ".e()");
					scriptBuffer.flush();
					signalSerializationComplete();
				}
			});
		},
		isDehydrated() {
			return _dehydrated;
		},
		isSerializationFinished() {
			return _serializationFinished;
		},
		onRenderFinished: (listener) => renderFinishedListeners.push(listener),
		onSerializationFinished: (listener) => serializationFinishedListeners.push(listener),
		setRenderFinished: () => {
			try {
				renderFinishedListeners.forEach((l) => l());
			} catch (err) {
				console.error("Error in render finished listener:", err);
			} finally {
				renderFinishedListeners.length = 0;
			}
			scriptBuffer.liftBarrier();
		},
		takeBufferedScripts() {
			const scripts = scriptBuffer.takeAll();
			return {
				tag: "script",
				attrs: {
					nonce: router.options.ssr?.nonce,
					className: "$tsr",
					id: require_constants.TSR_SCRIPT_BARRIER_ID
				},
				children: scripts
			};
		},
		liftScriptBarrier() {
			scriptBuffer.liftBarrier();
		},
		takeBufferedHtml() {
			if (!injectedHtmlBuffer) return;
			const buffered = injectedHtmlBuffer;
			injectedHtmlBuffer = "";
			return buffered;
		},
		cleanup() {
			if (!router.serverSsr) return;
			renderFinishedListeners.length = 0;
			serializationFinishedListeners.length = 0;
			injectedHtmlBuffer = "";
			scriptBuffer.cleanup();
			router.serverSsr = void 0;
		}
	};
}
/**
* Get the origin for the request.
*
* SECURITY: We intentionally do NOT trust the Origin header for determining
* the router's origin. The Origin header can be spoofed by attackers, which
* could lead to SSRF-like vulnerabilities where redirects are constructed
* using a malicious origin (CVE-2024-34351).
*
* Instead, we derive the origin from request.url, which is typically set by
* the server infrastructure (not client-controlled headers).
*
* For applications behind proxies that need to trust forwarded headers,
* use the router's `origin` option to explicitly configure a trusted origin.
*/
function getOrigin(request) {
	try {
		return new URL(request.url).origin;
	} catch {}
	return "http://localhost";
}
function getNormalizedURL(url, base) {
	if (typeof url === "string") url = url.replace("\\", "%5C");
	const rawUrl = new URL(url, base);
	const { path: decodedPathname, handledProtocolRelativeURL } = require_utils.decodePath(rawUrl.pathname);
	const searchParams = new URLSearchParams(rawUrl.search);
	const normalizedHref = decodedPathname + (searchParams.size > 0 ? "?" : "") + searchParams.toString() + rawUrl.hash;
	return {
		url: new URL(normalizedHref, rawUrl.origin),
		handledProtocolRelativeURL
	};
}
//#endregion
exports.attachRouterServerSsrUtils = attachRouterServerSsrUtils;
exports.getNormalizedURL = getNormalizedURL;
exports.getOrigin = getOrigin;

//# sourceMappingURL=ssr-server.cjs.map