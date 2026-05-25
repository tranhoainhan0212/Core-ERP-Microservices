import { useCallback } from 'react';
import { API_URL } from '../services/api/config';
import type { AuthResponse } from '../types/app';

interface UseApiClientOptions {
  token: string | null;
  refreshToken: string | null;
  persistSession: (data: AuthResponse) => void;
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

export function useApiClient({ token, refreshToken, persistSession, addToast }: UseApiClientOptions) {
  const tryRefreshToken = useCallback(async (): Promise<boolean> => {
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return false;

      const data: AuthResponse = await res.json();
      persistSession(data);
      return true;
    } catch {
      return false;
    }
  }, [refreshToken, persistSession]);

  const apiFetch = useCallback(async <T>(path: string, options: RequestInit = {}, allowRetry = true): Promise<T> => {
    const headers = new Headers(options.headers ?? {});

    if (!(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const res = await fetch(`${API_URL}${path}`, { ...options, headers });

    if (res.status === 401 && allowRetry) {
      const ok = await tryRefreshToken();
      if (ok) return apiFetch(path, options, false);
    }

    if (!res.ok) {
      let msg = `Yeu cau that bai (${res.status})`;

      try {
        const body = await res.json();
        msg = body.message || body.title || msg;
      } catch {
        // Ignore JSON parse error and keep fallback message.
      }

      if (res.status === 409 && path.includes('/auth/register')) {
        msg = 'Tai khoan email nay da duoc dang ky. Vui long dang nhap.';
      }
      if (res.status === 401) {
        msg = 'Sai email hoac mat khau. Vui long thu lai.';
      }
      if (res.status === 400 && msg.includes('length')) {
        msg = 'Mat khau phai dai it nhat 8 ky tu.';
      }

      throw new Error(msg);
    }

    if (res.status === 204) return null as T;
    return res.json() as Promise<T>;
  }, [token, tryRefreshToken]);

  const completeGoogleLogin = useCallback(async (code: string, state: string) => {
    try {
      addToast('Dang xu ly dang nhap Google...', 'info');
      console.log('[Google Login] Exchanging code for token...');
      const res = await fetch(`${API_URL}/auth/oauth2/google/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`);

      console.log('[Google Login] Response status:', res.status);

      if (!res.ok) {
        const body = await res.json();
        console.error('[Google Login] Error response:', body);
        throw new Error(body.message || 'Google login failed.');
      }

      const data: AuthResponse = await res.json();
      console.log('[Google Login] Token received, user:', data.user.email);
      persistSession(data);
      addToast(`Xin chao ${data.user.fullName}, dang nhap Google thanh cong!`, 'success');
    } catch (error) {
      console.error('[Google Login] Error:', error);
      addToast((error as Error).message, 'error');
    }
  }, [addToast, persistSession]);

  const startGoogleOAuth2 = useCallback(async () => {
    try {
      const data = await fetch(`${API_URL}/auth/oauth2/google/authorize`).then((res) => res.json());

      if (!data.authorizeUrl) {
        throw new Error(data.message || 'Google OAuth2 chua duoc cau hinh.');
      }

      // Open Google authorization in a popup window instead of full-page redirect
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        data.authorizeUrl,
        'GoogleOAuth',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );

      // Store popup reference for cross-origin polling in AuthModal
      if (popup) {
        (window as unknown as { __oauthPopup?: Window }).__oauthPopup = popup;
      }
    } catch (error) {
      addToast((error as Error).message, 'error');
    }
  }, [addToast]);

  return {
    apiFetch,
    completeGoogleLogin,
    startGoogleOAuth2,
  };
}
