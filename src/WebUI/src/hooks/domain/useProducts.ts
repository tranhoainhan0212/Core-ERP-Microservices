import { useCallback, useState } from 'react';
import { API_URL } from '../../services/api/config';
import type { Product } from '../../types/app';

interface UseProductsOptions {
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

export function useProducts({ addToast }: UseProductsOptions) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setIsProductsLoading(true);

    try {
      const data = await fetch(`${API_URL}/products`).then((response) => response.json());
      setProducts(data);
    } catch {
      addToast('Khong tai duoc danh sach san pham.', 'error');
    } finally {
      setIsProductsLoading(false);
    }
  }, [addToast]);

  return {
    products,
    setProducts,
    isProductsLoading,
    fetchProducts,
  };
}
