'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

export interface ToastMessage {
  id: string;
  type: ToastType;
  text: string;
}

let addExternal: ((msg: Omit<ToastMessage, 'id'>) => void) | null = null;

/** Global helper — call `toast.success('...')` or `toast.error('...')` from anywhere. */
export const toast = {
  success(text: string) {
    addExternal?.({ type: 'success', text });
  },
  error(text: string) {
    addExternal?.({ type: 'error', text });
  },
};

export default function ToastContainer() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  useEffect(() => {
    addExternal = (msg) => {
      const id = crypto.randomUUID();
      setMessages((prev) => [...prev, { ...msg, id }]);
      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== id));
      }, 4000);
    };
    return () => {
      addExternal = null;
    };
  }, []);

  function dismiss(id: string) {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }

  if (messages.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5">
      {messages.map((m) => (
        <ToastItem key={m.id} message={m} onDismiss={() => dismiss(m.id)} />
      ))}
    </div>
  );
}

function ToastItem({
  message,
  onDismiss,
}: {
  message: ToastMessage;
  onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => setVisible(false), 3600);
    return () => clearTimeout(t);
  }, []);

  const isSuccess = message.type === 'success';

  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-lg transition-all duration-300 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
      } ${
        isSuccess
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-red-200 bg-red-50 text-red-700'
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 className="h-4 w-4 shrink-0" />
      ) : (
        <AlertCircle className="h-4 w-4 shrink-0" />
      )}
      <span className="font-medium">{message.text}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-1 rounded p-0.5 opacity-60 hover:opacity-100"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
