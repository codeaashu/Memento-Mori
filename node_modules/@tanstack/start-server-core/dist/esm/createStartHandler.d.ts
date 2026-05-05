import { RequestHandler } from './request-handler.js';
import { AnyRouter, Register } from '@tanstack/router-core';
import { HandlerCallback } from '@tanstack/router-core/ssr/server';
import { TransformAssetUrls, TransformAssets } from './transformAssetUrls.js';
export interface CreateStartHandlerOptions {
    handler: HandlerCallback<AnyRouter>;
    /**
     * Transform asset URLs and attributes at runtime, e.g. to prepend a CDN prefix.
     *
     * **String** — a URL prefix prepended to every asset URL (cached by default):
     * ```ts
     * createStartHandler({
     *   handler: defaultStreamHandler,
     *   transformAssets: 'https://cdn.example.com',
     * })
     * ```
     *
     * **Object shorthand** — a URL prefix with optional `crossOrigin`:
     * ```ts
     * createStartHandler({
     *   handler: defaultStreamHandler,
     *   transformAssets: {
     *     prefix: 'https://cdn.example.com',
     *     crossOrigin: 'anonymous',
     *   },
     * })
     * ```
     *
     * `crossOrigin` accepts a single value or a per-kind record:
     * ```ts
     * transformAssets: {
     *   prefix: 'https://cdn.example.com',
     *   crossOrigin: {
     *     modulepreload: 'anonymous',
     *     stylesheet: 'use-credentials',
     *   },
     * }
     * ```
     *
     * **Callback** — receives `{ kind, url }` and returns either a string URL or
     * `{ href, crossOrigin? }` (cached by default — runs once on first request):
     * ```ts
     * createStartHandler({
     *   handler: defaultStreamHandler,
     *   transformAssets: ({ kind, url }) => {
     *     const href = `https://cdn.example.com${url}`
     *
     *     if (kind === 'modulepreload') {
     *       return { href, crossOrigin: 'anonymous' }
     *     }
     *
     *     return { href }
     *   },
     * })
     * ```
     *
     * **Object** — for explicit cache control:
     * ```ts
     * createStartHandler({
     *   handler: defaultStreamHandler,
     *   transformAssets: {
     *     transform: ({ url }) => {
     *       const region = getRequest().headers.get('x-region') || 'us'
     *       return { href: `https://cdn-${region}.example.com${url}` }
     *     },
     *     cache: false,
     *   },
     * })
     * ```
     *
     * `kind` is one of `'modulepreload' | 'stylesheet' | 'clientEntry'`.
     * `crossOrigin` applies to manifest-managed `<link>` assets.
     *
     * By default, the transformed manifest is cached after the first request
     * (`cache: true`). Set `cache: false` for per-request transforms.
     *
     * If you're using a cached transform, you can optionally set `warmup: true`
     * (object form only) to compute the transformed manifest in the background at
     * server startup.
     *
     * Note: This only transforms URLs managed by TanStack Start's manifest
     * (JS preloads, CSS links, and the client entry script). For asset imports
     * used directly in components (e.g. `import logo from './logo.svg'`),
     * configure Vite's `experimental.renderBuiltUrl` in your vite.config.ts.
     */
    transformAssets?: TransformAssets;
    /**
     * @deprecated Use `transformAssets` instead.
     *
     * **String** — a URL prefix prepended to every asset URL (cached by default):
     * ```ts
     * createStartHandler({
     *   handler: defaultStreamHandler,
     *   transformAssetUrls: 'https://cdn.example.com',
     * })
     * ```
     *
     * **Callback** — receives `{ url, type }` and returns a new URL
     * (cached by default — runs once on first request):
     * ```ts
     * createStartHandler({
     *   handler: defaultStreamHandler,
     *   transformAssetUrls: ({ url, type }) => {
     *     return `https://cdn.example.com${url}`
     *   },
     * })
     * ```
     *
     * **Object** — for explicit cache control:
     * ```ts
     * createStartHandler({
     *   handler: defaultStreamHandler,
     *   transformAssetUrls: {
     *     transform: ({ url }) => {
     *       const region = getRequest().headers.get('x-region') || 'us'
     *       return `https://cdn-${region}.example.com${url}`
     *     },
     *     cache: false, // transform per-request
     *   },
     * })
     * ```
     *
     * `type` is one of `'modulepreload' | 'stylesheet' | 'clientEntry'`.
     *
     * By default, the transformed manifest is cached after the first request
     * (`cache: true`). Set `cache: false` for per-request transforms.
     *
     * If you're using a cached transform, you can optionally set `warmup: true`
     * (object form only) to compute the transformed manifest in the background at
     * server startup.
     *
     * Note: This only transforms URLs managed by TanStack Start's manifest
     * (JS preloads, CSS links, and the client entry script). For asset imports
     * used directly in components (e.g. `import logo from './logo.svg'`),
     * configure Vite's `experimental.renderBuiltUrl` in your vite.config.ts.
     */
    transformAssetUrls?: TransformAssetUrls;
}
/**
 * Creates the TanStack Start request handler.
 *
 * @example Backwards-compatible usage (handler callback only):
 * ```ts
 * export default createStartHandler(defaultStreamHandler)
 * ```
 *
 * @example With CDN URL rewriting:
 * ```ts
 * export default createStartHandler({
 *   handler: defaultStreamHandler,
 *   transformAssets: 'https://cdn.example.com',
 * })
 * ```
 *
 * @example With per-request URL rewriting:
 * ```ts
 * export default createStartHandler({
 *   handler: defaultStreamHandler,
 *   transformAssets: {
 *     transform: ({ url }) => {
 *       const cdnBase = getRequest().headers.get('x-cdn-base') || ''
 *       return { href: `${cdnBase}${url}` }
 *     },
 *     cache: false,
 *   },
 * })
 * ```
 */
export declare function createStartHandler<TRegister = Register>(cbOrOptions: HandlerCallback<AnyRouter> | CreateStartHandlerOptions): RequestHandler<TRegister>;
