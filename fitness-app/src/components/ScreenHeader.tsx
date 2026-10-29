import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { Text } from './Text';

interface ScreenHeaderProps {
  title: string;
  /** Small accent line above the title. */
  eyebrow?: string;
  subtitle?: string;
}

export function ScreenHeader({ title, eyebrow, subtitle }: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      {eyebrow ? (
        <Text variant="label" tone="accent">
          {eyebrow}
        </Text>
      ) : null}
      <Text variant="h1" accessibilityRole="header">
        {title}
      </Text>
      {subtitle ? <Text tone="muted">{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
});
