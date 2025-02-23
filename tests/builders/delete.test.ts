import { beforeEach, expect, test } from 'vitest';
import { defineDatabase } from '../../src';
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

type Schema = { rows: Store<Row, ManualKey<number>> };

let database: Database<Schema>;
let records: ReadonlyTuple<[row: Row, id: number], 9>;
beforeEach(async () => {
  const useDatabase = defineDatabase<Schema>({
    name: suiteName,
    migrations: [(trx) => trx.createStore('rows')],
  });

  records = [
    [{ name: 'Malcolm', balance: 20_092.76, type: 'checking' }, 1],
    [{ name: 'Zoë', balance: 17_521.86, type: 'checking' }, 2],
    [{ name: 'Hoban', balance: 10_784.41, type: 'checking' }, 3],
    [{ name: 'Jayne', balance: 10_282.05, type: 'checking' }, 4],
    [{ name: 'Kaywinnet', balance: 12_401.22, type: 'checking' }, 5],
    [{ name: 'River', balance: 102_102.01, type: 'savings' }, 6],
    [{ name: 'Simon', balance: 97_208.11, type: 'savings' }, 7],
    [{ name: 'Inara', balance: 31_100.49, type: 'savings' }, 8],
    [{ name: 'Derrial', balance: 5_789.12, type: 'savings' }, 9],
  ];

  database = useDatabase();
  await database.change(['rows'], async (trx) => {
    for (const [record, key] of records) {
      await trx.update('rows').add(record, key);
    }
  });
});

test('Everything', async () => {
  await expect(
    database.change(['rows'], async (trx) => {
      await trx.deleteFrom('rows').everything();
      return await trx.selectFrom('rows').getAll();
    }),
  ).resolves.toStrictEqual([]);
});

test('Where key =', async () => {
  await expect(
    database.change(['rows'], async (trx) => {
      await trx.deleteFrom('rows').whereKey('=', 3);
      return await trx.selectFrom('rows').getAll();
    }),
  ).resolves.toStrictEqual(records.filter(([, key]) => key !== 3).map(([record]) => record));
});

test('Where key <', async () => {
  await expect(
    database.change(['rows'], async (trx) => {
      await trx.deleteFrom('rows').whereKey('<', 3);
      return await trx.selectFrom('rows').getAll();
    }),
  ).resolves.toStrictEqual(records.filter(([, key]) => key >= 3).map(([record]) => record));
});

test('Where key <=', async () => {
  await expect(
    database.change(['rows'], async (trx) => {
      await trx.deleteFrom('rows').whereKey('<=', 3);
      return await trx.selectFrom('rows').getAll();
    }),
  ).resolves.toStrictEqual(records.filter(([, key]) => key > 3).map(([record]) => record));
});

test('Where key >=', async () => {
  await expect(
    database.change(['rows'], async (trx) => {
      await trx.deleteFrom('rows').whereKey('>=', 3);
      return await trx.selectFrom('rows').getAll();
    }),
  ).resolves.toStrictEqual(records.filter(([, key]) => key < 3).map(([record]) => record));
});

test('Where key >', async () => {
  await expect(
    database.change(['rows'], async (trx) => {
      await trx.deleteFrom('rows').whereKey('>', 3);
      return await trx.selectFrom('rows').getAll();
    }),
  ).resolves.toStrictEqual(records.filter(([, key]) => key <= 3).map(([record]) => record));
});

test('Missing upper bounds', async () => {
  await expect(
    database.change(['rows'], async (trx) => {
      // @ts-expect-error -- Missing upper bounds.
      await trx.deleteFrom('rows').whereKey('[]', 3);
    }),
  ).rejects.toThrow(SyntaxError('Missing upper bounds for []'));
  await expect(
    database.change(['rows'], async (trx) => {
      // @ts-expect-error -- Missing upper bounds.
      await trx.deleteFrom('rows').whereKey('(]', 3);
    }),
  ).rejects.toThrow(SyntaxError('Missing upper bounds for (]'));
  await expect(
    database.change(['rows'], async (trx) => {
      // @ts-expect-error -- Missing upper bounds.
      await trx.deleteFrom('rows').whereKey('[)', 3);
    }),
  ).rejects.toThrow(SyntaxError('Missing upper bounds for [)'));
  await expect(
    database.change(['rows'], async (trx) => {
      // @ts-expect-error -- Missing upper bounds.
      await trx.deleteFrom('rows').whereKey('()', 3);
    }),
  ).rejects.toThrow(SyntaxError('Missing upper bounds for ()'));
});

test('Where key []', async () => {
  await expect(
    database.change(['rows'], async (trx) => {
      await trx.deleteFrom('rows').whereKey('[]', 3, 7);
      return await trx.selectFrom('rows').getAll();
    }),
  ).resolves.toStrictEqual(records.toSpliced(2, 5).map(([record]) => record));
});
test('Where key (]', async () => {
  await expect(
    database.change(['rows'], async (trx) => {
      await trx.deleteFrom('rows').whereKey('(]', 3, 7);
      return await trx.selectFrom('rows').getAll();
    }),
  ).resolves.toStrictEqual(records.toSpliced(3, 4).map(([record]) => record));
});
test('Where key [)', async () => {
  await expect(
    database.change(['rows'], async (trx) => {
      await trx.deleteFrom('rows').whereKey('[)', 3, 7);
      return await trx.selectFrom('rows').getAll();
    }),
  ).resolves.toStrictEqual(records.toSpliced(2, 4).map(([record]) => record));
});
test('Where key ()', async () => {
  await expect(
    database.change(['rows'], async (trx) => {
      await trx.deleteFrom('rows').whereKey('()', 3, 7);
      return await trx.selectFrom('rows').getAll();
    }),
  ).resolves.toStrictEqual(records.toSpliced(3, 3).map(([record]) => record));
});

test('Unknown operator', async () => {
  await expect(
    database.change(['rows'], async (trx) => {
      // @ts-expect-error -- Unknown operator.
      await trx.deleteFrom('rows').whereKey('==');
    }),
  ).rejects.toThrow(SyntaxError('Unknown operator =='));
});
