import type { Db, SqlValue } from '@/db/types';

interface NodeStatement {
  run(...params: SqlValue[]): unknown;
  get(...params: SqlValue[]): unknown;
  all(...params: SqlValue[]): unknown[];
}

interface NodeDatabaseSync {
  exec(sql: string): void;
  prepare(sql: string): NodeStatement;
  close(): void;
}

type DatabaseSyncConstructor = new (path: string) => NodeDatabaseSync;

function loadDatabaseSync(): DatabaseSyncConstructor | null {
  try {
    // node:sqlite ships with Node 22.5+. On older Node the SQL-backed tests are skipped.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require('node:sqlite') as { DatabaseSync: DatabaseSyncConstructor }).DatabaseSync;
  } catch {
    return null;
  }
}

const DatabaseSync = loadDatabaseSync();

export const hasNodeSqlite = DatabaseSync !== null;

/** `describe` that skips when node:sqlite is unavailable. */
export const describeWithSqlite = hasNodeSqlite ? describe : describe.skip;

/** A fresh in-memory SQLite database behind the app's `Db` interface. */
export function createTestDb(): Db & { close(): void } {
  if (!DatabaseSync) throw new Error('node:sqlite is not available on this Node version.');
  const database = new DatabaseSync(':memory:');

  return {
    async execAsync(sql) {
      database.exec(sql);
    },
    async runAsync(sql, params = []) {
      database.prepare(sql).run(...params);
    },
    async getFirstAsync<T>(sql: string, params: readonly SqlValue[] = []) {
      return (database.prepare(sql).get(...params) as T | undefined) ?? null;
    },
    async getAllAsync<T>(sql: string, params: readonly SqlValue[] = []) {
      return database.prepare(sql).all(...params) as T[];
    },
    async transaction(task) {
      database.exec('BEGIN');
      try {
        await task();
        database.exec('COMMIT');
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      }
    },
    close: () => database.close(),
  };
}
