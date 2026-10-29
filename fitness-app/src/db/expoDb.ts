import type { SQLiteDatabase } from 'expo-sqlite';

import type { Db, SqlValue } from './types';

/** Adapts an expo-sqlite connection to the app's `Db` interface. */
export function fromExpoSqlite(database: SQLiteDatabase): Db {
  return {
    execAsync: (sql) => database.execAsync(sql),
    runAsync: async (sql, params = []) => {
      await database.runAsync(sql, [...params]);
    },
    getFirstAsync: <T>(sql: string, params: readonly SqlValue[] = []) =>
      database.getFirstAsync<T>(sql, [...params]),
    getAllAsync: <T>(sql: string, params: readonly SqlValue[] = []) =>
      database.getAllAsync<T>(sql, [...params]),
    transaction: (task) => database.withTransactionAsync(task),
  };
}
