import {
  ScrollView,
  StyleProp,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, screen as screenTokens } from '../lib/theme';

type Props = Omit<ViewProps, 'style'> & {
  padded?: boolean;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Screen({
  padded = true,
  scroll = false,
  style,
  children,
  ...rest
}: Props) {
  const insets = useSafeAreaInsets();

  const contentStyle: StyleProp<ViewStyle> = [
    styles.base,
    {
      paddingTop: Math.max(insets.top, screenTokens.padding),
      paddingLeft: padded ? screenTokens.padding : 0,
      paddingRight: padded ? screenTokens.padding : 0,
      paddingBottom: Math.max(insets.bottom, screenTokens.padding),
    },
    style,
  ];

  if (scroll) {
    return (
      <ScrollView
        style={styles.scrollBase}
        contentContainerStyle={contentStyle}
        {...rest}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View style={contentStyle} {...rest}>
      {children}
    </View>
  );
}

const styles = {
  base: {
    flex: 1,
    backgroundColor: colors.neutral.surface,
  } as ViewStyle,
  scrollBase: {
    flex: 1,
    backgroundColor: colors.neutral.surface,
  } as ViewStyle,
};