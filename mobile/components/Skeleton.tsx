import { StyleProp, View, ViewStyle } from 'react-native';
import { colors, radii } from '../lib/theme';

type Props = {
  width?: ViewStyle['width'];
  height?: ViewStyle['height'];
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = radii.sm,
  style,
}: Props) {
  return (
    <View
      style={[{ width, height, borderRadius, backgroundColor: colors.neutral.line }, style]}
    />
  );
}