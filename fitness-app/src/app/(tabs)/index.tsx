import { EmptyState, Screen, ScreenHeader } from '@/components';

export default function HomeScreen() {
  return (
    <Screen>
      <ScreenHeader
        eyebrow="Forge"
        title="Train anywhere."
        subtitle="Bodyweight only. 10 to 30 minutes. No excuses."
      />
      <EmptyState
        icon="flame"
        title="Your plan lands here"
        message="Answer four quick questions and get a weekly plan built for your level, goal and schedule. Onboarding arrives in Milestone 5."
      />
    </Screen>
  );
}
