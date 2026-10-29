import { setRepositories, type SettingsRepository } from '@/db/repositories';
import { DEFAULT_SETTINGS, type Settings } from '@/domain/types';

import { useSettingsStore } from '../settingsStore';

function fakeRepository(initial: Settings = DEFAULT_SETTINGS) {
  let stored = { ...initial };
  const repository: SettingsRepository & { stored: () => Settings } = {
    get: jest.fn(async () => ({ ...stored })),
    save: jest.fn(async (settings: Settings) => {
      stored = { ...settings };
    }),
    stored: () => stored,
  };
  return repository;
}

beforeEach(() => {
  useSettingsStore.setState({ settings: DEFAULT_SETTINGS });
});

describe('settings store', () => {
  it('hydrates from the repository', async () => {
    setRepositories({ settings: fakeRepository({ ...DEFAULT_SETTINGS, soundEnabled: false }) });

    await useSettingsStore.getState().hydrate();

    expect(useSettingsStore.getState().settings.soundEnabled).toBe(false);
  });

  it('applies and saves an update', async () => {
    const repository = fakeRepository();
    setRepositories({ settings: repository });

    await useSettingsStore.getState().update({ vibrationEnabled: false });

    expect(useSettingsStore.getState().settings.vibrationEnabled).toBe(false);
    expect(repository.stored().vibrationEnabled).toBe(false);
  });

  it('reverts the change when saving fails', async () => {
    const repository = fakeRepository();
    repository.save = jest.fn(async () => {
      throw new Error('disk full');
    });
    setRepositories({ settings: repository });

    await expect(useSettingsStore.getState().update({ soundEnabled: false })).rejects.toThrow(
      'disk full',
    );
    expect(useSettingsStore.getState().settings.soundEnabled).toBe(true);
  });
});
