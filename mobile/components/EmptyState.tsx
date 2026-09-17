import type { LucideIcon } from 'lucide-react-native';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, spacing } from '../lib/theme';
import { Button } from './Button';
import { Text } from './Text';

type Props = {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon;
  style?: StyleProp<ViewStyle>;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon,
  style,
}: Props) {
  return (
    <View style={[styles.container, style]}>
      {Icon ? (
        <Icon size={32} strokeWidth={1.5} color={colors.neutral.ink300} />
      ) : null}
      <Text variant="h3">{title}</Text>
      {description != null ? <Text variant="body">{description}</Text> : null}
      {actionLabel != null && onAction != null ? (
        <Button label={actionLabel} onPress={onAction} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
});