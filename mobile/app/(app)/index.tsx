import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Award, MapPin } from 'lucide-react-native';
import { Button, Card, Screen, Text } from '../../components';
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

        <View style={styles.actions}>
          <Pressable onPress={() => router.push('/farms')}>
            <Card style={styles.actionCard}>
              <MapPin size={20} color={colors.brand.forest600} />
              <View style={styles.actionText}>
                <Text variant="bodyMedium" color={colors.neutral.ink900}>
                  Lahan Saya
                </Text>
                <Text variant="caption" color={colors.neutral.ink500}>
                  Kelola lahan terdaftar
                </Text>
              </View>
            </Card>
          </Pressable>

          <Pressable onPress={() => router.push('/rewards')}>
            <Card style={styles.actionCard}>
              <Award size={20} color={colors.brand.forest600} />
              <View style={styles.actionText}>
                <Text variant="bodyMedium" color={colors.neutral.ink900}>
                  Hadiah
                </Text>
                <Text variant="caption" color={colors.neutral.ink500}>
                  Poin dan tingkat Anda
                </Text>
              </View>
            </Card>
          </Pressable>
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
  actions: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionText: {
    flex: 1,
    gap: spacing.xs,
  },
  logout: {
    marginTop: spacing.xxl,
  },
});