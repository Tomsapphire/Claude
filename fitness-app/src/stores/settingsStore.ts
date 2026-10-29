import { create } from 'zustand';

import { getRepositories } from '@/db/repositories';
import { DEFAULT_SETTINGS, type Settings } from '@/domain/types';

interface SettingsState {
  settings: Settings;
  /** Loads saved settings. Called once at boot. */
  hydrate(): Promise<void>;
  /** Applies the change immediately, then saves it. Reverts and rethrows if saving fails. */
  update(patch: Partial<Settings>): Promise<void>;
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  settings: DEFAULT_SETTINGS,

  async hydrate() {
    const settings = await getRepositories().settings.get();
    set({ settings });
  },

  async update(patch) {
    const previous = get().settings;
    const next = { ...previous, ...patch };
    set({ settings: next });
    try {
      await getRepositories().settings.save(next);
    } catch (error) {
      set({ settings: previous });
      throw error;
    }
  },
}));
