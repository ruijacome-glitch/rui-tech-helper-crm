import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiFetch, ApiError } from './apiClient';

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'tecnico' | 'cliente';
};

type AuthState = {
  user: CurrentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<CurrentUser>('/api/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    await apiFetch('/api/login', { method: 'POST', body: { email, password } });
    const me = await apiFetch<CurrentUser>('/api/me');
    setUser(me);
  }

  async function logout() {
    await apiFetch('/api/logout', { method: 'POST' });
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function isInvalidCredentials(error: unknown): boolean {
  return error instanceof ApiError && error.status === 422;
}
