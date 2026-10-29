import type { Settings } from '@/domain/types';

/**
 * Persistence contracts. Stores and screens depend only on these interfaces, never on SQL,
 * so a backend can later be added as another implementation or a sync layer beside SQLite.
 */

export interface SettingsRepository {
  get(): Promise<Settings>;
  save(settings: Settings): Promise<void>;
}

export interface Repositories {
  settings: SettingsRepository;
}
