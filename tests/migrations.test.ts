import { beforeEach, describe, expect, test, vi } from 'vitest';
import { defineDatabase, AutoIncrement, ManualKey, DatabaseBuilder, StoreBuilder } from '../src';
import { getSuitePath } from './tools/utilities';

let suiteName: string;
beforeEach((context) => {
  suiteName = getSuitePath(context);
});

describe('Upgrading', () => {
  test('Full', async () => {
    const version1 = vi.fn(() => undefined).mockName('version1');
    const version2 = vi.fn(() => undefined).mockName('version2');
    const version3 = vi.fn(() => undefined).mockName('version3');

    const useDatabase = defineDatabase({
      name: suiteName,
      migrations: [version1, version2, version3],
    });

    const database = useDatabase();

    await expect(database.getName()).resolves.not.toThrow();
    expect(version1).toHaveBeenCalledExactlyOnceWith(expect.any(DatabaseBuilder));
    expect(version2).toHaveBeenCalledExactlyOnceWith(expect.any(DatabaseBuilder));
    expect(version3).toHaveBeenCalledExactlyOnceWith(expect.any(DatabaseBuilder));

    database.close();
    version1.mockClear();
    version2.mockClear();
    version3.mockClear();

    await expect(database.getName()).resolves.toEqual(suiteName);
    expect(version1).not.toHaveBeenCalled();
    expect(version2).not.toHaveBeenCalled();
    expect(version3).not.toHaveBeenCalled();
  });

  test('Partial', async () => {
    const version1 = vi.fn(() => undefined).mockName('version1');
    const version2 = vi.fn(() => undefined).mockName('version2');
    const version3 = vi.fn(() => undefined).mockName('version3');
    const version4 = vi.fn(() => undefined).mockName('version4');
    const version5 = vi.fn(() => undefined).mockName('version5');
    const version6 = vi.fn(() => undefined).mockName('version6');

    const useDatabaseV3 = defineDatabase({
      name: suiteName,
      migrations: [version1, version2, version3],
    });

    const useDatabaseV6 = defineDatabase({
      name: suiteName,
      migrations: [version1, version2, version3, version4, version5, version6],
    });

    const databaseV3 = useDatabaseV3();

    await expect(databaseV3.getName()).resolves.not.toThrow();
    expect(version1).toHaveBeenCalledExactlyOnceWith(expect.any(DatabaseBuilder));
    expect(version2).toHaveBeenCalledExactlyOnceWith(expect.any(DatabaseBuilder));
    expect(version3).toHaveBeenCalledExactlyOnceWith(expect.any(DatabaseBuilder));
    expect(version4).not.toHaveBeenCalled();
    expect(version5).not.toHaveBeenCalled();
    expect(version6).not.toHaveBeenCalled();

    databaseV3.close();
    version1.mockClear();
    version2.mockClear();
    version3.mockClear();
    version4.mockClear();
    version5.mockClear();
    version6.mockClear();

    const databaseV6 = useDatabaseV6();

    await expect(databaseV6.getName()).resolves.not.toThrow();
    expect(version1).not.toHaveBeenCalled();
    expect(version2).not.toHaveBeenCalled();
    expect(version3).not.toHaveBeenCalled();
    expect(version4).toHaveBeenCalledExactlyOnceWith(expect.any(DatabaseBuilder));
    expect(version5).toHaveBeenCalledExactlyOnceWith(expect.any(DatabaseBuilder));
    expect(version6).toHaveBeenCalledExactlyOnceWith(expect.any(DatabaseBuilder));

    databaseV6.close();
    version1.mockClear();
    version2.mockClear();
    version3.mockClear();
    version4.mockClear();
    version5.mockClear();
    version6.mockClear();

    await expect(databaseV6.getName()).resolves.not.toThrow();
    expect(version1).not.toHaveBeenCalled();
    expect(version2).not.toHaveBeenCalled();
    expect(version3).not.toHaveBeenCalled();
    expect(version4).not.toHaveBeenCalled();
    expect(version5).not.toHaveBeenCalled();
    expect(version6).not.toHaveBeenCalled();

    databaseV6.close();
    version1.mockClear();
    version2.mockClear();
    version3.mockClear();
    version4.mockClear();
    version5.mockClear();
    version6.mockClear();

    await expect(databaseV3.getName()).rejects.toThrow(
      expect.objectContaining({
        name: 'VersionError',
      }) as undefined,
    );
  });
});

describe('Building Database', () => {
  describe('Failing', () => {
    test('In migration', async () => {
      const useDatabase = defineDatabase({
        name: suiteName,
        migrations: [
          (trx) => trx.createStore('store2'),
          () => {
            throw new ReferenceError('A test');
          },
        ],
      });

      const database = useDatabase();
      await expect(database.getStores()).rejects.toThrow(
        expect.objectContaining({
          name: 'MigrationError',
          migration: '2',
          cause: new ReferenceError('A test'),
        }) as undefined,
      );
    });

    test('Before migration', async () => {
      const useDatabase = defineDatabase({
        name: suiteName,
        migrations: true as never,
      });

      const database = useDatabase();
      await expect(database.getStores()).rejects.toThrow(
        expect.objectContaining({
          name: 'MigrationError',
          message: expect.stringContaining('Error before starting migrations') as string,
          cause: expect.objectContaining({
            name: 'TypeError',
          }) as undefined,
        }) as undefined,
      );
    });
  });

  describe('Stores', () => {
    describe('Creating', () => {
      test('New stores', async () => {
        const useDatabase = defineDatabase({
          name: suiteName,
          migrations: [
            (trx) => {
              const store2 = trx.createStore('store2');
              expect(store2).toBeInstanceOf(StoreBuilder);
              expect(store2.name).toBe('store2');
              expect(store2.keyPath).toBe(ManualKey);

              const store3 = trx.createStore('store3', AutoIncrement);
              expect(store3).toBeInstanceOf(StoreBuilder);
              expect(store3.name).toBe('store3');
              expect(store3.keyPath).toBe(AutoIncrement);

              const store4 = trx.createStore('store4', 'id');
              expect(store4).toBeInstanceOf(StoreBuilder);
              expect(store4.name).toBe('store4');
              expect(store4.keyPath).toBe('id');
            },
          ],
        });

        const database = useDatabase();
        await expect(database.getStores()).resolves.toStrictEqual(['store2', 'store3', 'store4']);
      });

      test('Store already exists', async () => {
        const useDatabase = defineDatabase({
          name: suiteName,
          migrations: [(trx) => trx.createStore('store2'), (trx) => trx.createStore('store2')],
        });

        const database = useDatabase();
        await expect(database.getStores()).rejects.toThrow(
          expect.objectContaining({
            name: 'MigrationError',
            migration: '2',
            cause: expect.objectContaining({
              name: 'ConstraintError',
            }) as undefined,
          }) as undefined,
        );
      });
    });

    describe('Altering', () => {
      test('Existing stores', async () => {
        const useDatabase = defineDatabase({
          name: suiteName,
          migrations: [
            (trx) => {
              trx.createStore('store2');
              trx.createStore('store3');
              trx.createStore('store4');
            },
            (trx) => {
              expect(trx.alterStore('store2')).toBeInstanceOf(StoreBuilder);
              expect(trx.alterStore('store3')).toBeInstanceOf(StoreBuilder);
              expect(trx.alterStore('store4')).toBeInstanceOf(StoreBuilder);
            },
          ],
        });

        const database = useDatabase();
        await expect(database.getStores()).resolves.toStrictEqual(['store2', 'store3', 'store4']);
      });

      test('Non-existent store', async () => {
        const useDatabase = defineDatabase({
          name: suiteName,
          migrations: [(trx) => trx.createStore('store2'), (trx) => trx.alterStore('store3')],
        });

        const database = useDatabase();
        await expect(database.getStores()).rejects.toThrow(
          expect.objectContaining({
            name: 'MigrationError',
            migration: '2',
            cause: expect.objectContaining({
              name: 'NotFoundError',
            }) as undefined,
          }) as undefined,
        );
      });
    });

    describe('Dropping', () => {
      test('Existing stores', async () => {
        const useDatabase = defineDatabase({
          name: suiteName,
          migrations: [
            (trx) => {
              trx.createStore('store2');
              trx.createStore('store3');
            },
            (trx) => {
              trx.dropStore('store3');
            },
          ],
        });

        const database = useDatabase();
        await expect(database.getStores()).resolves.toStrictEqual(['store2']);
      });

      test('Non-existent store', async () => {
        const useDatabase = defineDatabase({
          name: suiteName,
          migrations: [(trx) => trx.createStore('store2'), (trx) => trx.dropStore('store3')],
        });

        const database = useDatabase();
        await expect(database.getStores()).rejects.toThrow(
          expect.objectContaining({
            name: 'MigrationError',
            migration: '2',
            cause: expect.objectContaining({
              name: 'NotFoundError',
            }) as undefined,
          }) as undefined,
        );
      });
    });
  });

  describe('Indices', () => {
    describe('Creating', () => {
      test('New Indices', async () => {
        const useDatabase = defineDatabase({
          name: suiteName,
          migrations: [
            (trx) => {
              const store2 = trx.createStore('store2');
              store2.createIndex('index1', 'field1');
              store2.createIndex('index2', 'field2', { multiEntry: true });
              store2.createIndex('index3', 'field3', { unique: true });

              expect(store2.indexNames).toEqual(['index1', 'index2', 'index3']);
            },
          ],
        });

        const database = useDatabase();
        await expect(database.getName()).resolves.toBe(suiteName);
        await expect(database.getStores()).resolves.toStrictEqual(['store2']);
      });

      test('Existing Indices', async () => {
        const useDatabase = defineDatabase({
          name: suiteName,
          migrations: [
            (trx) => {
              const store2 = trx.createStore('store2');
              store2.createIndex('index1', 'field1');
              store2.createIndex('index1', 'field2', { multiEntry: true });
            },
          ],
        });

        const database = useDatabase();
        await expect(database.getStores()).rejects.toThrow(
          expect.objectContaining({
            name: 'MigrationError',
            migration: '1',
            cause: expect.objectContaining({
              name: 'ConstraintError',
            }) as undefined,
          }) as undefined,
        );
      });
    });

    describe('Dropping', () => {
      test('Existing Indices', async () => {
        const useDatabase = defineDatabase({
          name: suiteName,
          migrations: [
            (trx) => {
              const store2 = trx.createStore('store2');
              store2.createIndex('index1', 'field1');
              store2.createIndex('index2', 'field2', { multiEntry: true });
              store2.createIndex('index3', 'field3', { unique: true });

              expect(store2.indexNames).toEqual(['index1', 'index2', 'index3']);
            },
            (trx) => {
              const store2 = trx.alterStore('store2');
              store2.dropIndex('index2');

              expect(store2.indexNames).toEqual(['index1', 'index3']);
            },
          ],
        });

        const database = useDatabase();
        await expect(database.getName()).resolves.toBe(suiteName);
        await expect(database.getStores()).resolves.toStrictEqual(['store2']);
      });

      test('Non-existent Indices', async () => {
        const useDatabase = defineDatabase({
          name: suiteName,
          migrations: [
            (trx) => {
              const store2 = trx.createStore('store2');
              store2.createIndex('index1', 'field1');
              store2.dropIndex('index2');
            },
          ],
        });

        const database = useDatabase();
        await expect(database.getStores()).rejects.toThrow(
          expect.objectContaining({
            name: 'MigrationError',
            migration: '1',
            cause: expect.objectContaining({
              name: 'NotFoundError',
            }) as undefined,
          }) as undefined,
        );
      });
    });
  });
});
