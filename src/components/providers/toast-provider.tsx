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
          background: "var(--color-elevated)",
          color: "var(--color-fg)",
          border: "1px solid var(--color-border)",
        },
      }}
    />
  );
}
