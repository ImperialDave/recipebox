"use client";

import { Toaster } from "sonner";
import { useTheme } from "./theme-provider";

export function ToastProvider() {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      position="top-center"
      theme={resolvedTheme}
      toastOptions={{
        style: {
          background: "var(--elevated)",
          color: "var(--fg)",
          border: "1px solid var(--border)",
        },
      }}
    />
  );
}
