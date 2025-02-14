import { beforeEach, describe, expect, test } from 'vitest';
import { defineDatabase, dropDatabase } from '../src/database';
import { AutoIncrement } from '../src/utilities';
import { getSuitePath } from './tools/utilities';
import type { Store } from '../src/database';

type TestSchema = {
  rows: Store<{ name: string; maybe?: unknown }, AutoIncrement>;
};

let useDatabase: ReturnType<typeof defineDatabase<TestSchema>>;
beforeEach(async (context) => {
  const name = getSuitePath(context);
  await dropDatabase(name);
  useDatabase = defineDatabase<TestSchema>({
    name,
    migrations: [(trx) => trx.createStore('rows', AutoIncrement)],
  });
});

describe('insertion', () => {
  test('basic', async () => {
    const db = useDatabase();
    await db.change(['rows'], async (trx) => {
      await expect(trx.insertInto('rows').add({ name: 'row1' })).resolves.toBeUndefined();
    });

    await db.read(['rows'], async (trx) => {
      await expect(trx.selectFrom('rows').getAll()).resolves.toStrictEqual([{ name: 'row1' }]);
    });
  });
});
