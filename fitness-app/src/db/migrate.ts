import { MIGRATIONS, type Migration } from './migrations';
import type { Db } from './types';

export interface MigrationResult {
  from: number;
  to: number;
}

/** Connection settings plus any pending migrations. Run once per app launch. */
export async function prepareDatabase(db: Db): Promise<MigrationResult> {
  // WAL keeps reads fast while a workout is writing set logs. It can't be set inside a transaction.
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  return migrate(db);
}

/**
 * Applies every migration newer than the database's `user_version`, each in its own transaction,
 * so a failure leaves the database at the last good version.
 */
export async function migrate(
  db: Db,
  migrations: readonly Migration[] = MIGRATIONS,
): Promise<MigrationResult> {
  assertSequential(migrations);

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  const latest = migrations.at(-1)?.version ?? 0;

  if (current > latest) {
    throw new Error(
      `This data was saved by a newer version of the app (schema ${current}, this app supports ${latest}). Update the app to continue.`,
    );
  }

  for (const migration of migrations) {
    if (migration.version <= current) continue;
    await db.transaction(async () => {
      await db.execAsync(migration.sql);
      await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
  }

  return { from: current, to: latest };
}

function assertSequential(migrations: readonly Migration[]): void {
  migrations.forEach((migration, index) => {
    if (migration.version !== index + 1) {
      throw new Error(
        `Migration "${migration.name}" has version ${migration.version}, expected ${index + 1}.`,
      );
    }
  });
}
