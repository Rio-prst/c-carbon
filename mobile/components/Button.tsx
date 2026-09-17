import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, radii, spacing } from '../lib/theme';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'destructive';

type Props = {
  label: string;
  variant?: ButtonVariant;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  style?: StyleProp<ViewStyle>;
};

const variantStyles: Record<
  ButtonVariant,
  { bg: string; fg: string; borderColor: string }
> = {
  primary: {
    bg: colors.brand.forest600,
    fg: colors.neutral.white,
    borderColor: colors.brand.forest600,
  },
  secondary: {
    bg: colors.neutral.white,
    fg: colors.neutral.ink700,
    borderColor: colors.neutral.line,
  },
  destructive: {
    bg: colors.semantic.error,
    fg: colors.neutral.white,
    borderColor: colors.semantic.error,
  },
};

export function Button({
  label,
  variant = 'primary',
  onPress,
  loading = false,
  disabled = false,
  icon: Icon,
  style,
}: Props) {
  const inactive = loading || disabled;
  const { bg, fg, borderColor } = variantStyles[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, borderColor },
        inactive && styles.inactive,
        pressed && !inactive && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {Icon ? <Icon size={20} strokeWidth={2} color={fg} /> : null}
          <Text variant="button" color={fg}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = {
  base: {
    minHeight: 48,
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  } as ViewStyle,
  inactive: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
  },
};