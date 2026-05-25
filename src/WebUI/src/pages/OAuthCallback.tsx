import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../services/api/config';
import type { AuthResponse } from '../types/app';
import { persistSessionToStorage } from '../services/sessionStorage';

/**
 * OAuth2 callback page.
 * 
 * Cross-origin strategy:
 * When Google redirects the popup to port 3000 (Docker) but the main window
 * is at port 5173 (Vite dev), the popup detects cross-origin and redirects
 * itself to port 5173 with the same code & state params. Now the popup is
 * at the same origin as the opener, so postMessage works perfectly.
 */

const DEV_ORIGINS = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'];

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const error = params.get('error');
        const redirectedFrom = params.get('_redirected');

        if (error) {
          throw new Error(`Google OAuth error: ${error}`);
        }

        if (!code || !state) {
          throw new Error('Missing authorization code or state from Google');
        }

        // Check if opener exists and determine origin relationship
        const hasOpener = !!(window.opener && !window.opener.closed);
        let openerOrigin: string | null = null;

        if (hasOpener) {
          try {
            // This will throw a DOMException if cross-origin
            openerOrigin = window.opener.location.origin;
          } catch {
            openerOrigin = null; // Cross-origin - we can't read it
          }
        }

        const isSameOrigin = openerOrigin === window.location.origin;

        // CASE 1: Same origin - use postMessage directly
        if (hasOpener && isSameOrigin) {
          console.log('[OAuth Callback] Same origin, using postMessage');
          window.opener.postMessage(
            { type: 'OAUTH_CALLBACK_SUCCESS', code, state, provider: 'google' },
            window.location.origin
          );
          setTimeout(() => window.close(), 500);
          return;
        }

        // CASE 2: Cross-origin popup - redirect to each known dev origin
        // until we find the one that matches the opener
        if (hasOpener && !isSameOrigin && !redirectedFrom) {
          console.log('[OAuth Callback] Cross-origin detected, redirecting popup...');
          
          // Try redirecting to other known dev origins
          const currentOrigin = window.location.origin;
          for (const origin of DEV_ORIGINS) {
            if (origin !== currentOrigin) {
              const redirectUrl = `${origin}/oauth2/google/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}&_redirected=true`;
              console.log('[OAuth Callback] Redirecting to:', origin);
              window.location.href = redirectUrl;
              return;
            }
          }
        }

        // CASE 3: Already redirected or no opener - do direct login
        console.log('[OAuth Callback] Performing direct login...');
        const res = await fetch(
          `${API_URL}/auth/oauth2/google/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`
        );

        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.message || 'Google login failed.');
        }

        const data: AuthResponse = await res.json();
        
        // Save session to localStorage (now we're at the correct origin!)
        persistSessionToStorage(data);
        
        setStatus('success');
        console.log('[OAuth Callback] Login successful for:', data.user.email);

        // If this was a popup and now same-origin after redirect, notify opener
        if (window.opener && !window.opener.closed) {
          try {
            window.opener.postMessage(
              { type: 'OAUTH_CALLBACK_SUCCESS_DIRECT', user: data.user },
              window.location.origin
            );
            // Reload the opener to pick up the new session from localStorage
            window.opener.location.reload();
          } catch {
            // If still cross-origin somehow, just close
          }
          setTimeout(() => window.close(), 500);
        } else {
          // Full-page redirect: navigate to home
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 1500);
        }
      } catch (error) {
        console.error('[OAuth Callback] Error:', error);
        setStatus('error');
        setErrorMsg((error as Error).message);

        // Auto-close popup or redirect after error
        setTimeout(() => {
          if (window.opener && !window.opener.closed) {
            window.close();
          } else {
            navigate('/', { replace: true });
          }
        }, 3000);
      }
    };

    void handleCallback();
  }, [navigate]);

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="text-center max-w-md px-6">
        {status === 'loading' && (
          <>
            <div className="mb-4 inline-flex h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-purple-500"></div>
            <h1 className="text-xl font-semibold text-white">Đang xử lý đăng nhập...</h1>
            <p className="mt-2 text-sm text-slate-400">Vui lòng chờ một chút</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30">
              <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-white">Đăng nhập thành công!</h1>
            <p className="mt-2 text-sm text-slate-400">Đang chuyển hướng...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/20 border border-rose-500/30">
              <svg className="h-6 w-6 text-rose-400" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-white">Đăng nhập thất bại</h1>
            <p className="mt-2 text-sm text-rose-400">{errorMsg}</p>
            <p className="mt-1 text-xs text-slate-500">Tự động chuyển hướng sau 3 giây...</p>
          </>
        )}
      </div>
    </div>
  );
}
