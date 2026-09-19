import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  fetchCurrentUser,
  login as loginRequest,
  register as registerRequest,
} from '../services/auth';
import type { AuthUser, LoginInput, RegisterInput } from '../types/auth';

const TOKEN_KEY = 'c-carbon.auth.token';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  status: AuthStatus;
  token: string | null;
  user: AuthUser | null;
  signIn: (input: LoginInput) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);

        if (!storedToken) {
          if (!cancelled) {
            setStatus('unauthenticated');
          }
          return;
        }

        const currentUser = await fetchCurrentUser(storedToken);

        if (!cancelled) {
          setToken(storedToken);
          setUser(currentUser);
          setStatus('authenticated');
        }
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_KEY);

        if (!cancelled) {
          setToken(null);
          setUser(null);
          setStatus('unauthenticated');
        }
      }
    }

    void restore();

    return () => {
      cancelled = true;
    };
  }, []);

  const applySession = useCallback(
    async (nextToken: string, nextUser: AuthUser) => {
      await SecureStore.setItemAsync(TOKEN_KEY, nextToken);
      setToken(nextToken);
      setUser(nextUser);
      setStatus('authenticated');
    },
    [],
  );

  const signIn = useCallback(
    async (input: LoginInput) => {
      const response = await loginRequest(input);
      await applySession(response.token, response.user);
    },
    [applySession],
  );

  const signUp = useCallback(
    async (input: RegisterInput) => {
      await registerRequest(input);
      const response = await loginRequest({
        email: input.email,
        password: input.password,
      });
      await applySession(response.token, response.user);
    },
    [applySession],
  );

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo(
    () => ({ status, token, user, signIn, signUp, signOut }),
    [status, token, user, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}