import type { Db } from '../../types';
import type { Repositories } from '../types';
import { createSqliteSettingsRepository } from './settingsRepository';

export function createSqliteRepositories(db: Db): Repositories {
  return {
    settings: createSqliteSettingsRepository(db),
  };
}
