import { memoize, withResolvers } from './compat.js';
import type { Get, Paths } from 'type-fest';

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
export type MemberType<Row extends object, Key> = Key extends [...unknown[]]
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
  request.onsuccess = () => {
    resolve(request.result);
  };
  request.onerror = () => {
    reject(request.error);
  };
  return await promise;
}
