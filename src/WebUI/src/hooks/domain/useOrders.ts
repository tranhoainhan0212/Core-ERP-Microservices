import { useCallback, useState } from 'react';
import type { CheckoutResponse, Order } from '../../types/app';

type ApiFetch = <T>(path: string, options?: RequestInit, allowRetry?: boolean) => Promise<T>;

interface UseOrdersOptions {
  apiFetch: ApiFetch;
  isLoggedIn: boolean;
  isAdmin: boolean;
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
  fetchCart: () => Promise<void>;
}

export function useOrders({ apiFetch, isLoggedIn, isAdmin, addToast, fetchCart }: UseOrdersOptions) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResponse | null>(null);

  const fetchMyOrders = useCallback(async () => {
    if (!isLoggedIn) return;

    try {
      const data = await apiFetch<Order[]>('/orders/mine');
      setOrders(data);
    } catch {
      addToast('Khong tai duoc don hang cua ban.', 'error');
    }
  }, [apiFetch, isLoggedIn, addToast]);

  const fetchAllOrders = useCallback(async () => {
    try {
      const data = await apiFetch<Order[]>('/orders');
      setAdminOrders(data);
    } catch {
      addToast('Loi: Yeu cau quyen Admin.', 'error');
    }
  }, [apiFetch, addToast]);

  const checkout = useCallback(async (paymentMethod: 'MOMO' | 'VNPAY' | 'COD') => {
    setCheckoutResult(null);

    try {
      const result = await apiFetch<CheckoutResponse>('/orders/checkout-from-cart', {
        method: 'POST',
        body: JSON.stringify({ paymentMethod }),
      });

      setCheckoutResult(result);
      await fetchCart();
      await fetchMyOrders();

      if (isAdmin) {
        await fetchAllOrders();
      }

      addToast('Dat hang thanh cong! Dang xu ly don...', 'success');

      if (result.paymentUrl) {
        window.open(result.paymentUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      addToast((error as Error).message, 'error');
    }
  }, [apiFetch, fetchCart, fetchMyOrders, isAdmin, fetchAllOrders, addToast]);

  const clearOrderState = useCallback(() => {
    setOrders([]);
    setAdminOrders([]);
    setCheckoutResult(null);
  }, []);

  return {
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
  };
}
