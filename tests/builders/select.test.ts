import { beforeEach, describe, expect, test } from 'vitest';
import { defineDatabase } from '../../src';
import { getSuitePath } from '../tools/utilities';
import type { DatabaseFactory, Store } from '../../src';

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

  type Database = {
    rows: Store<Row>;
  };

  let useDatabase: DatabaseFactory<Database>;
  let records: [row: Row, id: number][];

  beforeEach(async () => {
    useDatabase = defineDatabase<Database>({
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

    const database = useDatabase();
    await database.change(['rows'], async (trx) => {
      const builder = trx.update('rows');
      for (const [row, id] of records) {
        await builder.add(row, id);
      }
    });
  });

  describe('Cursors', () => {
    test('Value cursor', async () => {
      const database = useDatabase();
      await database.read(['rows'], async (trx) => {
        let pos = 0;
        for await (const cursor of trx.selectFrom('rows').cursor()) {
          expect(cursor.key).toBe(records.at(pos)?.[1]);
          expect(cursor.primaryKey).toBe(records.at(pos)?.[1]);
          expect(cursor.value).toStrictEqual(records.at(pos)?.[0]);

          pos += 1;
        }
        for await (const cursor of trx.selectFrom('rows').cursor('prev')) {
          pos -= 1;

          expect(cursor.key).toBe(records.at(pos)?.[1]);
          expect(cursor.primaryKey).toBe(records.at(pos)?.[1]);
          expect(cursor.value).toStrictEqual(records.at(pos)?.[0]);
        }
      });
    });
    test('Key cursor', async () => {
      const database = useDatabase();
      await database.read(['rows'], async (trx) => {
        let pos = 0;
        for await (const cursor of trx.selectFrom('rows').keyCursor()) {
          expect(cursor.key).toBe(records.at(pos)?.[1]);
          expect(cursor.primaryKey).toBe(records.at(pos)?.[1]);

          pos += 1;
        }
        for await (const cursor of trx.selectFrom('rows').keyCursor('prev')) {
          pos -= 1;

          expect(cursor.key).toBe(records.at(pos)?.[1]);
          expect(cursor.primaryKey).toBe(records.at(pos)?.[1]);
        }
      });
    });
    test('Value stream', async () => {
      const database = useDatabase();
      await database.read(['rows'], async (trx) => {
        let pos = 0;
        for await (const row of trx.selectFrom('rows').stream()) {
          expect(row).toStrictEqual(records.at(pos)?.[0]);

          pos += 1;
        }
        for await (const row of trx.selectFrom('rows').stream('prev')) {
          pos -= 1;

          expect(row).toStrictEqual(records.at(pos)?.[0]);
        }
      });
    });
    test('Key stream', async () => {
      const database = useDatabase();
      await database.read(['rows'], async (trx) => {
        let pos = 0;
        for await (const key of trx.selectFrom('rows').streamKeys()) {
          expect(key).toStrictEqual(records.at(pos)?.[1]);

          pos += 1;
        }
        for await (const key of trx.selectFrom('rows').streamKeys('prev')) {
          pos -= 1;

          expect(key).toStrictEqual(records.at(pos)?.[1]);
        }
      });
    });
    test('Primary key stream', async () => {
      const database = useDatabase();
      await database.read(['rows'], async (trx) => {
        let pos = 0;
        for await (const key of trx.selectFrom('rows').streamPrimaryKeys()) {
          expect(key).toStrictEqual(records.at(pos)?.[1]);

          pos += 1;
        }
        for await (const key of trx.selectFrom('rows').streamPrimaryKeys('prev')) {
          pos -= 1;

          expect(key).toStrictEqual(records.at(pos)?.[1]);
        }
      });
    });
    test('Advancing cursor', async () => {
      const database = useDatabase();
      await database.read(['rows'], async (trx) => {
        let pos = 0;
        for await (const cursor of trx.selectFrom('rows').cursor()) {
          expect(cursor.key).toBe(records.at(pos)?.[1]);
          expect(cursor.primaryKey).toBe(records.at(pos)?.[1]);
          expect(cursor.value).toStrictEqual(records.at(pos)?.[0]);

          cursor.advance(2);
          pos += 2;
        }
      });
    });
    test('Continuing cursor', async () => {
      const database = useDatabase();
      await database.read(['rows'], async (trx) => {
        let pos = 0;
        for await (const cursor of trx.selectFrom('rows').cursor()) {
          expect(cursor.key).toBe(records.at(pos)?.[1]);
          expect(cursor.primaryKey).toBe(records.at(pos)?.[1]);
          expect(cursor.value).toStrictEqual(records.at(pos)?.[0]);

          cursor.continue(pos + 3);
          pos += 2;
        }
      });
    });
  });
  describe.todo('Retrieval');
  describe.todo('Update');
  describe.todo('Delete');
});

describe('Key lookup operations', () => {
  describe('Manual key', () => {
    describe.todo('Direct keys');
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
    describe.todo('Direct keys');
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
    describe.todo('Direct keys');
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
  describe.todo('Direct values');
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
