import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

const toastStyleByType = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-rose-200 bg-rose-50 text-rose-800',
  info: 'border-sky-200 bg-sky-50 text-sky-800',
} as const;

export default function ToastStack() {
  const { toasts, removeToast } = useAppContext();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 top-24 z-[100] flex w-[min(94vw,360px)] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-2 rounded-xl border p-3 shadow-lg ${toastStyleByType[toast.type]}`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 size={16} className="mt-0.5" />
          ) : toast.type === 'error' ? (
            <AlertCircle size={16} className="mt-0.5" />
          ) : (
            <Info size={16} className="mt-0.5" />
          )}
          <p className="flex-1 text-sm font-medium">{toast.text}</p>
          <button type="button" onClick={() => removeToast(toast.id)}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
