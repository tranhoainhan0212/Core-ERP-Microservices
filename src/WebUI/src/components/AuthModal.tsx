import { useMemo, useState, useEffect } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff, ArrowLeft, KeyRound, Sparkles } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

type AuthView = 'login' | 'register' | 'forgot';

interface AuthModalProps {
  initialMode: 'login' | 'register';
  onClose: () => void;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function AuthModal({ initialMode, onClose }: AuthModalProps) {
  const [view, setView] = useState<AuthView>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const { loginWithPassword, registerWithPassword, startGoogleOAuth2, completeGoogleLogin, addToast, apiFetch } = useAppContext();

  // Listen for OAuth callback messages from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify the message comes from our own origin
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data.type === 'OAUTH_CALLBACK_SUCCESS' && event.data.code && event.data.state) {
        console.log('[AuthModal] OAuth success received, completing login...');
        setIsSubmitting(true);
        void (async () => {
          try {
            await completeGoogleLogin(event.data.code, event.data.state);
            console.log('[AuthModal] Google login completed successfully');
          } catch (error) {
            console.error('[AuthModal] Google login error:', error);
            addToast((error as Error).message, 'error');
          } finally {
            setIsSubmitting(false);
          }
        })();
      } else if (event.data.type === 'OAUTH_CALLBACK_SUCCESS_DIRECT') {
        // Popup already logged in directly and saved to localStorage, just reload
        console.log('[AuthModal] Direct login success, reloading...');
        window.location.reload();
      } else if (event.data.type === 'OAUTH_CALLBACK_ERROR') {
        console.error('[AuthModal] OAuth error:', event.data.message);
        addToast(event.data.message || 'OAuth error occurred', 'error');
      }
    };

    window.addEventListener('message', handleMessage);
    console.log('[AuthModal] Message listener attached');
    return () => window.removeEventListener('message', handleMessage);
  }, [completeGoogleLogin, addToast]);

  const errors = useMemo(() => {
    const next: string[] = [];

    if (view === 'forgot') {
      if (!email.trim() || !isValidEmail(email.trim())) {
        next.push('Vui lòng nhập email hợp lệ.');
      }
      return next;
    }

    if (!email.trim() || !isValidEmail(email.trim())) {
      next.push('Email không hợp lệ.');
    }

    if (!password.trim() || password.trim().length < 8) {
      next.push('Mật khẩu tối thiểu 8 ký tự.');
    }

    if (view === 'register') {
      if (!fullName.trim()) {
        next.push('Vui lòng nhập họ tên.');
      }
      if (password !== confirmPassword) {
        next.push('Mật khẩu xác nhận không khớp.');
      }
    }

    return next;
  }, [email, password, confirmPassword, fullName, view]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (errors.length > 0) {
      addToast(errors[0], 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      if (view === 'forgot') {
        // Call forgot password API
        try {
          await apiFetch('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email: email.trim() }),
          });
        } catch {
          // Silently handle — we show success regardless to prevent email enumeration
        }
        setForgotSent(true);
        setIsSubmitting(false);
        return;
      }

      if (view === 'login') {
        await loginWithPassword(email.trim(), password.trim());
      } else {
        await registerWithPassword(fullName.trim(), email.trim(), password.trim());
      }
      onClose();
    } catch (error) {
      addToast((error as Error).message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchView = (newView: AuthView) => {
    setView(newView);
    setForgotSent(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  // Title & subtitle per view
  const viewConfig = {
    login: {
      icon: Lock,
      title: 'Chào mừng trở lại',
      subtitle: 'Đăng nhập vào tài khoản CoreERP của bạn',
    },
    register: {
      icon: Sparkles,
      title: 'Tạo tài khoản',
      subtitle: 'Đăng ký để trải nghiệm CoreERP Galaxy',
    },
    forgot: {
      icon: KeyRound,
      title: 'Quên mật khẩu',
      subtitle: 'Nhập email để nhận liên kết đặt lại mật khẩu',
    },
  };

  const config = viewConfig[view];
  const ViewIcon = config.icon;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[440px] overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'fadeInUp 0.3s ease-out' }}
      >
        {/* Gradient header */}
        <div className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-violet-900 px-8 pb-8 pt-7">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>

          {/* Back button for forgot view */}
          {view === 'forgot' && (
            <button
              type="button"
              onClick={() => switchView('login')}
              className="absolute left-4 top-4 flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft size={14} />
              Quay lại
            </button>
          )}

          {/* Icon */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shadow-inner backdrop-blur-sm">
            <ViewIcon size={26} className="text-white" />
          </div>

          <h2 className="mt-4 text-center text-xl font-bold text-white">{config.title}</h2>
          <p className="mt-1.5 text-center text-sm text-purple-200/80">{config.subtitle}</p>
        </div>

        {/* Body */}
        <div className="px-8 pb-8 pt-6">
          {/* Tab switcher (login/register only) */}
          {view !== 'forgot' && (
            <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => switchView('login')}
                className={`rounded-lg py-2.5 text-sm font-semibold transition-all ${
                  view === 'login'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => switchView('register')}
                className={`rounded-lg py-2.5 text-sm font-semibold transition-all ${
                  view === 'register'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Đăng ký
              </button>
            </div>
          )}

          {/* Forgot password success */}
          {view === 'forgot' && forgotSent ? (
            <div className="py-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                <Mail size={28} className="text-emerald-500" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">Kiểm tra email của bạn</h3>
              <p className="mt-2 text-sm text-slate-500">
                Nếu tài khoản tồn tại với email <span className="font-semibold text-slate-700">{email}</span>,
                chúng tôi đã gửi liên kết đặt lại mật khẩu.
              </p>
              <button
                type="button"
                onClick={() => switchView('login')}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                <ArrowLeft size={16} />
                Về trang đăng nhập
              </button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={submit}>
              {/* Full name (register) */}
              {view === 'register' && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Họ và tên</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Nhập họ và tên đầy đủ"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    type="email"
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100"
                  />
                </div>
              </div>

              {/* Password (login & register) */}
              {view !== 'forgot' && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-600">Mật khẩu</label>
                    {view === 'login' && (
                      <button
                        type="button"
                        onClick={() => switchView('forgot')}
                        className="text-xs font-medium text-purple-600 transition hover:text-purple-800"
                      >
                        Quên mật khẩu?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Tối thiểu 8 ký tự"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={view === 'login' ? 'current-password' : 'new-password'}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-500 outline-none transition focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 transition hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm password (register) */}
              {view === 'register' && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-10 text-sm outline-none transition focus:border-purple-400 focus:bg-white focus:ring-2 focus:ring-purple-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 transition hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {/* Password match indicator */}
                  {confirmPassword && (
                    <p className={`mt-1.5 text-xs font-medium ${password === confirmPassword ? 'text-emerald-600' : 'text-red-500'}`}>
                      {password === confirmPassword ? '✓ Mật khẩu khớp' : '✗ Mật khẩu không khớp'}
                    </p>
                  )}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all hover:from-slate-800 hover:to-slate-700 hover:shadow-xl disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Đang xử lý...
                  </span>
                ) : view === 'login' ? (
                  'Đăng nhập'
                ) : view === 'register' ? (
                  'Tạo tài khoản'
                ) : (
                  'Gửi liên kết đặt lại'
                )}
              </button>
            </form>
          )}

          {/* Divider + Google (login/register only) */}
          {view !== 'forgot' && !forgotSent && (
            <>
              <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
                <div className="h-px flex-1 bg-slate-200" />
                <span>hoặc tiếp tục với</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <button
                type="button"
                onClick={() => void startGoogleOAuth2()}
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm disabled:opacity-60"
              >
                {/* Google icon */}
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
                  <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                </svg>
                Đăng nhập với Google
              </button>

              {/* Terms text */}
              <p className="mt-5 text-center text-[11px] leading-relaxed text-slate-400">
                Bằng việc tiếp tục, bạn đồng ý với{' '}
                <span className="font-medium text-slate-600 hover:underline cursor-pointer">Điều khoản dịch vụ</span>
                {' '}và{' '}
                <span className="font-medium text-slate-600 hover:underline cursor-pointer">Chính sách bảo mật</span>
                {' '}của CoreERP.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
