import { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useApiClient } from '../hooks/useApiClient';
import { useAuthSession } from '../hooks/useAuthSession';
import { useToastManager } from '../hooks/useToastManager';
import { useCart } from '../hooks/domain/useCart';
import { useOrders } from '../hooks/domain/useOrders';
import { useProducts } from '../hooks/domain/useProducts';
import type {
  AuthResponse,
  CartSummary,
  CheckoutResponse,
  Order,
  Product,
  ToastMessage,
  UserProfile,
} from '../types/app';

interface AppContextType {
  token: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  setToken: (token: string | null) => void;
  setRefreshToken: (token: string | null) => void;
  setUser: (user: UserProfile | null) => void;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  registerWithPassword: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;

  products: Product[];
  isProductsLoading: boolean;
  setProducts: (products: Product[]) => void;
  fetchProducts: () => Promise<void>;

  cart: CartSummary;
  setCart: (cart: CartSummary) => void;
  addToCart: (productId: number, quantity: number) => Promise<void>;
  updateCartQuantity: (productId: number, quantity: number) => Promise<void>;
  fetchCart: () => Promise<void>;
  clearCart: () => Promise<void>;

  orders: Order[];
  adminOrders: Order[];
  setOrders: (orders: Order[]) => void;
  setAdminOrders: (orders: Order[]) => void;
  fetchMyOrders: () => Promise<void>;
  fetchAllOrders: () => Promise<void>;

  checkoutResult: CheckoutResponse | null;
  setCheckoutResult: (result: CheckoutResponse | null) => void;
  checkout: (paymentMethod: 'MOMO' | 'VNPAY' | 'COD') => Promise<void>;

  toasts: ToastMessage[];
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
  removeToast: (id: number) => void;

  apiFetch: <T>(path: string, options?: RequestInit, allowRetry?: boolean) => Promise<T>;
  completeGoogleLogin: (code: string, state: string) => Promise<void>;
  startGoogleOAuth2: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const {
    token,
    refreshToken,
    user,
    setToken,
    setRefreshToken,
    setUser,
    persistSession,
    clearSession,
  } = useAuthSession();

  const { toasts, addToast, removeToast } = useToastManager();
  const { apiFetch, completeGoogleLogin, startGoogleOAuth2 } = useApiClient({
    token,
    refreshToken,
    persistSession,
    addToast,
  });

  const isLoggedIn = !!token && !!user;
  const normalizedRole = user?.role?.trim().toLowerCase();
  const isAdmin = normalizedRole === 'admin';

  const { products, setProducts, isProductsLoading, fetchProducts } = useProducts({ addToast });

  const { cart, setCart, fetchCart, addToCart, updateCartQuantity, clearCartState, clearCart } = useCart({
    apiFetch,
    isLoggedIn,
    addToast,
  });

  const {
    orders,
    setOrders,
    adminOrders,
    setAdminOrders,
    fetchMyOrders,
    fetchAllOrders,
    checkoutResult,
    setCheckoutResult,
    checkout,
    clearOrderState,
  } = useOrders({
    apiFetch,
    isLoggedIn,
    isAdmin,
    addToast,
    fetchCart,
  });

  const logout = () => {
    clearSession();
    clearCartState();
    clearOrderState();
    addToast('Da dang xuat tai khoan.', 'info');
  };

  const loginWithPassword = async (email: string, password: string) => {
    const data = await apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    persistSession(data);
    addToast(`Xin chao ${data.user.fullName}, dang nhap thanh cong!`, 'success');
  };

  const registerWithPassword = async (fullName: string, email: string, password: string) => {
    const data = await apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password }),
    });

    persistSession(data);
    addToast(`Xin chao ${data.user.fullName}, dang ky thanh cong!`, 'success');
  };

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    if (!isLoggedIn) return;

    void fetchCart();
    void fetchMyOrders();

    if (isAdmin) {
      void fetchAllOrders();
    }
  }, [isLoggedIn, isAdmin, fetchCart, fetchMyOrders, fetchAllOrders]);

  const value: AppContextType = {
    token,
    refreshToken,
    user,
    isLoggedIn,
    isAdmin,
    setToken,
    setRefreshToken,
    setUser,
    loginWithPassword,
    registerWithPassword,
    logout,
    products,
    isProductsLoading,
    setProducts,
    fetchProducts,
    cart,
    setCart,
    addToCart,
    updateCartQuantity,
    fetchCart,
    clearCart,
    orders,
    adminOrders,
    setOrders,
    setAdminOrders,
    fetchMyOrders,
    fetchAllOrders,
    checkoutResult,
    setCheckoutResult,
    checkout,
    toasts,
    addToast,
    removeToast,
    apiFetch,
    completeGoogleLogin,
    startGoogleOAuth2,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useAppContext must be used within AppContextProvider');
  }

  return context;
}
