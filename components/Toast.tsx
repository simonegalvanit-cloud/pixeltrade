"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

// A small pill message at the bottom of the screen, like "Link copied".
const ToastContext = createContext<(msg: string) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState("");
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const toast = useCallback((m: string) => {
    setMsg(m);
    setShow(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(false), 2000);
  }, []);
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className={`toast${show ? " show" : ""}`} role="status">{msg}</div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

// A button that only shows a message. Used for features that come in later steps.
export function ToastButton({ message, children, ...rest }: { message: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const toast = useToast();
  return (
    <button type="button" {...rest} onClick={(e) => { e.stopPropagation(); e.preventDefault(); toast(message); }}>
      {children}
    </button>
  );
}
