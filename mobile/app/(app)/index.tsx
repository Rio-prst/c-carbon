import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  Award,
  Building2,
  ClipboardCheck,
  Leaf,
  MapPin,
  Sprout,
  UserRound,
} from 'lucide-react-native';
import { Button, Card, Screen, Text } from '../../components';
import { colors, spacing } from '../../lib/theme';
import { useAuth } from '../../store/auth';

export default function HomeScreen() {
  const { user, signOut } = useAuth();

  // Farmer-only endpoints. A corporate reader would get 403 from both, so these
  // cards are hidden rather than left as dead ends.
  const isFarmer = user?.role === 'FARMER';

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
          {isFarmer ? (
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
          ) : null}

          {isFarmer ? (
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
          ) : null}

          {isFarmer ? (
            <Pressable onPress={() => router.push('/carbon/projects')}>
              <Card style={styles.actionCard}>
                <Sprout size={20} color={colors.brand.forest600} />
                <View style={styles.actionText}>
                  <Text variant="bodyMedium" color={colors.neutral.ink900}>
                    Proyek Karbon
                  </Text>
                  <Text variant="caption" color={colors.neutral.ink500}>
                    Konteks proyek kandidat
                  </Text>
                </View>
              </Card>
            </Pressable>
          ) : null}
        </View>

        {user?.role === 'CORPORATE' ? (
          <Pressable
            onPress={() => router.push('/corporate')}
            style={styles.adminEntry}
          >
            <Card style={styles.actionCard}>
              <Building2 size={20} color={colors.brand.forest600} />
              <View style={styles.actionText}>
                <Text variant="bodyMedium" color={colors.neutral.ink900}>
                  Ringkasan Korporat
                </Text>
                <Text variant="caption" color={colors.neutral.ink500}>
                  Skala agregat proyek karbon
                </Text>
              </View>
            </Card>
          </Pressable>
        ) : null}

        {user?.role === 'ADMIN' ? (
          <>
            <Pressable
              onPress={() => router.push('/admin/review')}
              style={styles.adminEntry}
            >
              <Card style={styles.actionCard}>
                <ClipboardCheck size={20} color={colors.brand.forest600} />
                <View style={styles.actionText}>
                  <Text variant="bodyMedium" color={colors.neutral.ink900}>
                    Review Data
                  </Text>
                  <Text variant="caption" color={colors.neutral.ink500}>
                    Verifikasi kiriman petani
                  </Text>
                </View>
              </Card>
            </Pressable>

            <Pressable
              onPress={() => router.push('/admin/projects')}
              style={styles.adminEntry}
            >
              <Card style={styles.actionCard}>
                <Leaf size={20} color={colors.brand.forest600} />
                <View style={styles.actionText}>
                  <Text variant="bodyMedium" color={colors.neutral.ink900}>
                    Kelola Proyek
                  </Text>
                  <Text variant="caption" color={colors.neutral.ink500}>
                    Filter kelayakan dan agregasi
                  </Text>
                </View>
              </Card>
            </Pressable>
          </>
        ) : null}

        <Pressable onPress={() => router.push('/profile')}>
          <Card style={[styles.actionCard, styles.profileEntry]}>
            <UserRound size={20} color={colors.brand.forest600} />
            <View style={styles.actionText}>
              <Text variant="bodyMedium" color={colors.neutral.ink900}>
                Profil
              </Text>
              <Text variant="caption" color={colors.neutral.ink500}>
                Data akun dan persetujuan
              </Text>
            </View>
          </Card>
        </Pressable>

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
  adminEntry: {
    alignSelf: 'stretch',
    marginTop: spacing.sm,
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
  profileEntry: {
    marginTop: spacing.sm,
  },
});