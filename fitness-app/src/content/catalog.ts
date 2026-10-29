import type { Exercise, ExerciseFamily, FamilyId } from '@/domain/types';

import { EXERCISES, FAMILIES } from './exercises';

const exercisesById = new Map(EXERCISES.map((exercise) => [exercise.id, exercise]));
const familiesById = new Map(FAMILIES.map((family) => [family.id, family]));

export function getExercise(id: string): Exercise | undefined {
  return exercisesById.get(id);
}

export function getFamily(id: FamilyId): ExerciseFamily | undefined {
  return familiesById.get(id);
}

/** Every variation in a family, easiest first. Alternatives at the same rank are sorted by name. */
export function getFamilyLadder(familyId: FamilyId): Exercise[] {
  return EXERCISES.filter((exercise) => exercise.family === familyId).sort(
    (a, b) => a.rank - b.rank || a.name.localeCompare(b.name),
  );
}

/** Variations one step easier on the ladder. Empty if this is already the easiest. */
export function getEasierVariations(exerciseId: string): Exercise[] {
  return variationsAtOffset(exerciseId, -1);
}

/** Variations one step harder on the ladder. Empty if this is already the hardest. */
export function getHarderVariations(exerciseId: string): Exercise[] {
  return variationsAtOffset(exerciseId, 1);
}

function variationsAtOffset(exerciseId: string, offset: number): Exercise[] {
  const exercise = getExercise(exerciseId);
  if (!exercise) return [];
  return getFamilyLadder(exercise.family).filter((other) => other.rank === exercise.rank + offset);
}
