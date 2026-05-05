//#region src/manifest.ts
function getAssetCrossOrigin(assetCrossOrigin, kind) {
	if (!assetCrossOrigin) return;
	if (typeof assetCrossOrigin === "string") return assetCrossOrigin;
	return assetCrossOrigin[kind];
}
function resolveManifestAssetLink(link) {
	if (typeof link === "string") return {
		href: link,
		crossOrigin: void 0
	};
	return link;
}
function getStylesheetHref(asset) {
	if (asset.tag !== "link") return void 0;
	const rel = asset.attrs?.rel;
	const href = asset.attrs?.href;
	if (typeof href !== "string") return void 0;
	if (!(typeof rel === "string" ? rel.split(/\s+/) : []).includes("stylesheet")) return void 0;
	return href;
}
function isInlinableStylesheet(manifest, asset) {
	const href = getStylesheetHref(asset);
	return !!href && manifest?.inlineCss?.styles[href] !== void 0;
}
function createInlineCssStyleAsset(css) {
	return {
		tag: "style",
		attrs: { suppressHydrationWarning: true },
		inlineCss: true,
		children: css
	};
}
function createInlineCssPlaceholderAsset() {
	return {
		tag: "style",
		attrs: { suppressHydrationWarning: true },
		inlineCss: true
	};
}
//#endregion
export { createInlineCssPlaceholderAsset, createInlineCssStyleAsset, getAssetCrossOrigin, getStylesheetHref, isInlinableStylesheet, resolveManifestAssetLink };

//# sourceMappingURL=manifest.js.map