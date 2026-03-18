"use client";

import { createContext, use, useRef, useState, type ReactNode } from "react";
import { Toast } from "../components/toast";
import type { ToastContent, ToastType } from "../types/toast/types";

type ToastContextType = {
    AddToast: (text: string, type?: ToastType, duration?: number) => void;
};

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {

    const [toasts, setToasts] = useState<ToastContent[]>([]);

    const lastToastTimeRef = useRef<number>(null);

    const AddToast = (text: string, type: ToastType = "info", duration: number = 5000) => {
        if (lastToastTimeRef.current == null) lastToastTimeRef.current = Date.now();
        const now = Date.now();
        const timeSinceLast = now - lastToastTimeRef.current;

        const delay = Math.max(0, 500 - timeSinceLast);
        lastToastTimeRef.current = now + delay;

        setTimeout(() => {
            const id = crypto.randomUUID();
            setToasts(prev => [...prev, { id, text, type, duration }]);

            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }, delay);
    };

    return (
        <ToastContext value={{ AddToast }}>
            <div className="fixed right-0 top-0 z-50 max-w-sm w-fit flex flex-col m-4 gap-4 break-words">
                {toasts.map(t => (
                    <Toast key={t.id} {...t}/>
                ))}
            </div>
            {children}
        </ToastContext>
    );

};

export function useToast() {
  const context = use(ToastContext);
  if (!context) { throw new Error("useToast must be used inside ToastProvider"); }
  return context;
}