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
