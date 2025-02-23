import { alphabetical } from 'radashi';
import { beforeEach, describe, expect, test } from 'vitest';
import { defineDatabase, AutoIncrement } from '../../src';
import { getSuitePath } from '../tools/utilities';
import type { Database, ManualKey, Store } from '../../src';
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
type IndexedStore = { rows: Store<Row, ManualKey, { name: 'name'; type: 'type' }> };

let records: ReadonlyTuple<[row: Row, id: number], 9>;
let sorted: typeof records;
beforeEach(() => {
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

  sorted = alphabetical(records, ([record]) => record.name) as never;
});

describe('Basic operations', () => {
  let database: Database<ManualKeySchema>;

  beforeEach(async () => {
    const useDatabase = defineDatabase<ManualKeySchema>({
      name: suiteName,
      migrations: [(trx) => trx.createStore('rows')],
    });

    database = useDatabase();
    await database.change(['rows'], async (trx) => {
      const builder = trx.update('rows');
      for (const [row, id] of records) {
        await builder.add(row, id);
      }
    });
  });

  test('Where misuse', async () => {
    await expect(database.read(['rows'], async (trx) => await trx.selectFrom('rows').getFirst())).rejects.toThrow(
      SyntaxError('Missing where clause'),
    );
    await expect(
      database.read(['rows'], async (trx) => await trx.selectFrom('rows').getFirstOrThrow()),
    ).rejects.toThrow(SyntaxError('Missing where clause'));
    await expect(database.read(['rows'], async (trx) => await trx.selectFrom('rows').getFirstKey())).rejects.toThrow(
      SyntaxError('Missing where clause'),
    );
    await expect(
      database.read(['rows'], async (trx) => await trx.selectFrom('rows').getFirstKeyOrThrow()),
    ).rejects.toThrow(SyntaxError('Missing where clause'));
    await expect(
      database.read(['rows'], async (trx) => await trx.selectFrom('rows').by('unknown').getFirst()),
    ).rejects.toThrow(SyntaxError('Missing where clause'));
    await expect(
      database.read(['rows'], async (trx) => await trx.selectFrom('rows').by('unknown').getFirstKey()),
    ).rejects.toThrow(SyntaxError('Missing where clause'));
    await expect(
      database.read(['rows'], (trx) =>
        // @ts-expect-error -- Expect an error because `whereKey` has been omitted.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
        trx.selectFrom('rows').whereKey('=', 1).whereKey('=', 1),
      ),
    ).rejects.toThrow(SyntaxError('Where clause cannot be redefined'));
    await expect(
      database.read(['rows'], (trx) =>
        // @ts-expect-error -- Expect an error because `whereKey` has been omitted and no such named index.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
        trx.selectFrom('rows').whereKey('=', 1).where('unknown', '=', 1),
      ),
    ).rejects.toThrow(SyntaxError('Where clause cannot be redefined'));
    await expect(
      database.read(['rows'], (trx) =>
        // @ts-expect-error -- Expect an error because `whereKey` has been omitted and no such named index.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
        trx.selectFrom('rows').by('unknown').where('unknown', '=', 1),
      ),
    ).rejects.toThrow(SyntaxError('Where clause cannot be redefined'));
    // whereKey arguments...
    await expect(
      database.read(['rows'], (trx) =>
        // @ts-expect-error -- Unknown operator.
        trx.selectFrom('rows').whereKey('==', 1),
      ),
    ).rejects.toThrow(SyntaxError('Unknown operator =='));
    await expect(
      database.read(['rows'], (trx) =>
        // @ts-expect-error -- Missing upper bounds.
        trx.selectFrom('rows').whereKey('[]', 1),
      ),
    ).rejects.toThrow(SyntaxError('Missing upper bounds for []'));
    await expect(
      database.read(['rows'], (trx) =>
        // @ts-expect-error -- Missing upper bounds.
        trx.selectFrom('rows').whereKey('(]', 1),
      ),
    ).rejects.toThrow(SyntaxError('Missing upper bounds for (]'));
    await expect(
      database.read(['rows'], (trx) =>
        // @ts-expect-error -- Missing upper bounds.
        trx.selectFrom('rows').whereKey('[)', 1),
      ),
    ).rejects.toThrow(SyntaxError('Missing upper bounds for [)'));
    await expect(
      database.read(['rows'], (trx) =>
        // @ts-expect-error -- Missing upper bounds.
        trx.selectFrom('rows').whereKey('()', 1),
      ),
    ).rejects.toThrow(SyntaxError('Missing upper bounds for ()'));
    // where arguments...
    await expect(
      database.read(['rows'], (trx) =>
        // @ts-expect-error -- Unknown operator and unknown index.
        trx.selectFrom('rows').where('unknown', '==', 1),
      ),
    ).rejects.toThrow(SyntaxError('Unknown operator =='));
    await expect(
      database.read(['rows'], (trx) =>
        // @ts-expect-error -- Missing upper bounds and unknown index.
        trx.selectFrom('rows').where('unknown', '[]', 1),
      ),
    ).rejects.toThrow(SyntaxError('Missing upper bounds for []'));
    await expect(
      database.read(['rows'], (trx) =>
        // @ts-expect-error -- Missing upper bounds and unknown index.
        trx.selectFrom('rows').where('unknown', '(]', 1),
      ),
    ).rejects.toThrow(SyntaxError('Missing upper bounds for (]'));
    await expect(
      database.read(['rows'], (trx) =>
        // @ts-expect-error -- Missing upper bounds and unknown index.
        trx.selectFrom('rows').where('unknown', '[)', 1),
      ),
    ).rejects.toThrow(SyntaxError('Missing upper bounds for [)'));
    await expect(
      database.read(['rows'], (trx) =>
        // @ts-expect-error -- Missing upper bounds and unknown index.
        trx.selectFrom('rows').where('unknown', '()', 1),
      ),
    ).rejects.toThrow(SyntaxError('Missing upper bounds for ()'));
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
  describe('Manual key', () => {
    let database: Database<TypedKeySchema>;

    beforeEach(async () => {
      const useDatabase = defineDatabase<TypedKeySchema>({
        name: suiteName,
        migrations: [(trx) => trx.createStore('rows')],
      });

      database = useDatabase();
      await database.change(['rows'], async (trx) => {
        const builder = trx.update('rows');
        for (const [row, id] of records) {
          await builder.add(row, id);
        }
      });
    });

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
          class TestError extends Error {}
          // TestError will be seen as a class.
          await expect(
            database.read(
              ['rows'],
              async (trx) => await trx.selectFrom('rows').whereKey('=', 99).getFirstOrThrow(TestError),
            ),
          ).rejects.toThrow(TestError);
          // ReferenceError is not seen as a class.
          await expect(
            database.read(
              ['rows'],
              async (trx) => await trx.selectFrom('rows').whereKey('=', 99).getFirstOrThrow(ReferenceError),
            ),
          ).rejects.toThrow(ReferenceError);
          // TestError will be seen as a class.
          await expect(
            database.read(
              ['rows'],
              async (trx) => await trx.selectFrom('rows').whereKey('=', 99).getFirstKeyOrThrow(TestError),
            ),
          ).rejects.toThrow(TestError);
          // ReferenceError is not seen as a class.
          await expect(
            database.read(
              ['rows'],
              async (trx) => await trx.selectFrom('rows').whereKey('=', 99).getFirstKeyOrThrow(ReferenceError),
            ),
          ).rejects.toThrow(ReferenceError);
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
      describe('Cursors', () => {
        test('Raw iterator, >', async () => {
          await database.read(['rows'], async (trx) => {
            let pos = 3;
            const iterator = trx.selectFrom('rows').whereKey('>', 3).stream();
            for (let result = await iterator.next(); !result.done; result = await iterator.next(2)) {
              const [value] = records.at(pos) ?? [];
              expect(result.value).toStrictEqual(value);

              pos += 2;
            }
            expect(pos).toBe(9);

            pos = 8;
            const keyIterator = trx.selectFrom('rows').whereKey('>', 3).streamKeys('prev');
            for (let result = await keyIterator.next(); !result.done; result = await keyIterator.next(2)) {
              const [, key] = records.at(pos) ?? [];
              expect(result.value).toStrictEqual(key);
              pos -= 2;
            }
            expect(pos).toBe(2);

            pos = 3;
            const primaryIterator = trx.selectFrom('rows').whereKey('>', 3).streamPrimaryKeys();
            for (let result = await primaryIterator.next(); !result.done; result = await primaryIterator.next(2)) {
              const [, key] = records.at(pos) ?? [];
              expect(result.value).toStrictEqual(key);

              pos += 2;
            }
            expect(pos).toBe(9);

            pos = 3;
            for await (const result of trx.selectFrom('rows').whereKey('>', 3)) {
              const [row] = records.at(pos) ?? [];
              expect(result).toStrictEqual(row);

              pos += 1;
            }
            expect(pos).toBe(9);
          });
        });

        test('Value cursor, >', async () => {
          await database.read(['rows'], async (trx) => {
            let pos = 3;
            for await (const cursor of trx.selectFrom('rows').whereKey('>', 3).cursor()) {
              const [value, key] = records.at(pos) ?? [];
              expect(cursor.key).toBe(key);
              expect(cursor.primaryKey).toBe(key);
              expect(cursor.value).toStrictEqual(value);

              pos += 1;
            }
            expect(pos).toBe(9);
            for await (const cursor of trx.selectFrom('rows').whereKey('>', 3).cursor('prev')) {
              pos -= 1;

              const [value, key] = records.at(pos) ?? [];
              expect(cursor.key).toBe(key);
              expect(cursor.primaryKey).toBe(key);
              expect(cursor.value).toStrictEqual(value);
            }
            expect(pos).toBe(3);
          });
        });

        test('Key cursor, >=', async () => {
          await database.read(['rows'], async (trx) => {
            let pos = 2;
            for await (const cursor of trx.selectFrom('rows').whereKey('>=', 3).keyCursor()) {
              const [, key] = records.at(pos) ?? [];
              expect(cursor.key).toBe(key);
              expect(cursor.primaryKey).toBe(key);

              pos += 1;
            }
            expect(pos).toBe(9);
            for await (const cursor of trx.selectFrom('rows').whereKey('>=', 3).keyCursor('prev')) {
              pos -= 1;

              const [, key] = records.at(pos) ?? [];
              expect(cursor.key).toBe(key);
              expect(cursor.primaryKey).toBe(key);
            }
            expect(pos).toBe(2);
          });
        });

        test('Value stream, <', async () => {
          await database.read(['rows'], async (trx) => {
            let pos = 0;
            for await (const row of trx.selectFrom('rows').whereKey('<', 7).stream()) {
              const [value] = records.at(pos) ?? [];
              expect(row).toStrictEqual(value);

              pos += 1;
            }
            expect(pos).toBe(6);
            for await (const row of trx.selectFrom('rows').whereKey('<', 7).stream('prev')) {
              pos -= 1;

              const [value] = records.at(pos) ?? [];
              expect(row).toStrictEqual(value);
            }
            expect(pos).toBe(0);
          });
        });

        test('Key stream, <=', async () => {
          await database.read(['rows'], async (trx) => {
            let pos = 0;
            for await (const key of trx.selectFrom('rows').whereKey('<=', 7).streamKeys()) {
              const [, value] = records.at(pos) ?? [];
              expect(key).toStrictEqual(value);

              pos += 1;
            }
            expect(pos).toBe(7);
            for await (const key of trx.selectFrom('rows').whereKey('<=', 7).streamKeys('prev')) {
              pos -= 1;

              const [, value] = records.at(pos) ?? [];
              expect(key).toStrictEqual(value);
            }
            expect(pos).toBe(0);
          });
        });
      });

      test('Retrieval', async () => {
        await expect(
          database.read(['rows'], async (trx) => await trx.selectFrom('rows').whereKey('>', 3).getAll()),
        ).resolves.toStrictEqual(records.slice(3).map(([row]) => row));
        await expect(
          database.read(['rows'], async (trx) => await trx.selectFrom('rows').whereKey('>', 3).getAllKeys()),
        ).resolves.toStrictEqual(records.slice(3).map(([, key]) => key));
        await expect(
          database.read(['rows'], async (trx) => await trx.selectFrom('rows').whereKey('>', 3).count()),
        ).resolves.toBe(6);
      });

      test('Update', async () => {
        const changes = new Array<Row>();
        await database.change(['rows'], async (trx) => {
          for await (const cursor of trx.selectFrom('rows').whereKey('>', 3).cursor()) {
            const row = cursor.value;
            const change = { ...row, balance: row.balance / 2 };
            await cursor.update(change);
            changes.push(change);
          }
        });

        expect(changes).toHaveLength(6);
        await expect(
          database.read(['rows'], async (trx) => await trx.selectFrom('rows').whereKey('>', 3).getAll()),
        ).resolves.toStrictEqual(changes);
      });

      test('Delete', async () => {
        await database.change(['rows'], async (trx) => {
          let count = 0;
          for await (const cursor of trx.selectFrom('rows').whereKey('>', 3).cursor()) {
            await cursor.delete();
            count += 1;
          }

          expect(count).toBe(6);
        });

        await expect(
          database.read(['rows'], async (trx) => await trx.selectFrom('rows').getAll()),
        ).resolves.toStrictEqual(records.toSpliced(3).map(([value]) => value));
        await expect(database.read(['rows'], async (trx) => await trx.selectFrom('rows').count())).resolves.toBe(3);
      });
    });

    describe('Keys in range', () => {
      describe('Cursors', () => {
        test('Value cursor, []', async () => {
          await database.read(['rows'], async (trx) => {
            let pos = 2;
            for await (const cursor of trx.selectFrom('rows').whereKey('[]', 3, 7).cursor()) {
              const [value, key] = records.at(pos) ?? [];
              expect(cursor.key).toBe(key);
              expect(cursor.primaryKey).toBe(key);
              expect(cursor.value).toStrictEqual(value);

              pos += 1;
            }
            expect(pos).toBe(7);
            for await (const cursor of trx.selectFrom('rows').whereKey('[]', 3, 7).cursor('prev')) {
              pos -= 1;

              const [value, key] = records.at(pos) ?? [];
              expect(cursor.key).toBe(key);
              expect(cursor.primaryKey).toBe(key);
              expect(cursor.value).toStrictEqual(value);
            }
            expect(pos).toBe(2);
          });
        });

        test('Key cursor, [)', async () => {
          await database.read(['rows'], async (trx) => {
            let pos = 2;
            for await (const cursor of trx.selectFrom('rows').whereKey('[)', 3, 7).keyCursor()) {
              const [, key] = records.at(pos) ?? [];
              expect(cursor.key).toBe(key);
              expect(cursor.primaryKey).toBe(key);

              pos += 1;
            }
            expect(pos).toBe(6);
            for await (const cursor of trx.selectFrom('rows').whereKey('[)', 3, 7).keyCursor('prev')) {
              pos -= 1;

              const [, key] = records.at(pos) ?? [];
              expect(cursor.key).toBe(key);
              expect(cursor.primaryKey).toBe(key);
            }
            expect(pos).toBe(2);
          });
        });

        test('Value stream, (]', async () => {
          await database.read(['rows'], async (trx) => {
            let pos = 3;
            for await (const row of trx.selectFrom('rows').whereKey('(]', 3, 7).stream()) {
              const [value] = records.at(pos) ?? [];
              expect(row).toStrictEqual(value);

              pos += 1;
            }
            expect(pos).toBe(7);
            for await (const row of trx.selectFrom('rows').whereKey('(]', 3, 7).stream('prev')) {
              pos -= 1;

              const [value] = records.at(pos) ?? [];
              expect(row).toStrictEqual(value);
            }
            expect(pos).toBe(3);
          });
        });

        test('Key stream, ()', async () => {
          await database.read(['rows'], async (trx) => {
            let pos = 3;
            for await (const key of trx.selectFrom('rows').whereKey('()', 3, 7).streamKeys()) {
              const [, value] = records.at(pos) ?? [];
              expect(key).toStrictEqual(value);

              pos += 1;
            }
            expect(pos).toBe(6);
            for await (const key of trx.selectFrom('rows').whereKey('()', 3, 7).streamKeys('prev')) {
              pos -= 1;

              const [, value] = records.at(pos) ?? [];
              expect(key).toStrictEqual(value);
            }
            expect(pos).toBe(3);
          });
        });

        test('Primary key stream, []', async () => {
          await database.read(['rows'], async (trx) => {
            let pos = 2;
            for await (const key of trx.selectFrom('rows').whereKey('[]', 3, 7).streamPrimaryKeys()) {
              const [, value] = records.at(pos) ?? [];
              expect(key).toStrictEqual(value);

              pos += 1;
            }
            expect(pos).toBe(7);
            for await (const key of trx.selectFrom('rows').whereKey('[]', 3, 7).streamPrimaryKeys('prev')) {
              pos -= 1;

              const [, value] = records.at(pos) ?? [];
              expect(key).toStrictEqual(value);
            }
            expect(pos).toBe(2);
          });
        });

        test('Advancing cursor, []', async () => {
          await database.read(['rows'], async (trx) => {
            let pos = 2;
            for await (const cursor of trx.selectFrom('rows').whereKey('[]', 3, 7).cursor()) {
              const [value, key] = records.at(pos) ?? [];
              expect(cursor.key).toBe(key);
              expect(cursor.primaryKey).toBe(key);
              expect(cursor.value).toStrictEqual(value);

              cursor.advance(2);
              pos += 2;
            }
            expect(pos).toBe(8);
          });
        });

        test('Continuing cursor, []', async () => {
          await database.read(['rows'], async (trx) => {
            let pos = 2;
            for await (const cursor of trx.selectFrom('rows').whereKey('[]', 3, 7).cursor()) {
              const [value, key] = records.at(pos) ?? [];
              expect(cursor.key).toBe(key);
              expect(cursor.primaryKey).toBe(key);
              expect(cursor.value).toStrictEqual(value);

              cursor.continue(pos + 3);
              pos += 2;
            }
            expect(pos).toBe(8);
          });
        });
      });

      test('Retrieval', async () => {
        await expect(
          database.read(['rows'], async (trx) => await trx.selectFrom('rows').whereKey('[]', 3, 7).getAll()),
        ).resolves.toStrictEqual(records.slice(2, 7).map(([row]) => row));
        await expect(
          database.read(['rows'], async (trx) => await trx.selectFrom('rows').whereKey('[]', 3, 7).getAllKeys()),
        ).resolves.toStrictEqual(records.slice(2, 7).map(([, key]) => key));
        await expect(
          database.read(['rows'], async (trx) => await trx.selectFrom('rows').whereKey('[]', 3, 7).count()),
        ).resolves.toBe(5);
      });

      test('Update', async () => {
        const changes = new Array<Row>();
        await database.change(['rows'], async (trx) => {
          for await (const cursor of trx.selectFrom('rows').whereKey('[]', 3, 7).cursor()) {
            const row = cursor.value;
            const change = { ...row, balance: row.balance / 2 };
            await cursor.update(change);
            changes.push(change);
          }
        });

        expect(changes).toHaveLength(5);
        await expect(
          database.read(['rows'], async (trx) => await trx.selectFrom('rows').whereKey('[]', 3, 7).getAll()),
        ).resolves.toStrictEqual(changes);
      });

      test('Delete', async () => {
        await database.change(['rows'], async (trx) => {
          let count = 0;
          for await (const cursor of trx.selectFrom('rows').whereKey('[]', 3, 7).cursor()) {
            await cursor.delete();
            count += 1;
          }

          expect(count).toBe(5);
        });

        await expect(
          database.read(['rows'], async (trx) => await trx.selectFrom('rows').getAll()),
        ).resolves.toStrictEqual(records.toSpliced(2, 5).map(([value]) => value));
        await expect(database.read(['rows'], async (trx) => await trx.selectFrom('rows').count())).resolves.toBe(4);
      });
    });
  });

  test('Increment key', async () => {
    const useDatabase = defineDatabase<IncrementKeySchema>({
      name: suiteName,
      migrations: [(trx) => trx.createStore('rows', AutoIncrement)],
    });

    const database = useDatabase();
    await database.change(['rows'], async (trx) => {
      const builder = trx.update('rows');
      for (const [row] of records) {
        await builder.add(row);
      }
    });

    await expect(database.read(['rows'], async (trx) => await trx.selectFrom('rows').getAll())).resolves.toStrictEqual(
      records.map(([row]) => row),
    );
    await expect(
      database.read(['rows'], async (trx) => await trx.selectFrom('rows').getAllKeys()),
    ).resolves.toStrictEqual(records.map(([, key]) => key));
  });

  test('In model key', async () => {
    const useDatabase = defineDatabase<ModelKeySchema>({
      name: suiteName,
      migrations: [(trx) => trx.createStore('rows', 'name')],
    });

    const database = useDatabase();
    await database.change(['rows'], async (trx) => {
      const builder = trx.update('rows');
      for (const [row] of records) {
        await builder.add(row);
      }
    });

    await expect(database.read(['rows'], async (trx) => await trx.selectFrom('rows').getAll())).resolves.toStrictEqual(
      sorted.map(([row]) => row),
    );
    await expect(
      database.read(['rows'], async (trx) => await trx.selectFrom('rows').getAllKeys()),
    ).resolves.toStrictEqual(sorted.map(([row]) => row.name));
  });
});

describe('Indexed lookup operations', () => {
  let database: Database<IndexedStore>;

  beforeEach(async () => {
    const useDatabase = defineDatabase<IndexedStore>({
      name: suiteName,
      migrations: [
        (trx) => trx.createStore('rows').createIndex('name', 'name', { unique: true }).createIndex('type', 'type'),
      ],
    });

    sorted = alphabetical(records, (row) => row[0].name) as never;

    database = useDatabase();
    await database.change(['rows'], async (trx) => {
      const builder = trx.update('rows');
      for (const [row, id] of records) {
        await builder.add(row, id);
      }
    });
  });

  describe('Direct values', () => {
    describe('Cursors', () => {
      test('Value cursor', async () => {
        await expect(
          database.read(['rows'], async (trx) => {
            let count = 0;
            const [value, key] = records[0];
            for await (const cursor of trx.selectFrom('rows').where('name', '=', 'Malcolm').cursor()) {
              expect(cursor.key).toBe(value.name);
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
            const [value, key] = records[1];
            for await (const cursor of trx.selectFrom('rows').where('name', '=', 'Zoë').keyCursor()) {
              expect(cursor.key).toBe(value.name);
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
            const [value] = records[2];
            for await (const row of trx.selectFrom('rows').where('name', '=', 'Hoban').stream()) {
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
            const [value] = records[3];
            for await (const key of trx.selectFrom('rows').where('name', '=', 'Jayne').streamKeys()) {
              expect(key).toStrictEqual(value.name);

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
            for await (const key of trx.selectFrom('rows').where('name', '=', 'Kaywinnet').streamPrimaryKeys()) {
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
        await expect(
          database.read(['rows'], async (trx) => await trx.selectFrom('rows').where('type', '=', 'checking').getAll()),
        ).resolves.toStrictEqual(records.filter(([row]) => row.type === 'checking').map(([row]) => row));
        await expect(
          database.read(
            ['rows'],
            async (trx) => await trx.selectFrom('rows').where('type', '=', 'checking').getAllKeys(),
          ),
        ).resolves.toStrictEqual(records.filter(([row]) => row.type === 'checking').map(([, key]) => key));
        await expect(
          database.read(['rows'], async (trx) => await trx.selectFrom('rows').where('type', '=', 'checking').count()),
        ).resolves.toBe(5);
      });

      test('First or null', async () => {
        const [value, key] = records[5];
        await expect(
          database.read(['rows'], async (trx) => await trx.selectFrom('rows').where('type', '=', 'savings').getFirst()),
        ).resolves.toStrictEqual(value);
        await expect(
          database.read(
            ['rows'],
            async (trx) => await trx.selectFrom('rows').where('type', '=', 'savings').getFirstKey(),
          ),
        ).resolves.toStrictEqual(key);
        await expect(
          database.read(['rows'], async (trx) => await trx.selectFrom('rows').where('type', '=', 'cd').getFirst()),
        ).resolves.toStrictEqual(null);
        await expect(
          database.read(['rows'], async (trx) => await trx.selectFrom('rows').where('type', '=', 'cd').getFirstKey()),
        ).resolves.toStrictEqual(undefined);
      });

      test('First or fail', async () => {
        const [value, key] = records[5];
        await expect(
          database.read(
            ['rows'],
            async (trx) => await trx.selectFrom('rows').where('type', '=', 'savings').getFirstOrThrow(),
          ),
        ).resolves.toStrictEqual(value);
        await expect(
          database.read(
            ['rows'],
            async (trx) => await trx.selectFrom('rows').where('type', '=', 'savings').getFirstKeyOrThrow(),
          ),
        ).resolves.toStrictEqual(key);
        await expect(
          database.read(
            ['rows'],
            async (trx) => await trx.selectFrom('rows').where('type', '=', 'cd').getFirstOrThrow(),
          ),
        ).rejects.toThrow(Error);
        await expect(
          database.read(
            ['rows'],
            async (trx) => await trx.selectFrom('rows').where('type', '=', 'cd').getFirstKeyOrThrow(),
          ),
        ).rejects.toThrow(Error);
        await expect(
          database.read(
            ['rows'],
            async (trx) => await trx.selectFrom('rows').whereKey('=', 99).getFirstOrThrow(ReferenceError),
          ),
        ).rejects.toThrow(ReferenceError);
        await expect(
          database.read(
            ['rows'],
            async (trx) =>
              await trx
                .selectFrom('rows')
                .whereKey('=', 99)
                .getFirstOrThrow(() => new Error('Hi')),
          ),
        ).rejects.toThrow(new Error('Hi'));
      });
    });

    test('Update', async () => {
      const changes = new Array<Row>();
      await database.change(['rows'], async (trx) => {
        for await (const cursor of trx.selectFrom('rows').where('type', '=', 'savings').cursor()) {
          const row = cursor.value;
          const change = { ...row, balance: row.balance / 2 };
          await expect(cursor.update(change)).resolves.toBe(cursor.primaryKey);
          changes.push(change);
        }
      });

      expect(changes).toHaveLength(4);
      await expect(
        database.read(['rows'], async (trx) => await trx.selectFrom('rows').where('type', '=', 'savings').getAll()),
      ).resolves.toStrictEqual(changes);
    });

    test('Delete', async () => {
      await expect(
        database.change(['rows'], async (trx) => {
          let count = 0;
          for await (const cursor of trx.selectFrom('rows').where('type', '=', 'checking').cursor()) {
            await cursor.delete();
            count += 1;
          }

          return count;
        }),
      ).resolves.toBe(5);

      await expect(
        database.read(['rows'], async (trx) => await trx.selectFrom('rows').where('type', '=', 'checking').getAll()),
      ).resolves.toStrictEqual([]);
      await expect(
        database.read(['rows'], async (trx) => await trx.selectFrom('rows').where('type', '=', 'checking').count()),
      ).resolves.toBe(0);
    });
  });

  describe('Relative to values', () => {
    test('Value cursor, >', async () => {
      await database.read(['rows'], async (trx) => {
        let pos = 3;
        for await (const cursor of trx.selectFrom('rows').where('name', '>', 'Inara').cursor()) {
          const [value, key] = sorted.at(pos) ?? [];
          expect(cursor.key).toBe(value?.name);
          expect(cursor.primaryKey).toBe(key);
          expect(cursor.value).toStrictEqual(value);

          pos += 1;
        }
        expect(pos).toBe(9);
        for await (const cursor of trx.selectFrom('rows').where('name', '>', 'Inara').cursor('prev')) {
          pos -= 1;

          const [value, key] = sorted.at(pos) ?? [];
          expect(cursor.key).toBe(value?.name);
          expect(cursor.primaryKey).toBe(key);
          expect(cursor.value).toStrictEqual(value);
        }
        expect(pos).toBe(3);
      });
    });

    test('Key cursor, >=', async () => {
      await database.read(['rows'], async (trx) => {
        let pos = 2;
        for await (const cursor of trx.selectFrom('rows').where('name', '>=', 'Inara').keyCursor()) {
          const [value, key] = sorted.at(pos) ?? [];
          expect(cursor.key).toBe(value?.name);
          expect(cursor.primaryKey).toBe(key);

          pos += 1;
        }
        expect(pos).toBe(9);
        for await (const cursor of trx.selectFrom('rows').where('name', '>=', 'Inara').keyCursor('prev')) {
          pos -= 1;

          const [value, key] = sorted.at(pos) ?? [];
          expect(cursor.key).toBe(value?.name);
          expect(cursor.primaryKey).toBe(key);
        }
        expect(pos).toBe(2);
      });
    });

    test('Value stream, <', async () => {
      await database.read(['rows'], async (trx) => {
        let pos = 0;
        for await (const row of trx.selectFrom('rows').where('name', '<', 'River').stream()) {
          const [value] = sorted.at(pos) ?? [];
          expect(row).toStrictEqual(value);

          pos += 1;
        }
        expect(pos).toBe(6);
        for await (const row of trx.selectFrom('rows').where('name', '<', 'River').stream('prev')) {
          pos -= 1;

          const [value] = sorted.at(pos) ?? [];
          expect(row).toStrictEqual(value);
        }
        expect(pos).toBe(0);
      });
    });

    test('Key stream, <=', async () => {
      await database.read(['rows'], async (trx) => {
        let pos = 0;
        for await (const key of trx.selectFrom('rows').where('name', '<=', 'River').streamKeys()) {
          const [value] = sorted.at(pos) ?? [];
          expect(key).toStrictEqual(value?.name);

          pos += 1;
        }
        expect(pos).toBe(7);
        for await (const key of trx.selectFrom('rows').where('name', '<=', 'River').streamKeys('prev')) {
          pos -= 1;

          const [value] = sorted.at(pos) ?? [];
          expect(key).toStrictEqual(value?.name);
        }
        expect(pos).toBe(0);
      });
    });
  });

  describe('Values in range', () => {
    test('Value cursor, []', async () => {
      await database.read(['rows'], async (trx) => {
        let pos = 2;
        for await (const cursor of trx.selectFrom('rows').where('name', '[]', 'Inara', 'River').cursor()) {
          const [value, key] = sorted.at(pos) ?? [];
          expect(cursor.key).toBe(value?.name);
          expect(cursor.primaryKey).toBe(key);
          expect(cursor.value).toStrictEqual(value);

          pos += 1;
        }
        expect(pos).toBe(7);
        for await (const cursor of trx.selectFrom('rows').where('name', '[]', 'Inara', 'River').cursor('prev')) {
          pos -= 1;

          const [value, key] = sorted.at(pos) ?? [];
          expect(cursor.key).toBe(value?.name);
          expect(cursor.primaryKey).toBe(key);
          expect(cursor.value).toStrictEqual(value);
        }
        expect(pos).toBe(2);
      });
    });

    test('Key cursor, [)', async () => {
      await database.read(['rows'], async (trx) => {
        let pos = 2;
        for await (const cursor of trx.selectFrom('rows').where('name', '[)', 'Inara', 'River').keyCursor()) {
          const [value, key] = sorted.at(pos) ?? [];
          expect(cursor.key).toBe(value?.name);
          expect(cursor.primaryKey).toBe(key);

          pos += 1;
        }
        expect(pos).toBe(6);
        for await (const cursor of trx.selectFrom('rows').where('name', '[)', 'Inara', 'River').keyCursor('prev')) {
          pos -= 1;

          const [value, key] = sorted.at(pos) ?? [];
          expect(cursor.key).toBe(value?.name);
          expect(cursor.primaryKey).toBe(key);
        }
        expect(pos).toBe(2);
      });
    });

    test('Value stream, (]', async () => {
      await database.read(['rows'], async (trx) => {
        let pos = 3;
        for await (const row of trx.selectFrom('rows').where('name', '(]', 'Inara', 'River').stream()) {
          const [value] = sorted.at(pos) ?? [];
          expect(row).toStrictEqual(value);

          pos += 1;
        }
        expect(pos).toBe(7);
        for await (const row of trx.selectFrom('rows').where('name', '(]', 'Inara', 'River').stream('prev')) {
          pos -= 1;

          const [value] = sorted.at(pos) ?? [];
          expect(row).toStrictEqual(value);
        }
        expect(pos).toBe(3);
      });
    });

    test('Key stream, ()', async () => {
      await database.read(['rows'], async (trx) => {
        let pos = 3;
        for await (const key of trx.selectFrom('rows').where('name', '()', 'Inara', 'River').streamKeys()) {
          const [value] = sorted.at(pos) ?? [];
          expect(key).toStrictEqual(value?.name);

          pos += 1;
        }
        expect(pos).toBe(6);
        for await (const key of trx.selectFrom('rows').where('name', '()', 'Inara', 'River').streamKeys('prev')) {
          pos -= 1;

          const [value] = sorted.at(pos) ?? [];
          expect(key).toStrictEqual(value?.name);
        }
        expect(pos).toBe(3);
      });
    });
  });

  test('Sorting with', async () => {
    let pos = 0;
    await database.read(['rows'], async (trx) => {
      for await (const cursor of trx.selectFrom('rows').by('name').cursor()) {
        const [value, key] = sorted.at(pos) ?? [];
        expect(cursor.key).toBe(value?.name);
        expect(cursor.primaryKey).toBe(key);
        expect(cursor.value).toStrictEqual(value);

        pos += 1;
      }
    });
  });

  test('Skipping by combined keys.', async () => {
    let pos = 0;
    await database.read(['rows'], async (trx) => {
      for await (const cursor of trx.selectFrom('rows').by('name').cursor()) {
        const [value, key] = sorted.at(pos) ?? [];
        expect(cursor.key).toBe(value?.name);
        expect(cursor.primaryKey).toBe(key);
        expect(cursor.value).toStrictEqual(value);

        pos += 3;
        const [next, nextKey] = sorted.at(pos) ?? [];

        if (!next?.name) break;

        cursor.continue(next.name, nextKey);
      }
    });
  });
});
