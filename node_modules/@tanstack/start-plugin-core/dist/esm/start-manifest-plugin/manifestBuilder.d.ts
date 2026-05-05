import { getRouteFilePathsFromModuleIds, normalizeViteClientBuild, normalizeViteClientChunk } from '../vite/start-manifest-plugin/normalized-client-build.js';
import { RouterManagedTag } from '@tanstack/router-core';
import { NormalizedClientBuild, NormalizedClientChunk } from '../types.js';
type RouteTreeRoute = {
    filePath?: string;
    preloads?: Array<string>;
    assets?: Array<RouterManagedTag>;
    children?: Array<string>;
};
type RouteTreeRoutes = Record<string, RouteTreeRoute>;
interface ScannedClientChunks {
    entryChunk: NormalizedClientChunk;
    chunksByFileName: ReadonlyMap<string, NormalizedClientChunk>;
    routeChunksByFilePath: ReadonlyMap<string, Array<NormalizedClientChunk>>;
}
interface ManifestAssetResolvers {
    getAssetPath: (fileName: string) => string;
    getChunkPreloads: (chunk: NormalizedClientChunk) => Array<string>;
    getStylesheetAsset: (cssFile: string) => RouterManagedTag;
}
export interface StartManifest {
    routes: Record<string, RouteTreeRoute>;
    clientEntry: string;
    inlineCss?: {
        styles: Record<string, string>;
    };
}
export declare function appendUniqueStrings(target: Array<string> | undefined, source: Array<string>): string[] | undefined;
export declare function appendUniqueAssets(target: Array<RouterManagedTag> | undefined, source: Array<RouterManagedTag>): RouterManagedTag[] | undefined;
export declare function buildStartManifest(options: {
    clientBuild: NormalizedClientBuild;
    routeTreeRoutes: RouteTreeRoutes;
    basePath: string;
    inlineCss?: boolean;
    additionalRouteAssets?: Partial<Record<string, ReadonlyArray<RouterManagedTag>>>;
}): StartManifest;
export declare function serializeStartManifest(startManifest: StartManifest): string;
export declare function scanClientChunks(clientBuild: NormalizedClientBuild): ScannedClientChunks;
export declare function createManifestAssetResolvers(basePath: string): ManifestAssetResolvers;
export declare function createChunkCssAssetCollector(options: {
    chunksByFileName: ReadonlyMap<string, NormalizedClientChunk>;
    getStylesheetAsset: (cssFile: string) => RouterManagedTag;
}): {
    getChunkCssAssets: (chunk: NormalizedClientChunk) => Array<RouterManagedTag>;
};
export declare function buildRouteManifestRoutes(options: {
    routeTreeRoutes: RouteTreeRoutes;
    routeChunksByFilePath: ReadonlyMap<string, ReadonlyArray<NormalizedClientChunk>>;
    chunksByFileName: ReadonlyMap<string, NormalizedClientChunk>;
    entryChunk: NormalizedClientChunk;
    assetResolvers: ManifestAssetResolvers;
    additionalRouteAssets?: Partial<Record<string, ReadonlyArray<RouterManagedTag>>>;
}): Record<string, RouteTreeRoute>;
export { getRouteFilePathsFromModuleIds, normalizeViteClientBuild, normalizeViteClientChunk, };
