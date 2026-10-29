import { BarlowCondensed_700Bold } from '@expo-google-fonts/barlow-condensed/700Bold';
import { BarlowCondensed_800ExtraBold } from '@expo-google-fonts/barlow-condensed/800ExtraBold';
import { loadAsync } from 'expo-font';
import { openDatabaseAsync } from 'expo-sqlite';

import { fromExpoSqlite } from '@/db/expoDb';
import { prepareDatabase } from '@/db/migrate';
import { setRepositories } from '@/db/repositories';
import { createSqliteRepositories } from '@/db/repositories/sqlite';
import type { Db } from '@/db/types';
import { useSettingsStore } from '@/stores/settingsStore';
import { fontFamilies } from '@/theme';

const DATABASE_NAME = 'forge.db';

let database: Db | null = null;

/**
 * Everything the app needs before the first screen renders. Safe to call again after a failure:
 * each step either reuses what already succeeded or retries.
 */
export async function bootApp(): Promise<void> {
  await Promise.all([loadFonts(), initData()]);
}

function loadFonts(): Promise<void> {
  return loadAsync({
    [fontFamilies.displayBold]: BarlowCondensed_700Bold,
    [fontFamilies.displayHeavy]: BarlowCondensed_800ExtraBold,
  });
}

async function initData(): Promise<void> {
  database ??= fromExpoSqlite(await openDatabaseAsync(DATABASE_NAME));
  await prepareDatabase(database);
  setRepositories(createSqliteRepositories(database));
  await useSettingsStore.getState().hydrate();
}
