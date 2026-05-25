import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ChevronDown, ShoppingBag, User, Menu, X, Settings, LogOut, Shield } from 'lucide-react';
import AuthModal from './AuthModal';
import MegaMenu, { type MegaMenuCategory } from './MegaMenu';
import { useAppContext } from '../contexts/AppContext';

const navItems: Array<{ label: string; mega?: MegaMenuCategory }> = [
  { label: 'Smartphones', mega: 'Smartphones' },
  { label: 'Tablets', mega: 'Tablets' },
  { label: 'Watches' },
  { label: 'Buds' },
  { label: 'Accessories' },
];

type AuthMode = 'login' | 'register';

export default function Header() {
  const navigate = useNavigate();
  const [activeMega, setActiveMega] = useState<MegaMenuCategory | null>(null);
  const [isGuestMenuOpen, setIsGuestMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const guestMenuRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const { cart, isLoggedIn, user, logout, isAdmin } = useAppContext();

  // Scroll detection for header glass effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (guestMenuRef.current && !guestMenuRef.current.contains(target)) setIsGuestMenuOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(target)) setIsUserMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      setIsGuestMenuOpen(false);
      setIsAuthModalOpen(false);
    }
  }, [isLoggedIn]);

  const openAuthModal = (mode: AuthMode) => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
    setIsGuestMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'border-b border-purple-500/10 bg-[#050a18]/80 shadow-[0_4px_30px_rgba(99,102,241,0.08)] backdrop-blur-2xl'
            : 'border-b border-white/5 bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg shadow-purple-500/25 transition-all group-hover:shadow-purple-500/40">
              <span className="text-sm font-black text-white">C</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Core<span className="gradient-text">ERP</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav
            className="relative hidden items-center gap-1 md:flex"
            onMouseLeave={() => setActiveMega(null)}
          >
            {navItems.map((item) => {
              const isMegaActive = item.mega && activeMega === item.mega;

              return (
                <button
                  key={item.label}
                  type="button"
                  onMouseEnter={() => setActiveMega(item.mega ?? null)}
                  className={`group inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                    isMegaActive
                      ? 'bg-white/[0.06] text-purple-300'
                      : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                  }`}
                >
                  {item.label}
                  {item.mega && (
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-200 ${isMegaActive ? 'rotate-180 text-purple-400' : 'text-slate-500'}`}
                    />
                  )}
                </button>
              );
            })}

            {activeMega && <MegaMenu category={activeMega} onClose={() => setActiveMega(null)} />}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cart */}
            <NavLink
              to="/cart"
              className="relative rounded-xl p-2.5 text-slate-400 transition-all hover:bg-white/[0.06] hover:text-purple-300"
            >
              <ShoppingBag size={19} />
              {cart.items.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-violet-500 px-1 text-[10px] font-bold text-white shadow-lg shadow-purple-500/40">
                  {Math.min(cart.items.length, 99)}
                </span>
              )}
            </NavLink>

            {isLoggedIn ? (
              <div ref={userMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((o) => !o)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-300 transition-all hover:border-purple-500/30 hover:bg-white/[0.08] hover:text-white"
                  title={`Logged in as ${user?.fullName || ''}`}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 text-[10px] font-bold text-white">
                    {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:inline">{user?.fullName?.split(' ')[0] || 'User'}</span>
                  <ChevronDown size={12} className={`transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#0c1222]/95 shadow-2xl shadow-black/40 backdrop-blur-xl"
                       style={{ animation: 'slideDown 0.2s ease-out' }}>
                    <div className="border-b border-white/5 px-4 py-3.5">
                      <p className="text-xs text-slate-500">Đăng nhập với</p>
                      <p className="mt-0.5 font-semibold text-white">{user?.fullName}</p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                    </div>

                    <div className="p-1.5">
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => { navigate('/admin'); setIsUserMenuOpen(false); }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-purple-300"
                        >
                          <Shield size={16} className="text-purple-400" />
                          Admin Dashboard
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => { setIsUserMenuOpen(false); }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                      >
                        <Settings size={16} className="text-slate-500" />
                        Cài đặt
                      </button>
                      <div className="mx-2 my-1 border-t border-white/5" />
                      <button
                        type="button"
                        onClick={() => { logout(); setIsUserMenuOpen(false); }}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                      >
                        <LogOut size={16} />
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div ref={guestMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsGuestMenuOpen((o) => !o)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-300 transition-all hover:border-purple-500/30 hover:bg-white/[0.08] hover:text-white"
                >
                  <User size={16} />
                  <span className="hidden sm:inline">Guest</span>
                </button>

                {isGuestMenuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-white/10 bg-[#0c1222]/95 shadow-2xl shadow-black/40 backdrop-blur-xl"
                       style={{ animation: 'slideDown 0.2s ease-out' }}>
                    <div className="p-1.5">
                      <button
                        type="button"
                        onClick={() => openAuthModal('login')}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-purple-300"
                      >
                        Đăng nhập
                      </button>
                      <button
                        type="button"
                        onClick={() => openAuthModal('register')}
                        className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-purple-300"
                      >
                        Đăng ký
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-xl p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-white md:hidden"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-white/5 bg-[#050a18]/95 backdrop-blur-xl md:hidden" style={{ animation: 'slideDown 0.2s ease-out' }}>
            <div className="mx-auto max-w-7xl space-y-1 px-4 py-4">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {isAuthModalOpen && (
        <AuthModal
          initialMode={authMode}
          onClose={() => setIsAuthModalOpen(false)}
        />
      )}
    </>
  );
}
