"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        style: {
          background: "#FDF8F3",
          color: "#2C2522",
          border: "1px solid #F0E4D6",
        },
      }}
    />
  );
}