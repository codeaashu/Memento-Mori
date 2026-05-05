import { AnyRoute } from '@tanstack/router-core';
import { StartManifestWithClientEntry } from './transformAssetUrls.js';
/**
 * @description Returns the router manifest data that should be sent to the client.
 * This includes only the assets and preloads for the current route and any
 * special assets that are needed for the client. It does not include relationships
 * between routes or any other data that is not needed for the client.
 *
 * The client entry URL is returned separately so that it can be transformed
 * (e.g. for CDN rewriting) before being embedded into the `<script>` tag.
 *
 * @param matchedRoutes - In dev mode, the matched routes are used to build
 * the dev styles URL for route-scoped CSS collection.
 */
export declare function getStartManifest(matchedRoutes?: ReadonlyArray<AnyRoute>): Promise<StartManifestWithClientEntry>;
