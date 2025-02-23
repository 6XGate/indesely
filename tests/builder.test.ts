import { describe, expectTypeOf, it } from 'vitest';
import type { UpdateArgsFor, AutoIncrement, ManualKey, UpgradingKey, UpsertArgsFor } from '../src';

interface Model {
  id: string;
  name: { first: number; last: symbol };
  address: { street: bigint; locality: { city: string; state: string; zip: string } };
  phone: { cell: UpgradingKey; home: string; work: string };
}

describe('Type information', () => {
  it('Upgrade arguments', () => {
    expectTypeOf<UpdateArgsFor<Model, 'id'>>().toEqualTypeOf<[Model]>();
    expectTypeOf<UpdateArgsFor<Model, ['id', 'name.first']>>().toEqualTypeOf<[Model]>();
    expectTypeOf<UpdateArgsFor<Model, AutoIncrement>>().toEqualTypeOf<[Model]>();
    expectTypeOf<UpdateArgsFor<Model, ManualKey>>().toEqualTypeOf<[Model, IDBValidKey]>();
    expectTypeOf<UpdateArgsFor<Model, ManualKey<number>>>().toEqualTypeOf<[Model, number]>();
    expectTypeOf<UpdateArgsFor<Model, UpgradingKey>>().toEqualTypeOf<[a: Model, b?: IDBValidKey]>();
    expectTypeOf<UpdateArgsFor<Model, string>>().toEqualTypeOf<never>();
    expectTypeOf<UpdateArgsFor<Model, [string]>>().toEqualTypeOf<never>();
  });

  it('Upsert arguments', () => {
    expectTypeOf<UpsertArgsFor<Model, 'id'>>().toEqualTypeOf<[Model]>();
    expectTypeOf<UpsertArgsFor<Model, ['id', 'name.first']>>().toEqualTypeOf<[Model]>();
    expectTypeOf<UpsertArgsFor<Model, AutoIncrement>>().toEqualTypeOf<[m: Model, k?: number]>();
    expectTypeOf<UpsertArgsFor<Model, ManualKey>>().toEqualTypeOf<[Model, IDBValidKey]>();
    expectTypeOf<UpsertArgsFor<Model, ManualKey<number>>>().toEqualTypeOf<[Model, number]>();
    expectTypeOf<UpsertArgsFor<Model, UpgradingKey>>().toEqualTypeOf<[a: Model, b?: IDBValidKey]>();
    expectTypeOf<UpsertArgsFor<Model, string>>().toEqualTypeOf<never>();
    expectTypeOf<UpsertArgsFor<Model, [string]>>().toEqualTypeOf<never>();
  });
});
