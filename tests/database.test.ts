import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineDatabase, dropDatabase, listDatabases } from '../src/database';
import { AutoIncrement } from '../src/schema';
import { ReadOnlyTransaction, ReadWriteTransaction } from '../src/transactions';
import { getSuitePath } from './tools/utilities';
import type { Store } from '../src/database';

test('Management', async (context) => {
  const suiteName = getSuitePath(context);

  const useOneDb = defineDatabase({
    name: `${suiteName}/test0001`,
    migrations: [
      (trx) => {
        trx.createStore('rows');
      },
    ],
  });
  const useTwoDb = defineDatabase({
    name: `${suiteName}/test0002`,
    migrations: [
      (trx) => {
        trx.createStore('rows');
      },
    ],
  });
  const useThreeDb = defineDatabase({
    name: `${suiteName}/test0003`,
    migrations: [
      (trx) => {
        trx.createStore('rows');
      },
    ],
  });

  await useOneDb().change(['rows'], async () => await Promise.resolve());
  await useTwoDb().change(['rows'], async () => await Promise.resolve());
  await useThreeDb().change(['rows'], async () => await Promise.resolve());

  useOneDb().close();
  useTwoDb().close();
  useThreeDb().close();

  await expect(listDatabases()).resolves.toEqual(
    expect.arrayContaining([`${suiteName}/test0001`, `${suiteName}/test0002`, `${suiteName}/test0003`]),
  );

  await dropDatabase(`${suiteName}/test0002`);

  await expect(listDatabases()).resolves.not.toContain(`${suiteName}/test0002`);

  await expect(listDatabases()).resolves.toEqual(
    expect.arrayContaining([`${suiteName}/test0001`, `${suiteName}/test0003`]),
  );
});

describe('Database', () => {
  type TestSchema = {
    rows: Store<{ name: string; maybe?: unknown }, AutoIncrement, { maybe: 'maybe' }>;
  };

  let suiteName: string;
  let useDatabase: ReturnType<typeof defineDatabase<TestSchema>>;
  beforeEach((context) => {
    suiteName = getSuitePath(context);
    useDatabase = defineDatabase<TestSchema>({
      name: suiteName,
      migrations: [
        (trx) => {
          trx.createStore('rows', AutoIncrement);
        },
      ],
    });
  });

  test('getName', async () => {
    const database = useDatabase();
    await expect(database.getName()).resolves.toEqual(suiteName);
  });

  test('getVersion', async () => {
    const database = useDatabase();
    await expect(database.getVersion()).resolves.toEqual(1);
  });

  test('getStores', async () => {
    const database = useDatabase();
    await expect(database.getStores()).resolves.toEqual(['rows']);
  });

  test('read', async () => {
    const database = useDatabase();
    const spy = vi.fn(() => 1);
    await expect(database.read(['rows'], spy)).resolves.toBe(1);
    expect(spy).toHaveBeenCalledExactlyOnceWith(expect.any(ReadOnlyTransaction));
  });

  test('async read', async () => {
    const database = useDatabase();
    const spy = vi.fn(async () => await Promise.resolve(1));
    await expect(database.read(['rows'], spy)).resolves.toBe(1);
    expect(spy).toHaveBeenCalledExactlyOnceWith(expect.any(ReadOnlyTransaction));
  });

  test('change', async () => {
    const database = useDatabase();
    const spy = vi.fn(() => 1);
    await expect(database.change(['rows'], spy)).resolves.toBe(1);
    expect(spy).toHaveBeenCalledExactlyOnceWith(expect.any(ReadWriteTransaction));
  });

  test('async change', async () => {
    const database = useDatabase();
    const spy = vi.fn(async () => await Promise.resolve(1));
    await expect(database.change(['rows'], spy)).resolves.toBe(1);
    expect(spy).toHaveBeenCalledExactlyOnceWith(expect.any(ReadWriteTransaction));
  });
});
