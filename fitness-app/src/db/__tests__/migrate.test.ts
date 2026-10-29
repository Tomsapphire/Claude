import { createTestDb, describeWithSqlite } from '@/test-utils/nodeSqliteDb';

import { migrate, prepareDatabase } from '../migrate';
import { MIGRATIONS, type Migration } from '../migrations';
import type { Db } from '../types';

async function userVersion(db: Db): Promise<number> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
}

async function tableExists(db: Db, name: string): Promise<boolean> {
  const row = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    [name],
  );
  return row !== null;
}

const testMigrations: Migration[] = [
  { version: 1, name: 'one', sql: 'CREATE TABLE a (id INTEGER PRIMARY KEY);' },
  { version: 2, name: 'two', sql: 'CREATE TABLE b (id INTEGER PRIMARY KEY);' },
];

describe('migration list', () => {
  it('is numbered consecutively from 1', () => {
    expect(MIGRATIONS.map((m) => m.version)).toEqual(MIGRATIONS.map((_, i) => i + 1));
  });
});

describeWithSqlite('migrate', () => {
  it('applies the real migrations to a fresh database', async () => {
    const db = createTestDb();
    const result = await prepareDatabase(db);

    expect(result).toEqual({ from: 0, to: MIGRATIONS.length });
    expect(await userVersion(db)).toBe(MIGRATIONS.length);
    expect(await tableExists(db, 'settings')).toBe(true);
    db.close();
  });

  it('does nothing on a database that is already current', async () => {
    const db = createTestDb();
    await migrate(db, testMigrations);
    const result = await migrate(db, testMigrations);

    expect(result).toEqual({ from: 2, to: 2 });
    db.close();
  });

  it('applies only the migrations newer than the stored version', async () => {
    const db = createTestDb();
    await migrate(db, testMigrations.slice(0, 1));
    expect(await tableExists(db, 'b')).toBe(false);

    const result = await migrate(db, testMigrations);
    expect(result).toEqual({ from: 1, to: 2 });
    expect(await tableExists(db, 'b')).toBe(true);
    db.close();
  });

  it('rolls back a failing migration and keeps the last good version', async () => {
    const db = createTestDb();
    const broken: Migration[] = [
      ...testMigrations.slice(0, 1),
      { version: 2, name: 'broken', sql: 'CREATE TABLE c (id INTEGER); NOT VALID SQL;' },
    ];

    await expect(migrate(db, broken)).rejects.toThrow();
    expect(await userVersion(db)).toBe(1);
    expect(await tableExists(db, 'c')).toBe(false);
    db.close();
  });

  it('refuses a database written by a newer app version', async () => {
    const db = createTestDb();
    await migrate(db, testMigrations);

    await expect(migrate(db, testMigrations.slice(0, 1))).rejects.toThrow(/newer version/);
    db.close();
  });

  it('rejects a migration list with gaps', async () => {
    const db = createTestDb();
    const gappy: Migration[] = [testMigrations[0]!, { ...testMigrations[1]!, version: 3 }];

    await expect(migrate(db, gappy)).rejects.toThrow(/expected 2/);
    db.close();
  });
});
