export type SqlValue = string | number | null;

/**
 * The slice of a SQLite connection the app uses. Repositories depend on this rather than on
 * expo-sqlite directly, so tests can run them against an in-memory database on Node.
 */
export interface Db {
  /** Runs one or more statements with no parameters. */
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, params?: readonly SqlValue[]): Promise<void>;
  getFirstAsync<T>(sql: string, params?: readonly SqlValue[]): Promise<T | null>;
  getAllAsync<T>(sql: string, params?: readonly SqlValue[]): Promise<T[]>;
  /** Runs `task` inside a transaction, rolling back if it throws. */
  transaction(task: () => Promise<void>): Promise<void>;
}
