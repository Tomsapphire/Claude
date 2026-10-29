import { Stack } from 'expo-router';

import { tabStackScreenOptions } from '@/theme';

export default function TabStackLayout() {
  return <Stack screenOptions={tabStackScreenOptions} />;
}
