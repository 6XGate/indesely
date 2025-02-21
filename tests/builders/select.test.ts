import { beforeEach, describe, expect, test } from 'vitest';
import { defineDatabase } from '../../src';
import { getSuitePath } from '../tools/utilities';
import type { Database, DatabaseFactory, ManualKey, Store } from '../../src';
import type { ReadonlyTuple } from 'type-fest';

let suiteName: string;
beforeEach((context) => {
  suiteName = getSuitePath(context);
});

describe('Basic operations', () => {
  type Row = {
    name: string;
    balance: number;
    type: string;
  };

  type Schema = {
    rows: Store<Row>;
  };

  let useDatabase: DatabaseFactory<Schema>;
  let records: ReadonlyTuple<[row: Row, id: IDBValidKey], 9>;
  let database: Database<Schema>;

  beforeEach(async () => {
    useDatabase = defineDatabase<Schema>({
      name: suiteName,
      migrations: [(trx) => trx.createStore('rows')],
    });

    records = [
      [{ name: 'Malcolm', balance: 20_092.76, type: 'checking' }, 1],
      [{ name: 'Zoë', balance: 17_521.86, type: 'checking' }, 2],
      [{ name: 'Hoban', balance: 10_784.41, type: 'checking' }, 3],
      [{ name: 'Jayne', balance: 10_282.05, type: 'checking' }, 4],
      [{ name: 'Kaywinnet', balance: 12_401.22, type: 'checking' }, 5],
      [{ name: 'River', balance: 102_102.01, type: 'checking' }, 6],
      [{ name: 'Simon', balance: 97_208.11, type: 'checking' }, 7],
      [{ name: 'Inara', balance: 31_100.49, type: 'checking' }, 8],
      [{ name: 'Derrial', balance: 5_789.12, type: 'checking' }, 9],
    ];

    database = useDatabase();
    await database.change(['rows'], async (trx) => {
      const builder = trx.update('rows');
      for (const [row, id] of records) {
        await builder.add(row, id);
      }
    });
  });

  describe('Cursors', () => {
    test('Value cursor', async () => {
      await database.read(['rows'], async (trx) => {
        let pos = 0;
        for await (const cursor of trx.selectFrom('rows').cursor()) {
          const [value, key] = records.at(pos) ?? [];
          expect(cursor.key).toBe(key);
          expect(cursor.primaryKey).toBe(key);
          expect(cursor.value).toStrictEqual(value);

          pos += 1;
        }
        for await (const cursor of trx.selectFrom('rows').cursor('prev')) {
          pos -= 1;

          const [value, key] = records.at(pos) ?? [];
          expect(cursor.key).toBe(key);
          expect(cursor.primaryKey).toBe(key);
          expect(cursor.value).toStrictEqual(value);
        }
      });
    });
    test('Key cursor', async () => {
      await database.read(['rows'], async (trx) => {
        let pos = 0;
        for await (const cursor of trx.selectFrom('rows').keyCursor()) {
          const [, key] = records.at(pos) ?? [];
          expect(cursor.key).toBe(key);
          expect(cursor.primaryKey).toBe(key);

          pos += 1;
        }
        for await (const cursor of trx.selectFrom('rows').keyCursor('prev')) {
          pos -= 1;

          const [, key] = records.at(pos) ?? [];
          expect(cursor.key).toBe(key);
          expect(cursor.primaryKey).toBe(key);
        }
      });
    });
    test('Value stream', async () => {
      await database.read(['rows'], async (trx) => {
        let pos = 0;
        for await (const row of trx.selectFrom('rows').stream()) {
          const [value] = records.at(pos) ?? [];
          expect(row).toStrictEqual(value);

          pos += 1;
        }
        for await (const row of trx.selectFrom('rows').stream('prev')) {
          pos -= 1;

          const [value] = records.at(pos) ?? [];
          expect(row).toStrictEqual(value);
        }
      });
    });
    test('Key stream', async () => {
      await database.read(['rows'], async (trx) => {
        let pos = 0;
        for await (const key of trx.selectFrom('rows').streamKeys()) {
          const [, value] = records.at(pos) ?? [];
          expect(key).toStrictEqual(value);

          pos += 1;
        }
        for await (const key of trx.selectFrom('rows').streamKeys('prev')) {
          pos -= 1;

          const [, value] = records.at(pos) ?? [];
          expect(key).toStrictEqual(value);
        }
      });
    });
    test('Primary key stream', async () => {
      await database.read(['rows'], async (trx) => {
        let pos = 0;
        for await (const key of trx.selectFrom('rows').streamPrimaryKeys()) {
          const [, value] = records.at(pos) ?? [];
          expect(key).toStrictEqual(value);

          pos += 1;
        }
        for await (const key of trx.selectFrom('rows').streamPrimaryKeys('prev')) {
          pos -= 1;

          const [, value] = records.at(pos) ?? [];
          expect(key).toStrictEqual(value);
        }
      });
    });
    test('Advancing cursor', async () => {
      await database.read(['rows'], async (trx) => {
        let pos = 0;
        for await (const cursor of trx.selectFrom('rows').cursor()) {
          const [value, key] = records.at(pos) ?? [];
          expect(cursor.key).toBe(key);
          expect(cursor.primaryKey).toBe(key);
          expect(cursor.value).toStrictEqual(value);

          cursor.advance(2);
          pos += 2;
        }
      });
    });
    test('Continuing cursor', async () => {
      await database.read(['rows'], async (trx) => {
        let pos = 0;
        for await (const cursor of trx.selectFrom('rows').cursor()) {
          const [value, key] = records.at(pos) ?? [];
          expect(cursor.key).toBe(key);
          expect(cursor.primaryKey).toBe(key);
          expect(cursor.value).toStrictEqual(value);

          cursor.continue(pos + 3);
          pos += 2;
        }
      });
    });
  });
  test('Retrieval', async () => {
    await expect(database.read(['rows'], async (trx) => await trx.selectFrom('rows').getAll())).resolves.toStrictEqual(
      records.map(([row]) => row),
    );
    await expect(
      database.read(['rows'], async (trx) => await trx.selectFrom('rows').getAllKeys()),
    ).resolves.toStrictEqual(records.map(([, key]) => key));
    await expect(database.read(['rows'], async (trx) => await trx.selectFrom('rows').count())).resolves.toBe(9);
  });
  test('Update', async () => {
    const changes = new Array<Row>();
    await database.change(['rows'], async (trx) => {
      for await (const cursor of trx.selectFrom('rows').cursor()) {
        const row = cursor.value;
        const change = { ...row, balance: row.balance / 2 };
        await cursor.update(change);
        changes.push(change);
      }
    });

    await expect(database.read(['rows'], async (trx) => await trx.selectFrom('rows').getAll())).resolves.toStrictEqual(
      changes,
    );
  });
  test('Delete', async () => {
    const kept = new Array<Row>();
    await database.change(['rows'], async (trx) => {
      let index = 0;
      for await (const cursor of trx.selectFrom('rows').cursor()) {
        if (index % 2 === 0) {
          kept.push(cursor.value);
        } else {
          await cursor.delete();
        }

        index += 1;
      }
    });

    await expect(database.read(['rows'], async (trx) => await trx.selectFrom('rows').getAll())).resolves.toStrictEqual(
      kept,
    );
    await expect(database.read(['rows'], async (trx) => await trx.selectFrom('rows').count())).resolves.toBe(5);
  });
});

describe('Key lookup operations', () => {
  type Row = {
    name: string;
    balance: number;
    type: string;
  };

  type Schema = {
    rows: Store<Row, ManualKey<number>>;
  };

  let useDatabase: DatabaseFactory<Schema>;
  let records: ReadonlyTuple<[row: Row, id: number], 9>;
  let database: Database<Schema>;

  beforeEach(async () => {
    useDatabase = defineDatabase<Schema>({
      name: suiteName,
      migrations: [(trx) => trx.createStore('rows')],
    });

    records = [
      [{ name: 'Malcolm', balance: 20_092.76, type: 'checking' }, 1],
      [{ name: 'Zoë', balance: 17_521.86, type: 'checking' }, 2],
      [{ name: 'Hoban', balance: 10_784.41, type: 'checking' }, 3],
      [{ name: 'Jayne', balance: 10_282.05, type: 'checking' }, 4],
      [{ name: 'Kaywinnet', balance: 12_401.22, type: 'checking' }, 5],
      [{ name: 'River', balance: 102_102.01, type: 'checking' }, 6],
      [{ name: 'Simon', balance: 97_208.11, type: 'checking' }, 7],
      [{ name: 'Inara', balance: 31_100.49, type: 'checking' }, 8],
      [{ name: 'Derrial', balance: 5_789.12, type: 'checking' }, 9],
    ];

    database = useDatabase();
    await database.change(['rows'], async (trx) => {
      const builder = trx.update('rows');
      for (const [row, id] of records) {
        await builder.add(row, id);
      }
    });
  });

  describe('Manual key', () => {
    describe('Direct keys', () => {
      describe('Cursors', () => {
        test('Value cursor', async () => {
          await expect(
            database.read(['rows'], async (trx) => {
              let count = 0;
              const [value, key] = records[4];
              for await (const cursor of trx.selectFrom('rows').whereKey('=', 5).cursor()) {
                expect(cursor.key).toBe(key);
                expect(cursor.primaryKey).toBe(key);
                expect(cursor.value).toStrictEqual(value);

                count += 1;
              }

              return count;
            }),
          ).resolves.toBe(1);
        });
        test('Key cursor', async () => {
          await expect(
            database.read(['rows'], async (trx) => {
              let count = 0;
              const [, key] = records[4];
              for await (const cursor of trx.selectFrom('rows').whereKey('=', 5).keyCursor()) {
                expect(cursor.key).toBe(key);
                expect(cursor.primaryKey).toBe(key);

                count += 1;
              }

              return count;
            }),
          ).resolves.toBe(1);
        });
        test('Value stream', async () => {
          await expect(
            database.read(['rows'], async (trx) => {
              let count = 0;
              const [value] = records[4];
              for await (const row of trx.selectFrom('rows').whereKey('=', 5).stream()) {
                expect(row).toStrictEqual(value);

                count += 1;
              }

              return count;
            }),
          ).resolves.toBe(1);
        });
        test('Key stream', async () => {
          await expect(
            database.read(['rows'], async (trx) => {
              let count = 0;
              const [, value] = records[4];
              for await (const key of trx.selectFrom('rows').whereKey('=', 5).streamKeys()) {
                expect(key).toStrictEqual(value);

                count += 1;
              }

              return count;
            }),
          ).resolves.toBe(1);
        });
        test('Primary key stream', async () => {
          await expect(
            database.read(['rows'], async (trx) => {
              let count = 0;
              const [, value] = records[4];
              for await (const key of trx.selectFrom('rows').whereKey('=', 5).streamPrimaryKeys()) {
                expect(key).toStrictEqual(value);

                count += 1;
              }

              return count;
            }),
          ).resolves.toBe(1);
        });
      });
      describe('Retrieval', () => {
        test('"All"', async () => {
          const [value, key] = records[4];
          await expect(
            database.read(['rows'], async (trx) => await trx.selectFrom('rows').whereKey('=', 5).getAll()),
          ).resolves.toStrictEqual([value]);
          await expect(
            database.read(['rows'], async (trx) => await trx.selectFrom('rows').whereKey('=', 5).getAllKeys()),
          ).resolves.toStrictEqual([key]);
          await expect(
            database.read(['rows'], async (trx) => await trx.selectFrom('rows').whereKey('=', 5).count()),
          ).resolves.toBe(1);
        });
        test('First or null', async () => {
          const [value, key] = records[4];
          await expect(
            database.read(['rows'], async (trx) => await trx.selectFrom('rows').whereKey('=', 5).getFirst()),
          ).resolves.toStrictEqual(value);
          await expect(
            database.read(['rows'], async (trx) => await trx.selectFrom('rows').whereKey('=', 5).getFirstKey()),
          ).resolves.toStrictEqual(key);
          await expect(
            database.read(['rows'], async (trx) => await trx.selectFrom('rows').whereKey('=', 99).getFirst()),
          ).resolves.toStrictEqual(null);
          await expect(
            database.read(['rows'], async (trx) => await trx.selectFrom('rows').whereKey('=', 99).getFirstKey()),
          ).resolves.toStrictEqual(undefined);
        });
        test('First or fail', async () => {
          const [value, key] = records[4];
          await expect(
            database.read(['rows'], async (trx) => await trx.selectFrom('rows').whereKey('=', 5).getFirstOrThrow()),
          ).resolves.toStrictEqual(value);
          await expect(
            database.read(['rows'], async (trx) => await trx.selectFrom('rows').whereKey('=', 5).getFirstKeyOrThrow()),
          ).resolves.toStrictEqual(key);
          await expect(
            database.read(['rows'], async (trx) => await trx.selectFrom('rows').whereKey('=', 99).getFirstOrThrow()),
          ).rejects.toThrow(Error);
          await expect(
            database.read(['rows'], async (trx) => await trx.selectFrom('rows').whereKey('=', 99).getFirstKeyOrThrow()),
          ).rejects.toThrow(Error);
        });
      });
      test('Update', async () => {
        const changes = new Array<Row>();
        await database.change(['rows'], async (trx) => {
          for await (const cursor of trx.selectFrom('rows').whereKey('=', 5).cursor()) {
            const row = cursor.value;
            const change = { ...row, balance: row.balance / 2 };
            await cursor.update(change);
            changes.push(change);
          }
        });

        expect(changes).toHaveLength(1);
        await expect(
          database.read(['rows'], async (trx) => await trx.selectFrom('rows').whereKey('=', 5).getAll()),
        ).resolves.toStrictEqual(changes);
      });
      test('Delete', async () => {
        await expect(
          database.change(['rows'], async (trx) => {
            let count = 0;
            for await (const cursor of trx.selectFrom('rows').whereKey('=', 5).cursor()) {
              await cursor.delete();
              count += 1;
            }

            return count;
          }),
        ).resolves.toBe(1);

        await expect(
          database.read(['rows'], async (trx) => await trx.selectFrom('rows').whereKey('=', 5).getAll()),
        ).resolves.toStrictEqual([]);
        await expect(
          database.read(['rows'], async (trx) => await trx.selectFrom('rows').whereKey('=', 5).count()),
        ).resolves.toBe(0);
      });
    });
    describe('Relative to keys', () => {
      describe.todo('Cursors');
      describe.todo('Retrieval');
      describe.todo('Update');
      describe.todo('Delete');
    });
    describe('Keys in range', () => {
      describe.todo('Cursors');
      describe.todo('Retrieval');
      describe.todo('Update');
      describe.todo('Delete');
    });
  });

  describe('Auto increment key', () => {
    describe('Direct keys', () => {
      describe.todo('Cursors');
      describe.todo('Retrieval');
      describe.todo('Update');
      describe.todo('Delete');
    });
    describe('Relative to keys', () => {
      describe.todo('Cursors');
      describe.todo('Retrieval');
      describe.todo('Update');
      describe.todo('Delete');
    });
    describe('Keys in range', () => {
      describe.todo('Cursors');
      describe.todo('Retrieval');
      describe.todo('Update');
      describe.todo('Delete');
    });
  });

  describe('Automatic key', () => {
    describe('Direct keys', () => {
      describe.todo('Cursors');
      describe.todo('Retrieval');
      describe.todo('Update');
      describe.todo('Delete');
    });
    describe('Relative to keys', () => {
      describe.todo('Cursors');
      describe.todo('Retrieval');
      describe.todo('Update');
      describe.todo('Delete');
    });
    describe('Keys in range', () => {
      describe.todo('Cursors');
      describe.todo('Retrieval');
      describe.todo('Update');
      describe.todo('Delete');
    });
  });
});

describe('Indexed lookup operations', () => {
  describe('Direct values', () => {
    describe.todo('Cursors');
    describe.todo('Retrieval');
    describe.todo('Update');
    describe.todo('Delete');
  });
  describe('Relative to values', () => {
    describe.todo('Cursors');
    describe.todo('Retrieval');
    describe.todo('Update');
    describe.todo('Delete');
  });
  describe('Values in range', () => {
    describe.todo('Cursors');
    describe.todo('Retrieval');
    describe.todo('Update');
    describe.todo('Delete');
  });
});
