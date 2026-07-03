"use client";

import { Toaster } from "sonner";
import { useTheme } from "./theme-provider";

export function ToastProvider() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <Toaster
      position="top-center"
      theme={isDark ? "dark" : "light"}
      toastOptions={{
        style: {
          background: isDark ? "#211c19" : "#FDF8F3",
          color: isDark ? "#f5f0eb" : "#2C2522",
          border: isDark ? "1px solid #3f3833" : "1px solid #F0E4D6",
        },
      }}
    />
  );
}