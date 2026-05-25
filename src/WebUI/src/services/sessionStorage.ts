import type { AuthResponse, UserProfile } from '../types/app';

const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

export interface SessionState {
  token: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
}

export function readSession(): SessionState {
  const token = localStorage.getItem(TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  const rawUser = localStorage.getItem(USER_KEY);

  let user: UserProfile | null = null;
  if (rawUser) {
    try {
      user = JSON.parse(rawUser) as UserProfile;
    } catch {
      user = null;
    }
  }

  return { token, refreshToken, user };
}

export function persistSessionToStorage(data: AuthResponse): void {
  localStorage.setItem(TOKEN_KEY, data.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

export function clearSessionStorage(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
