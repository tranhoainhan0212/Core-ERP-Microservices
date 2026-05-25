import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useOrders } from '../domain/useOrders';
import type { Order } from '../../types/app';

type ApiFetch = <T>(path: string, options?: RequestInit, allowRetry?: boolean) => Promise<T>;

function createOrderList(): Order[] {
  return [
    {
      id: 1,
      orderNumber: 'ORD-1',
      customerName: 'John',
      customerEmail: 'john@example.com',
      totalAmount: 500,
      status: 'Paid',
      createdAt: new Date().toISOString(),
    },
  ];
}

describe('useOrders', () => {
  it('fetches customer and admin orders', async () => {
    const apiFetch = vi.fn((async function apiFetchMock<T>(path: string) {
      if (path === '/orders/mine' || path === '/orders') return createOrderList() as T;
      return [] as T;
    }) as <T>(path: string, options?: RequestInit, allowRetry?: boolean) => Promise<T>);
    const typedApiFetch = apiFetch as unknown as ApiFetch;
    const addToast = vi.fn();
    const fetchCart = vi.fn(async () => undefined);

    const { result } = renderHook(() =>
      useOrders({ apiFetch: typedApiFetch, isLoggedIn: true, isAdmin: true, addToast, fetchCart }),
    );

    await act(async () => {
      await result.current.fetchMyOrders();
      await result.current.fetchAllOrders();
    });

    expect(result.current.orders).toHaveLength(1);
    expect(result.current.adminOrders).toHaveLength(1);
  });

  it('handles checkout success and admin refresh', async () => {
    const paymentUrl = 'https://payment.example.com';
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    const apiFetch = vi.fn((async function apiFetchMock<T>(path: string) {
      if (path === '/orders/checkout-from-cart') {
        return {
          orderId: 1,
          orderNumber: 'ORD-NEW',
          status: 'Pending',
          totalAmount: 200,
          paymentMethod: 'MOMO',
          paymentUrl,
        } as T;
      }

      if (path === '/orders/mine' || path === '/orders') {
        return createOrderList() as T;
      }

      return [] as T;
    }) as <T>(path: string, options?: RequestInit, allowRetry?: boolean) => Promise<T>);
    const typedApiFetch = apiFetch as unknown as ApiFetch;

    const addToast = vi.fn();
    const fetchCart = vi.fn(async () => undefined);

    const { result } = renderHook(() =>
      useOrders({ apiFetch: typedApiFetch, isLoggedIn: true, isAdmin: true, addToast, fetchCart }),
    );

    await act(async () => {
      await result.current.checkout('MOMO');
    });

    expect(fetchCart).toHaveBeenCalledTimes(1);
    expect(result.current.checkoutResult?.orderNumber).toBe('ORD-NEW');
    expect(addToast).toHaveBeenCalledWith('Dat hang thanh cong! Dang xu ly don...', 'success');
    expect(openSpy).toHaveBeenCalledWith(paymentUrl, '_blank', 'noopener,noreferrer');

    act(() => {
      result.current.clearOrderState();
    });

    expect(result.current.orders).toHaveLength(0);
    expect(result.current.adminOrders).toHaveLength(0);

    openSpy.mockRestore();
  });

  it('handles checkout and fetch errors', async () => {
    const apiFetch = vi.fn((async function apiFetchMock<T>(path: string) {
      if (path === '/orders/checkout-from-cart') throw new Error('Checkout failed');
      if (path === '/orders') throw new Error('Admin failed');
      if (path === '/orders/mine') throw new Error('Mine failed');
      return [] as T;
    }) as <T>(path: string, options?: RequestInit, allowRetry?: boolean) => Promise<T>);
    const typedApiFetch = apiFetch as unknown as ApiFetch;

    const addToast = vi.fn();
    const fetchCart = vi.fn(async () => undefined);

    const { result } = renderHook(() =>
      useOrders({ apiFetch: typedApiFetch, isLoggedIn: true, isAdmin: false, addToast, fetchCart }),
    );

    await act(async () => {
      await result.current.fetchMyOrders();
      await result.current.fetchAllOrders();
      await result.current.checkout('COD');
    });

    expect(addToast).toHaveBeenCalledWith('Khong tai duoc don hang cua ban.', 'error');
    expect(addToast).toHaveBeenCalledWith('Loi: Yeu cau quyen Admin.', 'error');
    expect(addToast).toHaveBeenCalledWith('Checkout failed', 'error');
  });
});
