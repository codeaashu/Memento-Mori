import { AssetCrossOrigin, Awaitable, Manifest, RouterManagedTag } from '@tanstack/router-core';
export type { AssetCrossOrigin };
export type TransformAssetKind = 'modulepreload' | 'stylesheet' | 'clientEntry';
type TransformAssetsShorthandCrossOriginKind = Exclude<TransformAssetKind, 'clientEntry'>;
export type AssetUrlType = TransformAssetKind;
export interface TransformAssetsContext {
    url: string;
    kind: TransformAssetKind;
}
export type TransformAssetResult = string | {
    href: string;
    crossOrigin?: AssetCrossOrigin;
};
export type TransformAssetsFn = (context: TransformAssetsContext) => Awaitable<TransformAssetResult>;
export interface TransformAssetUrlsContext {
    url: string;
    type: AssetUrlType;
}
export type TransformAssetUrlsFn = (context: TransformAssetUrlsContext) => Awaitable<string>;
export type CreateTransformAssetUrlsContext = {
    /** True when the server is computing the cached manifest during startup warmup. */
    warmup: true;
} | {
    /**
     * The current Request.
     *
     * Only available during request handling (i.e. when `warmup: false`).
     */
    request: Request;
    /** False when transforming URLs as part of request handling. */
    warmup: false;
};
/**
 * Async factory that runs once per manifest computation and returns the
 * per-asset transform.
 */
export type CreateTransformAssetUrlsFn = (ctx: CreateTransformAssetUrlsContext) => Awaitable<TransformAssetUrlsFn>;
export type CreateTransformAssetsFn = (ctx: CreateTransformAssetUrlsContext) => Awaitable<TransformAssetsFn>;
type TransformAssetUrlsOptionsBase = {
    /**
     * Whether to cache the transformed manifest after the first request.
     *
     * When `true` (default), the transform runs once on the first request and
     * the resulting manifest is reused for all subsequent requests in production.
     *
     * Set to `false` for per-request transforms (e.g. geo-routing to different
     * CDNs based on request headers).
     *
     * @default true
     */
    cache?: boolean;
    /**
     * When `true`, warms up the cached transformed manifest in the background when
     * the server starts (production only).
     *
     * This can reduce latency for the first request when `cache` is `true`.
     * Has no effect when `cache: false` (per-request transforms) or in dev mode.
     *
     * @default false
     */
    warmup?: boolean;
};
export type TransformAssetUrlsOptions = (TransformAssetUrlsOptionsBase & {
    /**
     * The transform to apply to asset URLs. Can be a string prefix or a callback.
     *
     * **String** — prepended to every asset URL.
     * **Callback** — receives `{ url, type }` and returns a new URL.
     */
    transform: string | TransformAssetUrlsFn;
    createTransform?: never;
}) | (TransformAssetUrlsOptionsBase & {
    /**
     * Create a per-asset transform function.
     *
     * This factory runs once per manifest computation (per request when
     * `cache: false`, or once per server when `cache: true`). It can do async
     * setup work (fetch config, read from a KV, etc.) and return a fast
     * per-asset transformer.
     */
    createTransform: CreateTransformAssetUrlsFn;
    transform?: never;
});
export type TransformAssetsOptions = (TransformAssetUrlsOptionsBase & {
    transform: string | TransformAssetsFn;
    createTransform?: never;
}) | (TransformAssetUrlsOptionsBase & {
    createTransform: CreateTransformAssetsFn;
    transform?: never;
});
export type TransformAssetUrls = string | TransformAssetUrlsFn | TransformAssetUrlsOptions;
/**
 * Per-kind crossOrigin configuration for the object shorthand.
 *
 * Accepts either a single value applied to all asset kinds, or a per-kind
 * record (matching `HeadContent`'s `assetCrossOrigin` shape):
 *
 * ```ts
 * // All assets get the same value
 * crossOrigin: 'anonymous'
 *
 * // Different values per kind
 * crossOrigin: { modulepreload: 'anonymous', stylesheet: 'use-credentials' }
 * ```
 */
export type TransformAssetsCrossOriginConfig = AssetCrossOrigin | Partial<Record<TransformAssetsShorthandCrossOriginKind, AssetCrossOrigin>>;
/**
 * Object shorthand for `transformAssets`. Combines a URL prefix with optional
 * per-asset `crossOrigin` without needing a callback:
 *
 * ```ts
 * transformAssets: {
 *   prefix: 'https://cdn.example.com',
 *   crossOrigin: 'anonymous',
 * }
 * ```
 */
export interface TransformAssetsObjectShorthand {
    /** URL prefix prepended to every asset URL. */
    prefix: string;
    /**
     * Optional crossOrigin attribute applied to manifest-managed `<link>` assets.
     *
     * Accepts a single value or a per-kind record.
     */
    crossOrigin?: TransformAssetsCrossOriginConfig;
}
export type TransformAssets = string | TransformAssetsFn | TransformAssetsObjectShorthand | TransformAssetsOptions;
export type ResolvedTransformAssetsConfig = {
    type: 'transform';
    transformFn: TransformAssetsFn;
    cache: boolean;
} | {
    type: 'createTransform';
    createTransform: CreateTransformAssetsFn;
    cache: boolean;
};
export declare function warnDeprecatedTransformAssetUrls(): void;
export declare function resolveTransformAssetsConfig(transform: TransformAssets): ResolvedTransformAssetsConfig;
export declare function adaptTransformAssetUrlsToTransformAssets(transformFn: TransformAssetUrlsFn): TransformAssetsFn;
export declare function adaptTransformAssetUrlsConfigToTransformAssets(transform: TransformAssetUrls): TransformAssets;
export interface StartManifestWithClientEntry {
    manifest: Manifest;
    clientEntry: string;
    /** Script content prepended before the client entry import (dev only) */
    injectedHeadScripts?: string;
}
/**
 * Builds the client entry `<script>` tag from a (possibly transformed) client
 * entry URL and optional injected head scripts.
 */
export declare function buildClientEntryScriptTag(clientEntry: string, injectedHeadScripts?: string): RouterManagedTag;
export declare function transformManifestAssets(source: StartManifestWithClientEntry, transformFn: TransformAssetsFn, _opts?: {
    clone?: boolean;
}): Promise<Manifest>;
/**
 * Builds a final Manifest from a StartManifestWithClientEntry without any
 * URL transforms. Used when no transformAssetUrls option is provided.
 *
 * Returns a new manifest object so the cached base manifest is never mutated.
 */
export declare function buildManifestWithClientEntry(source: StartManifestWithClientEntry): Manifest;
