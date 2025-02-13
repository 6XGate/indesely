import type { Constructor } from 'type-fest';

function withResolversPolyfill<T>() {
  let resolve: (value: T | PromiseLike<T>) => void = () => undefined;
  let reject: (reason?: unknown) => void = () => undefined;

  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  return { resolve, reject, promise };
}

export const withResolvers =
  'withResolvers' in Promise && typeof Promise.withResolvers === 'function'
    ? (Promise.withResolvers.bind(Promise) as typeof withResolversPolyfill)
    : withResolversPolyfill;

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type -- Must be raw type.
export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

export type Class<T, Arguments extends unknown[] = unknown[]> = Constructor<T, Arguments> & { prototype: T };
export function isClass<T = unknown>(value: unknown): value is Class<T> {
  return isFunction(value) && value.toString().startsWith('class ');
}

export function memoize<Args extends unknown[], Result>(func: (...args: Args) => Result) {
  const cache = new Map<string, { result: Result }>();
  return function cacheCall(...args: Args) {
    const key = JSON.stringify(args);
    let entry = cache.get(key);
    if (entry != null) return entry.result;
    entry = { result: func(...args) };
    cache.set(key, entry);
    return entry.result;
  };
}
