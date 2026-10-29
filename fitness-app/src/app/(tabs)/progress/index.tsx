import { EmptyState, Screen, ScreenHeader } from '@/components';

export default function ProgressScreen() {
  return (
    <Screen>
      <ScreenHeader title="Progress" />
      <EmptyState
        icon="stats-chart-outline"
        title="Nothing logged yet"
        message="Finish a workout and your history, personal records and streak show up here. Arrives in Milestone 6."
      />
    </Screen>
  );
}
