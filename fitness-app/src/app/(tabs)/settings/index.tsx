import Constants from 'expo-constants';
import { Alert, StyleSheet, View } from 'react-native';

import { Card, Screen, ScreenHeader, Text } from '@/components';
import type { Settings } from '@/domain/types';
import { SwitchRow } from '@/features/settings/SwitchRow';
import { useSettingsStore } from '@/stores/settingsStore';
import { colors, spacing } from '@/theme';

export default function SettingsScreen() {
  const settings = useSettingsStore((state) => state.settings);
  const update = useSettingsStore((state) => state.update);

  const change = (patch: Partial<Settings>) => {
    update(patch).catch(() => {
      Alert.alert("Couldn't save that", 'Your change was not saved. Try again.');
    });
  };

  return (
    <Screen scroll>
      <ScreenHeader title="Settings" />

      <View style={styles.section}>
        <Text variant="label" tone="muted">
          Workout cues
        </Text>
        <Card style={styles.card}>
          <SwitchRow
            label="Sound"
            description="Beep when a timer ends"
            value={settings.soundEnabled}
            onValueChange={(soundEnabled) => change({ soundEnabled })}
          />
          <View style={styles.divider} />
          <SwitchRow
            label="Vibration"
            description="Buzz when a timer ends"
            value={settings.vibrationEnabled}
            onValueChange={(vibrationEnabled) => change({ vibrationEnabled })}
          />
        </Card>
      </View>

      <Text variant="caption" tone="faint" align="center">
        Forge {Constants.expoConfig?.version ?? ''}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  card: {
    paddingVertical: spacing.xs,
    gap: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
