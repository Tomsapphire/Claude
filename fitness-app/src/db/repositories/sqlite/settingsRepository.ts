import { DEFAULT_SETTINGS, type Settings } from '@/domain/types';

import type { Db } from '../../types';
import type { SettingsRepository } from '../types';

interface SettingsRow {
  units: string;
  default_rest_s: number;
  sound_on: number;
  vibration_on: number;
}

export function createSqliteSettingsRepository(
  db: Db,
  now: () => Date = () => new Date(),
): SettingsRepository {
  return {
    async get() {
      const row = await db.getFirstAsync<SettingsRow>(
        'SELECT units, default_rest_s, sound_on, vibration_on FROM settings WHERE id = 1',
      );
      return row ? fromRow(row) : { ...DEFAULT_SETTINGS };
    },

    async save(settings) {
      await db.runAsync(
        `INSERT INTO settings (id, units, default_rest_s, sound_on, vibration_on, updated_at)
         VALUES (1, ?, ?, ?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET
           units = excluded.units,
           default_rest_s = excluded.default_rest_s,
           sound_on = excluded.sound_on,
           vibration_on = excluded.vibration_on,
           updated_at = excluded.updated_at`,
        [
          settings.units,
          settings.defaultRestSeconds,
          settings.soundEnabled ? 1 : 0,
          settings.vibrationEnabled ? 1 : 0,
          now().toISOString(),
        ],
      );
    },
  };
}

function fromRow(row: SettingsRow): Settings {
  return {
    units: row.units === 'imperial' ? 'imperial' : 'metric',
    defaultRestSeconds: row.default_rest_s,
    soundEnabled: row.sound_on === 1,
    vibrationEnabled: row.vibration_on === 1,
  };
}
