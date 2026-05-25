import { useCallback, useState } from 'react';
import type { CartSummary } from '../../types/app';

const EMPTY_CART: CartSummary = { items: [], totalAmount: 0 };

type ApiFetch = <T>(path: string, options?: RequestInit, allowRetry?: boolean) => Promise<T>;

interface UseCartOptions {
  apiFetch: ApiFetch;
  isLoggedIn: boolean;
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

export function useCart({ apiFetch, isLoggedIn, addToast }: UseCartOptions) {
  const [cart, setCart] = useState<CartSummary>(EMPTY_CART);

  const fetchCart = useCallback(async () => {
    if (!isLoggedIn) return;

    try {
      const data = await apiFetch<CartSummary>('/cart');
      setCart(data);
    } catch {
      addToast('Khong tai duoc gio hang.', 'error');
    }
  }, [apiFetch, isLoggedIn, addToast]);

  const addToCart = useCallback(async (productId: number, quantity: number) => {
    if (!isLoggedIn) {
      addToast('Ban can dang nhap de them vao gio hang.', 'info');
      return;
    }

    const existing = cart.items.find((item) => item.productId === productId);
    const nextQuantity = (existing?.quantity ?? 0) + quantity;

    try {
      await apiFetch('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity: nextQuantity }),
      });
      await fetchCart();
      addToast('Da them san pham vao gio hang', 'success');
    } catch (error) {
      addToast((error as Error).message, 'error');
    }
  }, [apiFetch, cart.items, fetchCart, isLoggedIn, addToast]);

  const updateCartQuantity = useCallback(async (productId: number, quantity: number) => {
    try {
      await apiFetch('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId, quantity }),
      });
      await fetchCart();
    } catch (error) {
      addToast((error as Error).message, 'error');
    }
  }, [apiFetch, fetchCart, addToast]);

  const clearCartState = useCallback(() => {
    setCart(EMPTY_CART);
  }, []);

  const clearCart = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      await apiFetch('/cart', { method: 'DELETE' });
      clearCartState();
    } catch (error) {
      addToast((error as Error).message, 'error');
    }
  }, [apiFetch, isLoggedIn, clearCartState, addToast]);

  return {
    cart,
    setCart,
    fetchCart,
    addToCart,
    updateCartQuantity,
    clearCartState,
    clearCart,
  };
}
