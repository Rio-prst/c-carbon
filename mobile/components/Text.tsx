import { StyleProp, Text as RNText, TextProps, TextStyle } from 'react-native';
import { typography } from '../lib/theme';

type Props = TextProps & {
  variant?: keyof typeof typography;
  color?: string;
};

export function Text({ variant = 'body', color, style, ...rest }: Props) {
  return (
    <RNText
      style={[typography[variant], color !== undefined ? { color } : null, style]}
      {...rest}
    />
  );
}