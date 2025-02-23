import type { Get, Paths } from 'type-fest';

/** Symbol to indicate the schema should be flexible enough for migration. */
export type UpgradingKey = typeof UpgradingKey;
/** Symbol to indicate the schema should be flexible enough for migration. */
export const UpgradingKey = Symbol('UpgradingKey');

/** The base of the manual key. */
const ManualBase = Symbol('ManualKey');

/** Symbol to indicates a manual key. */
export type ManualKey<K extends IDBValidKey = IDBValidKey> = typeof ManualBase & { __key: K };
/** Symbol to indicates a manual key. */
export const ManualKey = ManualBase as ManualKey;

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
  : Key extends MemberPaths<Row>[]
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

/** Gets the type of the key of a row */
export type KeyOf<Row extends object, Key> = Key extends AutoIncrement
  ? number
  : Key extends ManualKey<infer K>
    ? K
    : Key extends UpgradingKey
      ? IDBValidKey
      : MemberType<Row, Key>;

/** Provides the basic information about an object store. */
export class ObjectStore {
  /**
   * The native IndexedDB {@link IDBObjectStore} handle.
   * @internal
   */
  protected readonly handle;

  /** @internal */
  constructor(store: IDBObjectStore) {
    this.handle = store;
  }

  /** Gets the name of the object store. */
  get name() {
    return this.handle.name;
  }

  /** Gets the key path of the object store. */
  get keyPath() {
    return (this.handle.keyPath as string | string[] | null) ?? (this.handle.autoIncrement ? AutoIncrement : ManualKey);
  }

  /** Gets the names of the indices of the object store. */
  get indexNames() {
    return Array.from(this.handle.indexNames);
  }
}
