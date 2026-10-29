import { getEasierVariations, getFamilyLadder, getHarderVariations } from '../catalog';
import { EXERCISES, FAMILIES } from '../exercises';

describe('exercise content', () => {
  it('has unique exercise ids in kebab-case', () => {
    const ids = EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('has unique family ids and every family has at least one exercise', () => {
    const familyIds = FAMILIES.map((f) => f.id);
    expect(new Set(familyIds).size).toBe(familyIds.length);
    for (const family of FAMILIES) {
      expect(EXERCISES.some((e) => e.family === family.id)).toBe(true);
    }
  });

  it('only references families that exist', () => {
    const familyIds = new Set(FAMILIES.map((f) => f.id));
    for (const exercise of EXERCISES) expect(familyIds).toContain(exercise.family);
  });

  it.each(FAMILIES.map((f) => [f.id]))('%s ladder starts at rank 1 with no gaps', (familyId) => {
    const ranks = [...new Set(getFamilyLadder(familyId).map((e) => e.rank))].sort((a, b) => a - b);
    expect(ranks).toEqual(ranks.map((_, i) => i + 1));
  });

  it.each(EXERCISES.map((e) => [e.id, e]))('%s has complete coaching content', (_id, exercise) => {
    expect(exercise.name.trim()).not.toBe('');
    expect(exercise.instructions.length).toBeGreaterThanOrEqual(3);
    expect(exercise.commonMistakes.length).toBeGreaterThanOrEqual(2);
    expect(exercise.primaryMuscles.length).toBeGreaterThan(0);
    for (const line of [...exercise.instructions, ...exercise.commonMistakes]) {
      expect(line.trim()).not.toBe('');
    }
    // A muscle is either primary or secondary, never both.
    for (const muscle of exercise.secondaryMuscles) {
      expect(exercise.primaryMuscles).not.toContain(muscle);
    }
  });

  it('includes every exercise from the brief', () => {
    const required = [
      'push-up-knee',
      'push-up',
      'push-up-diamond',
      'push-up-decline',
      'push-up-archer',
      'squat',
      'squat-jump',
      'bulgarian-split-squat',
      'lunge-forward',
      'lunge-reverse',
      'lunge-walking',
      'lunge-jump',
      'plank',
      'plank-side',
      'plank-shoulder-taps',
      'burpee',
      'mountain-climber',
      'glute-bridge',
      'chair-dip',
      'pull-up',
    ];
    const ids = new Set(EXERCISES.map((e) => e.id));
    for (const id of required) expect(ids).toContain(id);
  });

  it('flags pull-up variations as needing a bar', () => {
    for (const exercise of getFamilyLadder('pull-up')) {
      expect(exercise.equipment).toContain('pull-up-bar');
    }
  });
});

describe('variation ladder', () => {
  it('orders a family from easiest to hardest', () => {
    expect(getFamilyLadder('push-up').map((e) => e.id)).toEqual([
      'push-up-incline',
      'push-up-knee',
      'push-up',
      'push-up-decline',
      'push-up-diamond',
      'push-up-archer',
    ]);
  });

  it('finds easier and harder variations one step away', () => {
    expect(getEasierVariations('push-up').map((e) => e.id)).toEqual([
      'push-up-incline',
      'push-up-knee',
    ]);
    expect(getHarderVariations('push-up').map((e) => e.id)).toEqual([
      'push-up-decline',
      'push-up-diamond',
    ]);
  });

  it('returns nothing past either end of the ladder or for unknown ids', () => {
    expect(getEasierVariations('push-up-knee')).toEqual([]);
    expect(getHarderVariations('push-up-archer')).toEqual([]);
    expect(getHarderVariations('no-such-exercise')).toEqual([]);
  });
});
