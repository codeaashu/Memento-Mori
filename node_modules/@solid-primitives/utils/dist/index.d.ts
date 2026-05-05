import { onCleanup, createSignal, type Accessor, type AccessorArray, type EffectFunction, type NoInfer, type SignalOptions } from "solid-js";
import { isServer } from "solid-js/web";
import type { AnyClass, MaybeAccessor, MaybeAccessorValue, Noop, AnyObject, AnyFunction } from "./types.js";
export * from "./types.js";
export { isServer };
export declare const isClient: boolean;
export declare const isDev: boolean;
export declare const isProd: boolean;
/** no operation */
export declare const noop: Noop;
export declare const trueFn: () => boolean;
export declare const falseFn: () => boolean;
/** @deprecated use {@link equalFn} from "solid-js" */
export declare const defaultEquals: <T>(a: T, b: T) => boolean;
export declare const EQUALS_FALSE_OPTIONS: {
    readonly equals: false;
};
export declare const INTERNAL_OPTIONS: {
    readonly internal: true;
};
/**
 * Check if the value is an instance of ___
 */
export declare const ofClass: (v: any, c: AnyClass) => boolean;
/** Check if value is typeof "object" or "function" */
export declare function isObject(value: any): value is AnyObject;
export declare const isNonNullable: <T>(i: T) => i is NonNullable<T>;
export declare const filterNonNullable: <T extends readonly unknown[]>(arr: T) => NonNullable<T[number]>[];
export declare const compare: (a: any, b: any) => number;
/**
 * Check shallow array equality
 */
export declare const arrayEquals: (a: readonly unknown[], b: readonly unknown[]) => boolean;
/**
 * Returns a function that will call all functions in the order they were chained with the same arguments.
 */
export declare function chain<Args extends [] | any[]>(callbacks: {
    [Symbol.iterator](): IterableIterator<((...args: Args) => any) | undefined>;
}): (...args: Args) => void;
/**
 * Returns a function that will call all functions in the reversed order with the same arguments.
 */
export declare function reverseChain<Args extends [] | any[]>(callbacks: (((...args: Args) => any) | undefined)[]): (...args: Args) => void;
export declare const clamp: (n: number, min: number, max: number) => number;
/**
 * Accesses the value of a MaybeAccessor
 * @example
 * ```ts
 * access("foo") // => "foo"
 * access(() => "foo") // => "foo"
 * ```
 */
export declare const access: <T extends MaybeAccessor<any>>(v: T) => MaybeAccessorValue<T>;
export declare const asArray: <T>(value: T) => (T extends any[] ? T[number] : NonNullable<T>)[];
/**
 * Access an array of MaybeAccessors
 * @example
 * const list = [1, 2, () => 3)] // T: MaybeAccessor<number>[]
 * const newList = accessArray(list) // T: number[]
 */
export declare const accessArray: <A extends MaybeAccessor<any>>(list: readonly A[]) => MaybeAccessorValue<A>[];
/**
 * Run the function if the accessed value is not `undefined` nor `null`
 * @param value
 * @param fn
 */
export declare const withAccess: <T, A extends MaybeAccessor<T>, V = MaybeAccessorValue<A>>(value: A, fn: (value: NonNullable<V>) => void) => void;
export declare const asAccessor: <A extends MaybeAccessor<unknown>>(v: A) => Accessor<MaybeAccessorValue<A>>;
/** If value is a function – call it with a given arguments – otherwise get the value as is */
export declare function accessWith<T>(valueOrFn: T, ...args: T extends AnyFunction ? Parameters<T> : never): T extends AnyFunction ? ReturnType<T> : T;
/**
 * Solid's `on` helper, but always defers and returns a provided initial value when if does instead of `undefined`.
 *
 * @param deps
 * @param fn
 * @param initialValue
 */
export declare function defer<S, Next extends Prev, Prev = Next>(deps: AccessorArray<S> | Accessor<S>, fn: (input: S, prevInput: S, prev: undefined | NoInfer<Prev>) => Next, initialValue: Next): EffectFunction<undefined | NoInfer<Next>, NoInfer<Next>>;
export declare function defer<S, Next extends Prev, Prev = Next>(deps: AccessorArray<S> | Accessor<S>, fn: (input: S, prevInput: S, prev: undefined | NoInfer<Prev>) => Next, initialValue?: undefined): EffectFunction<undefined | NoInfer<Next>>;
/**
 * Get entries of an object
 */
export declare const entries: <T extends object>(obj: T) => [keyof T, T[keyof T]][];
/**
 * Get keys of an object
 */
export declare const keys: <T extends object>(object: T) => (keyof T)[];
/**
 * Solid's `onCleanup` that doesn't warn in development if used outside of a component.
 */
export declare const tryOnCleanup: typeof onCleanup;
export declare const createCallbackStack: <A0 = void, A1 = void, A2 = void, A3 = void>() => {
    push: (...callbacks: ((arg0: A0, arg1: A1, arg2: A2, arg3: A3) => void)[]) => void;
    execute: (arg0: A0, arg1: A1, arg2: A2, arg3: A3) => void;
    clear: VoidFunction;
};
/**
 * Group synchronous function calls.
 * @param fn
 * @returns `fn`
 */
export declare function createMicrotask<A extends any[] | []>(fn: (...a: A) => void): (...a: A) => void;
/**
 * A hydratable version of the {@link createSignal}. It will use the serverValue on the server and the update function on the client. If initialized during hydration it will use serverValue as the initial value and update it once hydration is complete.
 *
 * @param serverValue initial value of the state on the server
 * @param update called once on the client or on hydration to initialize the value
 * @param options {@link SignalOptions}
 * @returns
 * ```ts
 * [state: Accessor<T>, setState: Setter<T>]
 * ```
 * @see {@link createSignal}
 */
export declare function createHydratableSignal<T>(serverValue: T, update: () => T, options?: SignalOptions<T>): ReturnType<typeof createSignal<T>>;
/** @deprecated use {@link createHydratableSignal} instead */
export declare const createHydrateSignal: typeof createHydratableSignal;
/**
 * Handle items removed and added to the array by diffing it by refference.
 *
 * @param current new array instance
 * @param prev previous array copy
 * @param handleAdded called once for every added item to array
 * @param handleRemoved called once for every removed from array
 */
export declare function handleDiffArray<T>(current: readonly T[], prev: readonly T[], handleAdded: (item: T) => void, handleRemoved: (item: T) => void): void;
/**
 * Parse a string as a single JSON value.
 *
 * ```ts
 * const { data } = createSSE<{ status: string }>(url, { transform: json });
 * ```
 */
export declare const json: <T>(raw: string) => T;
/**
 * Parse a string as newline-delimited JSON (NDJSON / JSON Lines).
 *
 * Each non-empty line is parsed as a separate JSON value and returned as an array.
 *
 * ```ts
 * const { data } = createSSE<TickEvent[]>(url, { transform: ndjson });
 * // data() === [{ id: 1, type: "tick" }, { id: 2, type: "tick" }]
 * ```
 */
export declare const ndjson: <T>(raw: string) => T[];
/**
 * Split a string into individual lines, returning a `string[]`. Empty lines are filtered out.
 *
 * ```ts
 * const { data } = createSSE<string[]>(url, { transform: lines });
 * // data() === ["line one", "line two"]
 * ```
 */
export declare const lines: (raw: string) => string[];
/**
 * Parse a string as a number using `Number()` semantics.
 *
 * Note: `""` → `0`, non-numeric strings → `NaN`.
 *
 * ```ts
 * const { data } = createSSE<number>(url, { transform: number });
 * // data() === 42
 * ```
 */
export declare const number: (raw: string) => number;
/**
 * Wrap any `(string) => T` transform in a `try/catch`. Returns `fallback`
 * (default `undefined`) instead of throwing on malformed input.
 *
 * ```ts
 * const { data } = createSSE<MyEvent>(url, { transform: safe(json) });
 * const { data } = createSSE<number>(url, { transform: safe(number, 0) });
 * ```
 */
export declare function safe<T>(transform: (raw: string) => T): (raw: string) => T | undefined;
export declare function safe<T>(transform: (raw: string) => T, fallback: T): (raw: string) => T;
/**
 * Compose two transforms into one: the output of `a` is passed as the input of `b`.
 *
 * ```ts
 * const { data } = createSSE<RawEvent[]>(url, {
 *   transform: pipe(ndjson<RawEvent>, rows => rows.filter(r => r.type === "tick")),
 * });
 * ```
 */
export declare function pipe<A, B>(a: (raw: string) => A, b: (a: A) => B): (raw: string) => B;
