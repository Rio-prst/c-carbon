import {
  StyleProp,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { colors, radii, spacing } from '../lib/theme';
import { Text } from './Text';

type Props = TextInputProps & {
  label: string;
  error?: string;
  helper?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export function Input({
  label,
  error,
  helper,
  containerStyle,
  style,
  ...inputProps
}: Props) {
  const message = error ?? helper;

  return (
    <View style={containerStyle}>
      <Text variant="label" color={colors.neutral.ink700}>
        {label}
      </Text>
      <TextInput
        placeholderTextColor={colors.neutral.ink300}
        style={[
          styles.input,
          error !== undefined ? styles.inputError : null,
          style,
        ]}
        {...inputProps}
      />
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

const styles = {
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.neutral.line,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.neutral.white,
    color: colors.neutral.ink900,
    fontSize: 16,
    lineHeight: 24,
  },
  inputError: {
    borderColor: colors.semantic.error,
  },
};