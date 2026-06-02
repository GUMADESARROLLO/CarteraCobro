import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { ReactNode } from 'react';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextValue {
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextValue>({
  addToast: () => {},
});

let toastId = 0;
const listeners = new Set<(toast: Toast) => void>();

export function addToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const toast: Toast = { id: ++toastId, message, type };
  listeners.forEach((fn) => fn(toast));
}

export function useToast() {
  return useContext(ToastContext);
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const handleToast = useCallback((toast: Toast) => {
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 4000);
  }, []);

  useEffect(() => {
    listeners.add(handleToast);
    return () => { listeners.delete(handleToast); };
  }, [handleToast]);

  const addToastFn = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const toast: Toast = { id: ++toastId, message, type };
      handleToast(toast);
    },
    [handleToast]
  );

  const colors: Record<string, string> = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  };

  return (
    <ToastContext.Provider value={{ addToast: addToastFn }}>
      <div className="fixed right-4 top-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <button
            key={toast.id}
            onClick={() =>
              setToasts((prev) => prev.filter((t) => t.id !== toast.id))
            }
            className={`${colors[toast.type]} animate-slide-in rounded-lg px-4 py-3 text-white shadow-lg transition hover:opacity-90`}
          >
            {toast.message}
          </button>
        ))}
      </div>
      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out; }
      `}</style>
    </ToastContext.Provider>
  );
}
