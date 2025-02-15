import { withResolvers } from './compat.js';
import type { Constructor, Get, Paths } from 'type-fest';

/** Symbol to indicate the schema should be flexible enough for migration. */
export type UpgradingKey = typeof UpgradingKey;
/** Symbol to indicate the schema should be flexible enough for migration. */
export const UpgradingKey = Symbol('UpgradingKey');

/** Symbol to indicates a manual key. */
export type ManualKey = typeof ManualKey;
/** Symbol to indicates a manual key. */
export const ManualKey = Symbol('ManualKey');

/** Symbol to indicate an auto-increment key. */
export type AutoIncrement = typeof AutoIncrement;
/** Symbol to indicate an auto-increment key. */
export const AutoIncrement = Symbol('AutoIncrement');

/** Gets the type or, when an array, the element type of a value. */
type MemberElement<T> = T extends (infer E)[] ? E : T;

/** Gets all possible paths in `Row` */
export type MemberPaths<Row> = Paths<Row, { bracketNotation: true }>;

/** Gets the compound types of the paths in `Row`. */
type MemberTypes<Row extends object, Keys> = Keys extends []
  ? []
  : Keys extends [infer Key extends MemberPaths<Row>]
    ? [MemberElement<Get<Row, Key>>]
    : Keys extends [infer Key extends MemberPaths<Row>, ...infer Rest]
      ? [MemberElement<Get<Row, Key>>, ...MemberTypes<Row, Rest>]
      : never;

/** Gets the types of a path or paths in `Row`. */
export type MemberType<Row extends object, Key> = Key extends UpgradingKey
  ? IDBValidKey
  : Key extends [...unknown[]]
    ? MemberTypes<Row, Key>
    : Key extends MemberPaths<Row>
      ? MemberElement<Get<Row, Key>>
      : never;

/** Gets the key path of a store. */
export type StoreKey<Store extends object> = Store extends { key: infer Key } ? Key : never;
/** Gets the document type of a store. */
export type StoreRow<Store extends object> = Store extends { row: infer Row extends object } ? Row : never;
/** Gets the document type of a store. */
export type StoreIndices<Store extends object> = Store extends { indices: infer Indices extends object }
  ? Indices
  : never;

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

/**
 * Request that the application databases are persisted.
 * @param fail - Indicates whether to throw an error on failure.
 */
// eslint-disable-next-line @typescript-eslint/no-inferrable-types -- Does not work here.
export const requestDatabasePersistence = memoize(async (fail: boolean = false) => {
  let isPersistent = await globalThis.navigator.storage.persisted();
  if (!isPersistent) {
    isPersistent = await globalThis.navigator.storage.persist();
  }

  if (fail && !isPersistent) {
    throw new Error('Unable to persist storage');
  }

  return isPersistent;
});

/**
 * Waits on a IndexedDB request to succeed or fail.
 * @param request - The IndexedDB request to wait on.
 * @returns The result of the IndexedDB request on success.
 * @throws If the IndexedDB request fails.
 */
export async function waitOnRequest<T>(request: IDBRequest<T>) {
  const { promise, resolve, reject } = withResolvers<T>();

  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error ?? new Error('Unknown request failure'));

  return await promise;
}
