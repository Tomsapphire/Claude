export interface Migration {
  /** Consecutive from 1. Stored in SQLite's `PRAGMA user_version` once applied. */
  version: number;
  name: string;
  sql: string;
}

/**
 * Schema history. Append only: once a migration has shipped to a device, never edit it.
 * Change the schema by adding a new migration with the next version number.
 *
 * Conventions, so a sync backend can be added later without reshaping data:
 * - user-created rows get TEXT UUID primary keys generated on the device;
 * - editable rows carry `updated_at` (and `deleted_at` once rows can be deleted);
 * - timestamps are ISO-8601 UTC strings.
 */
export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    name: 'create_settings',
    sql: `
      CREATE TABLE settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        units TEXT NOT NULL DEFAULT 'metric' CHECK (units IN ('metric', 'imperial')),
        default_rest_s INTEGER NOT NULL DEFAULT 60 CHECK (default_rest_s BETWEEN 10 AND 600),
        sound_on INTEGER NOT NULL DEFAULT 1 CHECK (sound_on IN (0, 1)),
        vibration_on INTEGER NOT NULL DEFAULT 1 CHECK (vibration_on IN (0, 1)),
        updated_at TEXT NOT NULL
      );
      INSERT INTO settings (id, updated_at) VALUES (1, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
    `,
  },
];
