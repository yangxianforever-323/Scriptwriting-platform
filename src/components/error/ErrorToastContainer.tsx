"use client";

import { useEffect } from "react";
import { useErrorStore } from "@/store/error-store";
import { useToast } from "@/components/ui/Toast";

export function ErrorToastContainer() {
  const { errors, removeError, markErrorAsHandled } = useErrorStore();
  const { showToast } = useToast();

  useEffect(() => {
    const unhandledErrors = errors.filter((e) => !e.handled);
    unhandledErrors.forEach((error) => {
      markErrorAsHandled(error.id);
      const toastType = error.severity === "warning" ? "info" : error.severity;
      showToast(error.message, toastType as "success" | "error" | "info");
      
      if (error.severity !== "error") {
        setTimeout(() => removeError(error.id), 5000);
      }
    });
  }, [errors, markErrorAsHandled, showToast, removeError]);

  return null;
}
