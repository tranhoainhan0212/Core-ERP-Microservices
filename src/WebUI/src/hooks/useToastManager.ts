import { useCallback, useState } from 'react';
import type { ToastMessage } from '../types/app';

let toastCounter = 0;

export function useToastManager() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addToast = useCallback((text: string, type: ToastMessage['type']) => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => removeToast(id), 4500);
  }, [removeToast]);

  return { toasts, addToast, removeToast };
}
