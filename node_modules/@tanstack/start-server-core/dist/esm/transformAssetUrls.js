import { resolveManifestAssetLink, rootRouteId } from "@tanstack/router-core";
//#region src/transformAssetUrls.ts
var hasWarnedAboutDeprecatedTransformAssetUrls = false;
function warnDeprecatedTransformAssetUrls() {
	if ((process.env.NODE_ENV === "development" || process.env.TSS_DEV_SERVER === "true") && !hasWarnedAboutDeprecatedTransformAssetUrls) {
		hasWarnedAboutDeprecatedTransformAssetUrls = true;
		console.warn("[TanStack Start] `transformAssetUrls` is deprecated. Use `transformAssets` instead.");
	}
}
function normalizeTransformAssetResult(result) {
	if (typeof result === "string") return { href: result };
	return result;
}
function resolveTransformAssetsCrossOrigin(config, kind) {
	if (!config) return void 0;
	if (typeof config === "string") return config;
	return config[kind];
}
function isObjectShorthand(transform) {
	return "prefix" in transform;
}
function resolveTransformAssetsConfig(transform) {
	if (typeof transform === "string") {
		const prefix = transform;
		return {
			type: "transform",
			transformFn: ({ url }) => ({ href: `${prefix}${url}` }),
			cache: true
		};
	}
	if (typeof transform === "function") return {
		type: "transform",
		transformFn: transform,
		cache: true
	};
	if (isObjectShorthand(transform)) {
		const { prefix, crossOrigin } = transform;
		return {
			type: "transform",
			transformFn: ({ url, kind }) => {
				const href = `${prefix}${url}`;
				if (kind === "clientEntry") return { href };
				const co = resolveTransformAssetsCrossOrigin(crossOrigin, kind);
				return co ? {
					href,
					crossOrigin: co
				} : { href };
			},
			cache: true
		};
	}
	if ("createTransform" in transform && transform.createTransform) return {
		type: "createTransform",
		createTransform: transform.createTransform,
		cache: transform.cache !== false
	};
	return {
		type: "transform",
		transformFn: typeof transform.transform === "string" ? (({ url }) => ({ href: `${transform.transform}${url}` })) : transform.transform,
		cache: transform.cache !== false
	};
}
function adaptTransformAssetUrlsToTransformAssets(transformFn) {
	return async ({ url, kind }) => ({ href: await transformFn({
		url,
		type: kind
	}) });
}
function adaptTransformAssetUrlsConfigToTransformAssets(transform) {
	warnDeprecatedTransformAssetUrls();
	if (typeof transform === "string") return transform;
	if (typeof transform === "function") return adaptTransformAssetUrlsToTransformAssets(transform);
	if ("createTransform" in transform && transform.createTransform) return {
		createTransform: async (ctx) => adaptTransformAssetUrlsToTransformAssets(await transform.createTransform(ctx)),
		cache: transform.cache,
		warmup: transform.warmup
	};
	return {
		transform: typeof transform.transform === "string" ? transform.transform : adaptTransformAssetUrlsToTransformAssets(transform.transform),
		cache: transform.cache,
		warmup: transform.warmup
	};
}
/**
* Builds the client entry `<script>` tag from a (possibly transformed) client
* entry URL and optional injected head scripts.
*/
function buildClientEntryScriptTag(clientEntry, injectedHeadScripts) {
	let script = `import(${JSON.stringify(clientEntry)})`;
	if (injectedHeadScripts) script = `${injectedHeadScripts};${script}`;
	return {
		tag: "script",
		attrs: {
			type: "module",
			async: true
		},
		children: script
	};
}
function assignManifestAssetLink(link, next) {
	if (typeof link === "string") return next.crossOrigin ? next : next.href;
	return next.crossOrigin ? next : { href: next.href };
}
async function transformManifestAssets(source, transformFn, _opts) {
	const manifest = structuredClone(source.manifest);
	for (const route of Object.values(manifest.routes)) {
		if (route.preloads) route.preloads = await Promise.all(route.preloads.map(async (link) => {
			const result = normalizeTransformAssetResult(await transformFn({
				url: resolveManifestAssetLink(link).href,
				kind: "modulepreload"
			}));
			return assignManifestAssetLink(link, {
				href: result.href,
				crossOrigin: result.crossOrigin
			});
		}));
		if (route.assets && !source.manifest.inlineCss) {
			for (const asset of route.assets) if (asset.tag === "link" && asset.attrs?.href) {
				const rel = asset.attrs.rel;
				if (!(typeof rel === "string" ? rel.split(/\s+/) : []).includes("stylesheet")) continue;
				const result = normalizeTransformAssetResult(await transformFn({
					url: asset.attrs.href,
					kind: "stylesheet"
				}));
				asset.attrs.href = result.href;
				if (result.crossOrigin) asset.attrs.crossOrigin = result.crossOrigin;
				else delete asset.attrs.crossOrigin;
			}
		}
	}
	const transformedClientEntry = normalizeTransformAssetResult(await transformFn({
		url: source.clientEntry,
		kind: "clientEntry"
	}));
	const rootRoute = manifest.routes[rootRouteId] = manifest.routes[rootRouteId] || {};
	rootRoute.assets = rootRoute.assets || [];
	rootRoute.assets.push(buildClientEntryScriptTag(transformedClientEntry.href, source.injectedHeadScripts));
	return manifest;
}
/**
* Builds a final Manifest from a StartManifestWithClientEntry without any
* URL transforms. Used when no transformAssetUrls option is provided.
*
* Returns a new manifest object so the cached base manifest is never mutated.
*/
function buildManifestWithClientEntry(source) {
	const scriptTag = buildClientEntryScriptTag(source.clientEntry, source.injectedHeadScripts);
	const baseRootRoute = source.manifest.routes[rootRouteId];
	const routes = {
		...source.manifest.routes,
		[rootRouteId]: {
			...baseRootRoute,
			assets: [...baseRootRoute?.assets || [], scriptTag]
		}
	};
	return {
		inlineCss: source.manifest.inlineCss,
		routes
	};
}
//#endregion
export { adaptTransformAssetUrlsConfigToTransformAssets, buildManifestWithClientEntry, resolveTransformAssetsConfig, transformManifestAssets };

//# sourceMappingURL=transformAssetUrls.js.map