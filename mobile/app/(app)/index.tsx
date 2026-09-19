import { StyleSheet, View } from 'react-native';
import { Button, Screen, Text } from '../../components';
import { colors, spacing } from '../../lib/theme';
import { useAuth } from '../../store/auth';

export default function HomeScreen() {
  const { user, signOut } = useAuth();

  return (
    <Screen>
      <View style={styles.container}>
        <Text variant="h1" color={colors.brand.forest700}>
          C-Carbon
        </Text>
        <Text variant="body" color={colors.neutral.ink500}>
          Farm Risk & Carbon Platform
        </Text>
        <View style={styles.user}>
          <Text variant="bodyMedium" color={colors.neutral.ink700}>
            Welcome back, {user?.name ?? 'Farmer'}
          </Text>
        </View>
        <Button
          label="Log out"
          variant="secondary"
          onPress={() => void signOut()}
          style={styles.logout}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  user: {
    marginTop: spacing.lg,
  },
  logout: {
    marginTop: spacing.xxl,
  },
});