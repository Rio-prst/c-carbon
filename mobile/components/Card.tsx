import { StyleProp, View, ViewProps, ViewStyle } from 'react-native';
import { card, colors, radii } from '../lib/theme';

type Props = Omit<ViewProps, 'style'> & {
  large?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Card({ large = false, style, ...rest }: Props) {
  return (
    <View
      style={[styles.base, large ? styles.large : null, style]}
      {...rest}
    />
  );
}

const styles = {
  base: {
    backgroundColor: colors.neutral.white,
    borderWidth: 1,
    borderColor: colors.neutral.line,
    borderRadius: radii.md,
    padding: card.padding,
  } as ViewStyle,
  large: {
    borderRadius: radii.lg,
    padding: card.paddingLarge,
  },
};