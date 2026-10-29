import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { Text } from '@/components';
import { colors, spacing } from '@/theme';

interface SwitchRowProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}

/** A settings row where the whole row toggles, not just the small switch. */
export function SwitchRow({ label, description, value, onValueChange }: SwitchRowProps) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ checked: value }}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.text}>
        <Text variant="title">{label}</Text>
        {description ? (
          <Text variant="bodySmall" tone="muted">
            {description}
          </Text>
        ) : null}
      </View>
      <View pointerEvents="none" importantForAccessibility="no-hide-descendants">
        <Switch
          value={value}
          trackColor={{ false: colors.borderStrong, true: colors.accent }}
          thumbColor={colors.text}
          ios_backgroundColor={colors.borderStrong}
          accessibilityElementsHidden
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    flex: 1,
    gap: 2,
  },
});
