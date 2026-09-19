import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input, Text } from '../../components';
import { ApiClientError } from '../../lib/api';
import { colors, screen as screenTokens, spacing } from '../../lib/theme';
import { useAuth } from '../../store/auth';

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  form?: string;
};

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const next: FieldErrors = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      next.name = 'Name is required';
    }
    if (!trimmedEmail) {
      next.email = 'Email is required';
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      next.email = 'Enter a valid email';
    }
    if (!password) {
      next.password = 'Password is required';
    } else if (password.length < 8) {
      next.password = 'Password must be at least 8 characters';
    }

    setErrors(next);
    if (next.name || next.email || next.password) {
      return;
    }

    setSubmitting(true);
    try {
      await signUp({
        name: trimmedName,
        email: trimmedEmail,
        password,
      });
      router.replace('/');
    } catch (error) {
      setErrors({
        form:
          error instanceof ApiClientError
            ? error.message
            : 'Something went wrong. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: Math.max(insets.top, screenTokens.padding) },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text variant="h1" color={colors.brand.forest700}>
            C-Carbon
          </Text>
          <Text variant="body" color={colors.neutral.ink500}>
            Create a farmer account to get started.
          </Text>
        </View>

        {errors.form ? (
          <Text variant="caption" color={colors.semantic.error}>
            {errors.form}
          </Text>
        ) : null}

        <Input
          label="Name"
          value={name}
          onChangeText={setName}
          error={errors.name}
          autoCapitalize="words"
          placeholder="Your full name"
          editable={!submitting}
        />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="you@example.com"
          editable={!submitting}
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          secureTextEntry
          autoCapitalize="none"
          placeholder="At least 8 characters"
          editable={!submitting}
        />

        <Button
          label="Create account"
          onPress={() => void handleSubmit()}
          loading={submitting}
          disabled={submitting}
          style={styles.submit}
        />

        <View style={styles.footer}>
          <Text variant="body" color={colors.neutral.ink500}>
            Already have an account?{' '}
          </Text>
          <Link href="/login" replace>
            <Text variant="bodyMedium" color={colors.brand.forest600}>
              Sign in
            </Text>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.neutral.surface,
  },
  container: {
    flexGrow: 1,
    padding: screenTokens.padding,
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  submit: {
    marginTop: spacing.xxl,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
});