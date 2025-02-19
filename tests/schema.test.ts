import { describe, expectTypeOf, it } from 'vitest';
import type { Store } from '../src/database';
import type {
  AutoIncrement,
  KeyOf,
  ManualKey,
  MemberPaths,
  MemberType,
  StoreIndices,
  StoreKey,
  StoreRow,
  UpgradingKey,
} from '../src/schema';

interface Model {
  id: string;
  name: { first: number; last: symbol };
  address: { street: bigint; locality: { city: string; state: string; zip: string } };
  phone: { cell: UpgradingKey; home: string; work: string };
}

describe('Store information', () => {
  it('Basic', () => {
    type Test = Store<Model>;
    expectTypeOf<StoreRow<Test>>().toEqualTypeOf<Model>();
  });

  it('Default manual keys', () => {
    type Test = Store<Model>;
    expectTypeOf<StoreKey<Test>>().toEqualTypeOf<ManualKey>();
  });

  it('Specified manual keys', () => {
    type Test = Store<Model>;
    expectTypeOf<StoreKey<Test>>().toEqualTypeOf<ManualKey>();
  });

  it('Auto increment keys', () => {
    type Test = Store<Model, AutoIncrement>;
    expectTypeOf<StoreKey<Test>>().toEqualTypeOf<AutoIncrement>();
  });

  it('Specify keys', () => {
    type Test = Store<Model, 'id'>;
    expectTypeOf<StoreKey<Test>>().toEqualTypeOf<'id'>();
  });

  it('Store indices', () => {
    type Test = Store<Model, 'id', { name: 'name' }>;
    expectTypeOf<StoreIndices<Test>>().toEqualTypeOf<{ name: 'name' }>();
  });

  it('Store indices in migration', () => {
    type Test = Store<Model, 'id', Record<string, UpgradingKey>>;
    expectTypeOf<StoreIndices<Test>>().toEqualTypeOf<Record<string, UpgradingKey>>();
  });
});

it('Model paths', () => {
  expectTypeOf<MemberPaths<Model>>().toEqualTypeOf<
    | 'id'
    | 'name'
    | 'name.first'
    | 'name.last'
    | 'address'
    | 'address.street'
    | 'address.locality'
    | 'address.locality.city'
    | 'address.locality.state'
    | 'address.locality.zip'
    | 'phone'
    | 'phone.cell'
    | 'phone.home'
    | 'phone.work'
  >();
});

describe('Model key', () => {
  it('Model key from path', () => {
    expectTypeOf<MemberType<Model, 'id'>>().toEqualTypeOf<string>();
    expectTypeOf<MemberType<Model, 'name'>>().toEqualTypeOf<{ first: number; last: symbol }>();
    expectTypeOf<MemberType<Model, 'address.street'>>().toEqualTypeOf<bigint>();
    expectTypeOf<MemberType<Model, ['name.first', 'address.street']>>().toEqualTypeOf<[number, bigint]>();
    expectTypeOf<MemberType<Model, UpgradingKey>>().toEqualTypeOf<IDBValidKey>();
    expectTypeOf<MemberType<Model, string>>().toEqualTypeOf<never>();
    expectTypeOf<MemberType<Model, [string]>>().toEqualTypeOf<never>();
  });

  it('Key or symbol', () => {
    expectTypeOf<KeyOf<Model, 'id'>>().toEqualTypeOf<string>();
    expectTypeOf<KeyOf<Model, ['id', 'name.first']>>().toEqualTypeOf<[string, number]>();
    expectTypeOf<KeyOf<Model, AutoIncrement>>().toEqualTypeOf<number>();
    expectTypeOf<KeyOf<Model, ManualKey>>().toEqualTypeOf<IDBValidKey>();
    expectTypeOf<KeyOf<Model, UpgradingKey>>().toEqualTypeOf<IDBValidKey>();
    expectTypeOf<KeyOf<Model, string>>().toEqualTypeOf<never>();
    expectTypeOf<KeyOf<Model, [string]>>().toEqualTypeOf<never>();
  });
});
