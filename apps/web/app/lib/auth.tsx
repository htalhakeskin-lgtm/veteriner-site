import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { api, setAccessToken } from './api';
import type { AuthUser } from './types';

interface AuthState {
  user: AuthUser | null;
  /** Ilk oturum kontrolu devam ediyor mu? Korumali sayfalar bunu bekler. */
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export interface RegisterInput {
  email: string;
  fullName: string;
  phone?: string;
  password: string;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Sayfa yenilendiginde access token kaybolur (bellekte tutuluyor).
   * httpOnly refresh cookie hala duruyorsa oturumu sessizce geri aliyoruz —
   * kullanici her yenilemede yeniden giris yapmak zorunda kalmasin.
   */
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const ok = await api.refresh();
      if (cancelled) return;

      if (ok) {
        try {
          const me = await api.get<AuthUser>('/auth/me');
          if (!cancelled) setUser(me);
        } catch {
          if (!cancelled) setUser(null);
        }
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<{ user: AuthUser; accessToken: string }>(
      '/auth/login',
      { email, password },
    );
    setAccessToken(res.accessToken);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const res = await api.post<{ user: AuthUser; accessToken: string }>(
      '/auth/register',
      input,
    );
    setAccessToken(res.accessToken);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      // Sunucu hata verse bile istemci tarafinda oturumu kapat:
      // kullanici "cikis yaptim" dedi, ekranda oyle gorunmeli.
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      setUser(await api.get<AuthUser>('/auth/me'));
    } catch {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, loading, login, register, logout, refreshUser }),
    [user, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth, AuthProvider icinde kullanilmali.');
  return ctx;
}
