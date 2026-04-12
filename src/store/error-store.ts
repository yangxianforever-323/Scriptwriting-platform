"use client";

import { create } from "zustand";

export interface AppError {
  id: string;
  message: string;
  code?: string;
  details?: unknown;
  timestamp: string;
  severity: "error" | "warning" | "info";
  handled: boolean;
}

interface ErrorStore {
  errors: AppError[];
  hasUnhandledErrors: boolean;

  addError: (
    error: Error | string,
    options?: {
      code?: string;
      details?: unknown;
      severity?: "error" | "warning" | "info";
    }
  ) => AppError;

  markErrorAsHandled: (errorId: string) => void;

  removeError: (errorId: string) => void;

  clearAllErrors: () => void;

  getUnhandledErrors: () => AppError[];
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export const useErrorStore = create<ErrorStore>((set, get) => ({
  errors: [],
  hasUnhandledErrors: false,

  addError: (error, options = {}) => {
    const appError: AppError = {
      id: generateId(),
      message: error instanceof Error ? error.message : error,
      code: options.code,
      details: options.details ?? (error instanceof Error ? error.stack : undefined),
      timestamp: new Date().toISOString(),
      severity: options.severity ?? "error",
      handled: false,
    };

    console.error(`[${appError.severity.toUpperCase()}]`, appError);

    set((state) => ({
      errors: [appError, ...state.errors],
      hasUnhandledErrors: true,
    }));

    return appError;
  },

  markErrorAsHandled: (errorId) => {
    set((state) => {
      const errors = state.errors.map((e) =>
        e.id === errorId ? { ...e, handled: true } : e
      );
      return {
        errors,
        hasUnhandledErrors: errors.some((e) => !e.handled),
      };
    });
  },

  removeError: (errorId) => {
    set((state) => {
      const errors = state.errors.filter((e) => e.id !== errorId);
      return {
        errors,
        hasUnhandledErrors: errors.some((e) => !e.handled),
      };
    });
  },

  clearAllErrors: () => {
    set({ errors: [], hasUnhandledErrors: false });
  },

  getUnhandledErrors: () => {
    return get().errors.filter((e) => !e.handled);
  },
}));
