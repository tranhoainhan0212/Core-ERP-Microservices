import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useProducts } from '../domain/useProducts';

describe('useProducts', () => {
  it('loads products successfully', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: async () => [{ id: 1, name: 'Galaxy', sku: 'GAL-1', price: 1, stockQuantity: 1, isActive: true }],
    } as Response);

    const addToast = vi.fn();
    const { result } = renderHook(() => useProducts({ addToast }));

    await act(async () => {
      await result.current.fetchProducts();
    });

    expect(result.current.products).toHaveLength(1);
    expect(result.current.isProductsLoading).toBe(false);
    fetchSpy.mockRestore();
  });

  it('handles load failures', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('fail'));
    const addToast = vi.fn();
    const { result } = renderHook(() => useProducts({ addToast }));

    await act(async () => {
      await result.current.fetchProducts();
    });

    expect(addToast).toHaveBeenCalledWith('Khong tai duoc danh sach san pham.', 'error');
    expect(result.current.isProductsLoading).toBe(false);
    fetchSpy.mockRestore();
  });
});
