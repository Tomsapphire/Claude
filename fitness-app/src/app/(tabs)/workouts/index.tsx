import { EmptyState, Screen, ScreenHeader } from '@/components';

export default function WorkoutsScreen() {
  return (
    <Screen>
      <ScreenHeader title="Workouts" />
      <EmptyState
        icon="barbell-outline"
        title="No workouts yet"
        message="Programs and your own custom workouts arrive in Milestone 4. The workout player comes first, in Milestone 3."
      />
    </Screen>
  );
}
