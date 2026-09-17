import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { colors, radii } from '../lib/theme';
import { Text } from './Text';

type StatusTone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

type Props = {
  label: string;
  tone?: StatusTone;
  icon?: LucideIcon;
};

const toneStyles: Record<
  StatusTone,
  { backgroundColor: string; color: string; showBorder?: boolean }
> = {
  success: { backgroundColor: colors.semantic.success, color: colors.neutral.white },
  warning: { backgroundColor: colors.semantic.warning, color: colors.neutral.white },
  error: { backgroundColor: colors.semantic.error, color: colors.neutral.white },
  info: { backgroundColor: colors.semantic.info, color: colors.neutral.white },
  neutral: {
    backgroundColor: colors.neutral.surface,
    color: colors.neutral.ink700,
    showBorder: true,
  },
};

export function StatusBadge({ label, tone = 'neutral', icon: Icon }: Props) {
  const { backgroundColor, color, showBorder } = toneStyles[tone];

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor,
          borderColor: showBorder ? colors.neutral.line : 'transparent',
        },
      ]}
    >
      {Icon ? <Icon size={14} strokeWidth={2} color={color} /> : null}
      <Text variant="label" color={color}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
});