import { useCallback, useState } from 'react';
import type { AuthResponse, UserProfile } from '../types/app';
import { clearSessionStorage, persistSessionToStorage, readSession } from '../services/sessionStorage';

export function useAuthSession() {
  const initial = readSession();

  const [token, setToken] = useState<string | null>(initial.token);
  const [refreshToken, setRefreshToken] = useState<string | null>(initial.refreshToken);
  const [user, setUser] = useState<UserProfile | null>(initial.user);

  const persistSession = useCallback((data: AuthResponse) => {
    persistSessionToStorage(data);
    setToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setUser(data.user);
  }, []);

  const clearSession = useCallback(() => {
    clearSessionStorage();
    setToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  return {
    token,
    refreshToken,
    user,
    setToken,
    setRefreshToken,
    setUser,
    persistSession,
    clearSession,
  };
}
