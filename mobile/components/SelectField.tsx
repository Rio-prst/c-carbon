import { Check } from 'lucide-react-native';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radii, spacing } from '../lib/theme';
import { Text } from './Text';

export type SelectOption = {
  value: string;
  label: string;
};

type Props = {
  label: string;
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  helper?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Compact single-select built from plain views so it works on every platform
 * without a native picker dependency.
 */
export function SelectField({
  label,
  options,
  value,
  onChange,
  placeholder = 'Pilih salah satu',
  error,
  helper,
  disabled = false,
  style,
}: Props) {
  const message = error ?? helper;

  return (
    <View style={style}>
      <Text variant="label" color={colors.neutral.ink700}>
        {label}
      </Text>
      <View style={styles.options}>
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.optionSelected,
                disabled && styles.optionDisabled,
                pressed && !disabled && styles.optionPressed,
              ]}
            >
              <Text
                variant="body"
                color={selected ? colors.brand.forest700 : colors.neutral.ink700}
              >
                {option.label}
              </Text>
              {selected ? (
                <Check size={16} strokeWidth={2.5} color={colors.brand.forest600} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
      {value == null && placeholder != null && options.length > 0 ? (
        <Text variant="caption" color={colors.neutral.ink500}>
          Belum dipilih
        </Text>
      ) : null}
      {message != null ? (
        <Text
          variant="caption"
          color={error != null ? colors.semantic.error : colors.neutral.ink500}
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 40,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.neutral.line,
    backgroundColor: colors.neutral.white,
  },
  optionSelected: {
    borderColor: colors.brand.forest600,
    borderWidth: 2,
    backgroundColor: colors.neutral.surface,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionPressed: {
    opacity: 0.85,
  },
});