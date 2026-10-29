import type { Repositories } from './types';

export type * from './types';

let active: Repositories | null = null;

/** Called once at boot, after the database is open and migrated (or by tests with fakes). */
export function setRepositories(repositories: Repositories): void {
  active = repositories;
}

export function getRepositories(): Repositories {
  if (!active) {
    throw new Error('Repositories were used before the database finished initialising.');
  }
  return active;
}
