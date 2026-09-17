import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, spacing } from '../lib/theme';
import { Button } from './Button';
import { Text } from './Text';

type Props = {
  message: string;
  onRetry?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function ErrorState({ message, onRetry, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <Text variant="body" color={colors.neutral.ink700}>
        {message}
      </Text>
      {onRetry != null ? (
        <Button label="Coba Lagi" variant="secondary" onPress={onRetry} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
  },
});