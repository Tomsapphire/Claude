import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

export type IconName = ComponentProps<typeof Ionicons>['name'];

interface IconProps {
  name: IconName;
  size?: number;
  color: string;
}

/** Single icon set for the whole app, so swapping it later is a one-file change. */
export function Icon({ name, size = 24, color }: IconProps) {
  return <Ionicons name={name} size={size} color={color} accessibilityElementsHidden />;
}
