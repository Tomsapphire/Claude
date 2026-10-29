/**
 * Core domain types. Pure TypeScript: nothing in `src/domain` may import React, Expo or the database.
 */

export type Level = 'beginner' | 'intermediate' | 'advanced';

export type Muscle =
  | 'chest'
  | 'shoulders'
  | 'triceps'
  | 'biceps'
  | 'back'
  | 'core'
  | 'obliques'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves';

/** Equipment beyond the floor. An exercise with an empty list needs nothing at all. */
export type Equipment = 'chair' | 'pull-up-bar';

/** Whether a set is counted in reps or held/performed for a duration. */
export type Measure = 'reps' | 'time';

/** Movement pattern, used for filtering and for building balanced plans. */
export type Category = 'push' | 'pull' | 'legs' | 'core' | 'conditioning';

export type FamilyId =
  | 'push-up'
  | 'squat'
  | 'lunge'
  | 'plank'
  | 'burpee'
  | 'mountain-climber'
  | 'glute-bridge'
  | 'dip'
  | 'pull-up';

/** A group of variations of one movement, ordered from easiest to hardest by `Exercise.rank`. */
export interface ExerciseFamily {
  id: FamilyId;
  name: string;
  category: Category;
}

export interface Exercise {
  /** Stable slug, e.g. `push-up-diamond`. Stored in workout history, so never rename one. */
  id: string;
  name: string;
  family: FamilyId;
  /**
   * Position on the family's progression ladder, starting at 1 (easiest).
   * Exercises with the same rank are alternatives at the same difficulty.
   */
  rank: number;
  measure: Measure;
  /** Target applies to each side (each leg, each arm), e.g. "10 each leg". */
  perSide: boolean;
  difficulty: Level;
  primaryMuscles: Muscle[];
  secondaryMuscles: Muscle[];
  equipment: Equipment[];
  instructions: string[];
  commonMistakes: string[];
}

export type Units = 'metric' | 'imperial';

export interface Settings {
  units: Units;
  /** Default rest between sets for new workouts, in seconds. */
  defaultRestSeconds: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  units: 'metric',
  defaultRestSeconds: 60,
  soundEnabled: true,
  vibrationEnabled: true,
};
