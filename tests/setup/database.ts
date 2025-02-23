import { beforeAll, beforeEach } from 'vitest';

beforeAll(async (context) => {
  const { dropDatabase, listDatabases } = await import('../../src/database');

  const prefix = context.file.name;
  const databases = await listDatabases();
  await Promise.all(
    databases.map(async (database) => {
      if (database.startsWith(`${prefix}/`)) await dropDatabase(database);
      else if (database === prefix) await dropDatabase(database);
    }),
  );
});

beforeEach(async (context) => {
  const { dropDatabase, listDatabases } = await import('../../src/database');
  const { getSuitePath } = await import('../tools/utilities');

  const prefix = getSuitePath(context);
  const databases = await listDatabases();
  await Promise.all(
    databases.map(async (database) => {
      if (database.startsWith(`${prefix}/`)) await dropDatabase(database);
      else if (database === prefix) await dropDatabase(database);
    }),
  );
});
