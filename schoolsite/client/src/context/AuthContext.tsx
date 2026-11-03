import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { api, setTokenResolver } from '../lib/api';
import type { AdminUser, AppConfig } from '../types';
interface AuthValue {
  config: AppConfig | null;
  user: AdminUser | null;
  ready: boolean;
  error: string;
  login: (email: string, password: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}
const AuthContext = createContext<AuthValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig | null>(null),
    [user, setUser] = useState<AdminUser | null>(null);
  const [ready, setReady] = useState(false),
    [error, setError] = useState('');
  const client = useRef<SupabaseClient | null>(null),
    token = useRef<string | null>(null),
    revision = useRef(0);
  useEffect(() => {
    let active = true;
    let subscription: { unsubscribe: () => void } | undefined;
    const loadProfile = async (accessToken: string | null) => {
      const current = ++revision.current;
      if (!accessToken) {
        setUser(null);
        return;
      }
      try {
        const profile = await api.get<AdminUser>('/admin/auth/me');
        if (active && current === revision.current) setUser(profile);
      } catch (e) {
        if (active && current === revision.current) {
          setUser(null);
          setError(e instanceof Error ? e.message : 'Could not verify administrator access.');
        }
      }
    };
    setTokenResolver(() => token.current);
    api
      .get<AppConfig>('/config')
      .then(async (value) => {
        if (!active) return;
        setConfig(value);
        if (value.auth.provider === 'demo') {
          token.current = sessionStorage.getItem('schoolsite-demo-token');
          await loadProfile(token.current);
        } else {
          const { createClient } = await import('@supabase/supabase-js');
          client.current = createClient(value.auth.url!, value.auth.publishableKey!, {
            auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
          });
          const { data } = await client.current.auth.getSession();
          token.current = data.session?.access_token || null;
          await loadProfile(token.current);
          const { data: listener } = client.current.auth.onAuthStateChange((_event, session) => {
            token.current = session?.access_token || null;
            // Defer API work: Supabase recommends not awaiting its client inside this callback.
            setTimeout(() => {
              if (active) void loadProfile(token.current);
            }, 0);
          });
          subscription = listener.subscription;
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);
  const login = async (email: string, password: string) => {
    if (!client.current) throw new Error('Sign-in is not ready. Please refresh and try again.');
    const { error } = await client.current.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    setError('');
    const profile = await api.get<AdminUser>('/admin/auth/me');
    setUser(profile);
  };
  const loginDemo = async () => {
    const result = await api.post<{ token: string; user: AdminUser }>('/admin/auth/demo');
    token.current = result.token;
    sessionStorage.setItem('schoolsite-demo-token', result.token);
    setUser(result.user);
    setError('');
  };
  const logout = async () => {
    try {
      await api.post('/admin/auth/logout');
    } finally {
      if (client.current) await client.current.auth.signOut();
      token.current = null;
      sessionStorage.removeItem('schoolsite-demo-token');
      setUser(null);
    }
  };
  const resetPassword = async (email: string) => {
    if (!client.current)
      throw new Error('Password recovery is available after connecting Supabase.');
    const { error } = await client.current.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    if (error) throw new Error(error.message);
  };
  const updatePassword = async (password: string) => {
    if (!client.current) throw new Error('Open the password recovery link from your email first.');
    const { error } = await client.current.auth.updateUser({ password });
    if (error) throw new Error(error.message);
  };
  return (
    <AuthContext.Provider
      value={{
        config,
        user,
        ready,
        error,
        login,
        loginDemo,
        logout,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('AuthProvider is missing');
  return value;
}
