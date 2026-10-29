import { EmptyState, Screen, ScreenHeader } from '@/components';
import { EXERCISES, FAMILIES } from '@/content/exercises';

export default function ExercisesScreen() {
  return (
    <Screen>
      <ScreenHeader title="Exercises" />
      <EmptyState
        icon="body-outline"
        title={`${EXERCISES.length} exercises loaded`}
        message={`${FAMILIES.length} movement families, each with easier and harder variations. The library screens arrive in Milestone 2.`}
      />
    </Screen>
  );
}
