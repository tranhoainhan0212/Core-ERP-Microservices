import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useCart } from '../domain/useCart';
import type { CartSummary } from '../../types/app';

type ApiFetch = <T>(path: string, options?: RequestInit, allowRetry?: boolean) => Promise<T>;

function createCart(): CartSummary {
  return {
    items: [
      { productId: 1, productName: 'Galaxy S', unitPrice: 1000, quantity: 1, subTotal: 1000 },
    ],
    totalAmount: 1000,
  };
}

describe('useCart', () => {
  it('fetches cart when logged in', async () => {
    const apiFetch = vi.fn((async function apiFetchMock<T>() {
      return createCart() as T;
    }) as <T>(path: string, options?: RequestInit, allowRetry?: boolean) => Promise<T>);
    const typedApiFetch = apiFetch as unknown as ApiFetch;
    const addToast = vi.fn();

    const { result } = renderHook(() => useCart({ apiFetch: typedApiFetch, isLoggedIn: true, addToast }));

    await act(async () => {
      await result.current.fetchCart();
    });

    expect(apiFetch).toHaveBeenCalledWith('/cart');
    expect(result.current.cart.totalAmount).toBe(1000);
    expect(addToast).not.toHaveBeenCalled();
  });

  it('shows login message when adding cart item while logged out', async () => {
    const apiFetch = vi.fn();
    const typedApiFetch = apiFetch as unknown as ApiFetch;
    const addToast = vi.fn();

    const { result } = renderHook(() => useCart({ apiFetch: typedApiFetch, isLoggedIn: false, addToast }));

    await act(async () => {
      await result.current.addToCart(10, 1);
    });

    expect(apiFetch).not.toHaveBeenCalled();
    expect(addToast).toHaveBeenCalledWith('Ban can dang nhap de them vao gio hang.', 'info');
  });

  it('adds item and refreshes cart when logged in', async () => {
    const apiFetch = vi.fn((async function apiFetchMock<T>(path: string) {
      if (path === '/cart/items') return {} as T;
      return createCart() as T;
    }) as <T>(path: string, options?: RequestInit, allowRetry?: boolean) => Promise<T>);
    const typedApiFetch = apiFetch as unknown as ApiFetch;
    const addToast = vi.fn();

    const { result } = renderHook(() => useCart({ apiFetch: typedApiFetch, isLoggedIn: true, addToast }));

    await act(async () => {
      await result.current.addToCart(1, 1);
    });

    expect(apiFetch).toHaveBeenNthCalledWith(
      1,
      '/cart/items',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(apiFetch).toHaveBeenNthCalledWith(2, '/cart');
    expect(addToast).toHaveBeenCalledWith('Da them san pham vao gio hang', 'success');
  });

  it('handles update quantity errors', async () => {
    const apiFetch = vi.fn((async function apiFetchMock<T>(path: string) {
      if (path === '/cart/items') {
        throw new Error('Update failed');
      }
      return createCart() as T;
    }) as <T>(path: string, options?: RequestInit, allowRetry?: boolean) => Promise<T>);
    const typedApiFetch = apiFetch as unknown as ApiFetch;
    const addToast = vi.fn();

    const { result } = renderHook(() => useCart({ apiFetch: typedApiFetch, isLoggedIn: true, addToast }));

    await act(async () => {
      await result.current.updateCartQuantity(1, 2);
    });

    expect(addToast).toHaveBeenCalledWith('Update failed', 'error');

    act(() => {
      result.current.clearCartState();
    });

    expect(result.current.cart.items).toHaveLength(0);
  });
});
