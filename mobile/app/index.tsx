import { StyleSheet, Text, View } from 'react-native';
import { colors, screen, spacing, typography } from '../lib/theme';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>C-Carbon</Text>
      <Text style={styles.subtitle}>Farm Risk & Carbon Platform</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral.surface,
    padding: screen.padding,
  },
  title: {
    ...typography.h1,
    color: colors.brand.forest700,
  },
  subtitle: {
    ...typography.body,
    color: colors.neutral.ink500,
    marginTop: spacing.sm,
  },
});