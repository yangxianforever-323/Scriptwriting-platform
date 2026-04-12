"use client";

import { ToastProvider } from "@/components/ui/Toast";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { ErrorToastContainer } from "@/components/error/ErrorToastContainer";
import type { ReactNode } from "react";

/**
 * Client-side providers wrapper.
 * Used to wrap the app with client-side context providers.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        {children}
        <ErrorToastContainer />
      </ToastProvider>
    </ErrorBoundary>
  );
}
