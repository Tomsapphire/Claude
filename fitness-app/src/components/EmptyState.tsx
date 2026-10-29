import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme';

import { Button } from './Button';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  message: string;
  action?: { label: string; onPress: () => void };
  tone?: 'accent' | 'danger';
}

/** Centred placeholder for empty lists, first-launch screens and recoverable errors. */
export function EmptyState({ icon, title, message, action, tone = 'accent' }: EmptyStateProps) {
  const iconColor = tone === 'danger' ? colors.danger : colors.accent;
  const iconBg = tone === 'danger' ? 'rgba(255, 69, 58, 0.14)' : colors.accentMuted;

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={36} color={iconColor} />
      </View>
      <Text variant="h2" align="center" accessibilityRole="header">
        {title}
      </Text>
      <Text tone="muted" align="center" style={styles.message}>
        {message}
      </Text>
      {action ? (
        <View style={styles.action}>
          <Button label={action.label} onPress={action.onPress} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    maxWidth: 320,
  },
  action: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
  },
});
