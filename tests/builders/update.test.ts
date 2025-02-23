import { alphabetical } from 'radashi';
import { beforeEach, describe, expect, test } from 'vitest';
import { defineDatabase, AutoIncrement } from '../../src';
import { getSuitePath } from '../tools/utilities';
import type { Database, Store, ManualKey } from '../../src';
import type { ReadonlyTuple } from 'type-fest';

let suiteName: string;
beforeEach((context) => {
  suiteName = getSuitePath(context);
});

type Row = {
  name: string;
  balance: number;
  type: string;
};

type ManualKeySchema = { rows: Store<Row> };
type TypedKeySchema = { rows: Store<Row, ManualKey<number>> };
type IncrementKeySchema = { rows: Store<Row, AutoIncrement> };
type ModelKeySchema = { rows: Store<Row, 'name'> };
type IndexedStore = { rows: Store<Row, ManualKey<number>, { name: 'name'; type: 'type' }> };

let records: ReadonlyTuple<[row: Row, id: number], 3>;
let malcolm: Row;
beforeEach(() => {
  records = [
    [(malcolm = { name: 'Malcolm', balance: 20_092.76, type: 'checking' }), 1],
    [{ name: 'Zoë', balance: 17_521.86, type: 'checking' }, 2],
    [{ name: 'Hoban', balance: 10_784.41, type: 'checking' }, 3],
  ];
});

describe('Insert', () => {
  describe('Manual key', () => {
    let database: Database<ManualKeySchema>;

    beforeEach(() => {
      const useDatabase = defineDatabase<ManualKeySchema>({
        name: suiteName,
        migrations: [(trx) => trx.createStore('rows')],
      });

      database = useDatabase();
    });

    test('Unique insertions', async () => {
      await expect(
        database.change(['rows'], async (trx) => {
          for (const [record, key] of records) {
            await trx.update('rows').add(record, key);
          }
          return await trx.selectFrom('rows').getAll();
        }),
      ).resolves.toStrictEqual(records.map(([record]) => record));
    });

    test('Duplicate insertions', async () => {
      await expect(
        database.change(['rows'], async (trx) => {
          for (let i = 0; i !== 3; ++i) {
            await trx.update('rows').add(malcolm, 1);
          }
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          name: 'ConstraintError',
        }) as undefined,
      );
    });
  });

  describe('Typed manual key', () => {
    let database: Database<TypedKeySchema>;

    beforeEach(() => {
      const useDatabase = defineDatabase<TypedKeySchema>({
        name: suiteName,
        migrations: [(trx) => trx.createStore('rows')],
      });

      database = useDatabase();
    });

    test('Unique insertions', async () => {
      await expect(
        database.change(['rows'], async (trx) => {
          for (const [record, key] of records) {
            await trx.update('rows').add(record, key);
          }
          return await trx.selectFrom('rows').getAll();
        }),
      ).resolves.toStrictEqual(records.map(([record]) => record));
    });

    test('Duplicate insertions', async () => {
      await expect(
        database.change(['rows'], async (trx) => {
          for (let i = 0; i !== 3; ++i) {
            await trx.update('rows').add(malcolm, 1);
          }
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          name: 'ConstraintError',
        }) as undefined,
      );
    });
  });

  test('Auto increment key', async () => {
    const useDatabase = defineDatabase<IncrementKeySchema>({
      name: suiteName,
      migrations: [(trx) => trx.createStore('rows', AutoIncrement)],
    });

    const database = useDatabase();

    await expect(
      database.change(['rows'], async (trx) => {
        for (const [record] of records) {
          await trx.update('rows').add(record);
        }
        return await trx.selectFrom('rows').getAll();
      }),
    ).resolves.toStrictEqual(records.map(([record]) => record));
  });

  describe('In model key', () => {
    let database: Database<ModelKeySchema>;

    beforeEach(() => {
      const useDatabase = defineDatabase<ModelKeySchema>({
        name: suiteName,
        migrations: [(trx) => trx.createStore('rows', 'name')],
      });

      database = useDatabase();
    });

    test('Unique insertions', async () => {
      const sorted = alphabetical(records, ([record]) => record.name);

      await expect(
        database.change(['rows'], async (trx) => {
          for (const [record] of records) {
            await trx.update('rows').add(record);
          }
          return await trx.selectFrom('rows').getAllKeys();
        }),
      ).resolves.toStrictEqual(sorted.map(([record]) => record.name));
    });

    test('Duplicate insertions', async () => {
      await expect(
        database.change(['rows'], async (trx) => {
          for (let i = 0; i !== 3; ++i) {
            await trx.update('rows').add(malcolm);
          }
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          name: 'ConstraintError',
        }) as undefined,
      );
    });
  });

  describe('Indexed store', () => {
    let database: Database<IndexedStore>;

    beforeEach(() => {
      const useDatabase = defineDatabase<IndexedStore>({
        name: suiteName,
        migrations: [
          (trx) => trx.createStore('rows').createIndex('name', 'name', { unique: true }).createIndex('type', 'type'),
        ],
      });

      database = useDatabase();
    });

    test('Unique insertions', async () => {
      const sorted = alphabetical(records, ([record]) => record.name);

      await expect(
        database.change(['rows'], async (trx) => {
          for (const [record, key] of records) {
            await trx.update('rows').add(record, key);
          }
          return await trx.selectFrom('rows').by('name').getAllKeys();
        }),
      ).resolves.toStrictEqual(sorted.map(([, key]) => key));
    });

    test('Duplicate insertions', async () => {
      await expect(
        database.change(['rows'], async (trx) => {
          for (let i = 0; i !== 3; ++i) {
            await trx.update('rows').add(malcolm, i);
          }
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          name: 'ConstraintError',
        }) as undefined,
      );
    });
  });
});

describe('Update', () => {
  describe('Manual key', () => {
    let database: Database<ManualKeySchema>;

    beforeEach(() => {
      const useDatabase = defineDatabase<ManualKeySchema>({
        name: suiteName,
        migrations: [(trx) => trx.createStore('rows')],
      });

      database = useDatabase();
    });

    test('Unique upsertions', async () => {
      await expect(
        database.change(['rows'], async (trx) => {
          for (const [record, key] of records) {
            await trx.update('rows').put(record, key);
          }
          return await trx.selectFrom('rows').getAll();
        }),
      ).resolves.toStrictEqual(records.map(([record]) => record));
    });

    test('Duplicate upsertions', async () => {
      await expect(
        database.change(['rows'], async (trx) => {
          for (let i = 0; i !== 3; ++i) {
            await trx.update('rows').put(malcolm, 1);
          }
          return await trx.selectFrom('rows').getAll();
        }),
      ).resolves.toStrictEqual([malcolm]);
    });
  });

  describe('Typed manual key', () => {
    let database: Database<TypedKeySchema>;

    beforeEach(() => {
      const useDatabase = defineDatabase<TypedKeySchema>({
        name: suiteName,
        migrations: [(trx) => trx.createStore('rows')],
      });

      database = useDatabase();
    });

    test('Unique upsertions', async () => {
      await expect(
        database.change(['rows'], async (trx) => {
          for (const [record, key] of records) {
            await trx.update('rows').put(record, key);
          }
          return await trx.selectFrom('rows').getAll();
        }),
      ).resolves.toStrictEqual(records.map(([record]) => record));
    });

    test('Duplicate upsertions', async () => {
      await expect(
        database.change(['rows'], async (trx) => {
          for (let i = 0; i !== 3; ++i) {
            await trx.update('rows').put(malcolm, 1);
          }
          return await trx.selectFrom('rows').getAll();
        }),
      ).resolves.toStrictEqual([malcolm]);
    });
  });

  describe('In model key', () => {
    let database: Database<ModelKeySchema>;

    beforeEach(() => {
      const useDatabase = defineDatabase<ModelKeySchema>({
        name: suiteName,
        migrations: [(trx) => trx.createStore('rows', 'name')],
      });

      database = useDatabase();
    });

    test('Unique upsertions', async () => {
      const sorted = alphabetical(records, ([record]) => record.name);

      await expect(
        database.change(['rows'], async (trx) => {
          for (const [record] of records) {
            await trx.update('rows').put(record);
          }
          return await trx.selectFrom('rows').getAll();
        }),
      ).resolves.toStrictEqual(sorted.map(([record]) => record));
    });

    test('Duplicate upsertions', async () => {
      await expect(
        database.change(['rows'], async (trx) => {
          for (let i = 0; i !== 3; ++i) {
            await trx.update('rows').put(malcolm);
          }
          return await trx.selectFrom('rows').getAll();
        }),
      ).resolves.toStrictEqual([malcolm]);
    });
  });

  describe('Indexed store', () => {
    let database: Database<IndexedStore>;

    beforeEach(() => {
      const useDatabase = defineDatabase<IndexedStore>({
        name: suiteName,
        migrations: [
          (trx) => trx.createStore('rows').createIndex('name', 'name', { unique: true }).createIndex('type', 'type'),
        ],
      });

      database = useDatabase();
    });

    test('Unique upsertions', async () => {
      const sorted = alphabetical(records, ([record]) => record.name);

      await expect(
        database.change(['rows'], async (trx) => {
          for (const [record, key] of records) {
            await trx.update('rows').put(record, key);
          }
          return await trx.selectFrom('rows').by('name').getAll();
        }),
      ).resolves.toStrictEqual(sorted.map(([record]) => record));
    });

    test('Duplicate key upsertions', async () => {
      await expect(
        database.change(['rows'], async (trx) => {
          for (let i = 0; i !== 3; ++i) {
            await trx.update('rows').put(malcolm, 1);
          }
          return await trx.selectFrom('rows').getAll();
        }),
      ).resolves.toStrictEqual([malcolm]);
    });

    test('Duplicate index upsertions', async () => {
      await expect(
        database.change(['rows'], async (trx) => {
          for (let i = 0; i !== 3; ++i) {
            await trx.update('rows').put(malcolm, i);
          }
          return await trx.selectFrom('rows').getAll();
        }),
      ).rejects.toThrow(
        expect.objectContaining({
          name: 'ConstraintError',
        }) as undefined,
      );
    });
  });
});
