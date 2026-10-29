import { DEFAULT_SETTINGS } from '@/domain/types';
import { createTestDb, describeWithSqlite } from '@/test-utils/nodeSqliteDb';

import { prepareDatabase } from '../migrate';
import { createSqliteSettingsRepository } from '../repositories/sqlite/settingsRepository';

describeWithSqlite('SQLite settings repository', () => {
  it('returns the defaults on a fresh install', async () => {
    const db = createTestDb();
    await prepareDatabase(db);

    await expect(createSqliteSettingsRepository(db).get()).resolves.toEqual(DEFAULT_SETTINGS);
    db.close();
  });

  it('saves and reloads every field', async () => {
    const db = createTestDb();
    await prepareDatabase(db);
    const repository = createSqliteSettingsRepository(db);
    const changed = {
      units: 'imperial' as const,
      defaultRestSeconds: 90,
      soundEnabled: false,
      vibrationEnabled: false,
    };

    await repository.save(changed);

    await expect(repository.get()).resolves.toEqual(changed);
    db.close();
  });

  it('records when settings were last changed', async () => {
    const db = createTestDb();
    await prepareDatabase(db);
    const repository = createSqliteSettingsRepository(db, () => new Date('2026-01-02T03:04:05Z'));

    await repository.save({ ...DEFAULT_SETTINGS, soundEnabled: false });

    const row = await db.getFirstAsync<{ updated_at: string }>(
      'SELECT updated_at FROM settings WHERE id = 1',
    );
    expect(row?.updated_at).toBe('2026-01-02T03:04:05.000Z');
    db.close();
  });

  it('lets the schema reject out-of-range values', async () => {
    const db = createTestDb();
    await prepareDatabase(db);

    await expect(
      createSqliteSettingsRepository(db).save({ ...DEFAULT_SETTINGS, defaultRestSeconds: 5 }),
    ).rejects.toThrow();
    db.close();
  });
});
