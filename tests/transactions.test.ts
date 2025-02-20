import { beforeEach, expect, test } from 'vitest';
import { defineDatabase, ManualKey, ObjectStore } from '../src';
import { getSuitePath } from './tools/utilities';

let suiteName: string;
beforeEach((context) => {
  suiteName = getSuitePath(context);
});

test('Store information', async () => {
  const useDatabase = defineDatabase({
    name: suiteName,
    migrations: [(trx) => trx.createStore('store2')],
  });

  const database = useDatabase();
  await database.read(['store2'], (trx) => {
    const store = trx.getObjectStore('store2');
    expect(store).toBeInstanceOf(ObjectStore);
    expect(store.name).toBe('store2');
    expect(store.keyPath).toBe(ManualKey);
    expect(store.indexNames).toStrictEqual([]);
  });
});
