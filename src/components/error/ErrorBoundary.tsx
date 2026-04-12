"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/Button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });

    if (typeof window !== "undefined" && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        extra: { componentStack: errorInfo.componentStack },
      });
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-white to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-800 p-8 shadow-xl">
            <div className="mb-6 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <svg
                  className="h-8 w-8 text-red-600 dark:text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            <h2 className="mb-2 text-center text-xl font-bold text-zinc-900 dark:text-zinc-100">
              出现了问题
            </h2>
            <p className="mb-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
              应用程序遇到了意外错误，请尝试刷新页面
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="mb-6 rounded-lg bg-zinc-100 dark:bg-zinc-700 p-4">
                <p className="mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  错误详情 (开发模式)
                </p>
                <pre className="max-h-32 overflow-auto text-xs text-zinc-700 dark:text-zinc-300">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack && (
                    <>{`\n\n${this.state.errorInfo.componentStack}`}</>
                  )}
                </pre>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Button onClick={this.handleReset} className="w-full">
                重试
              </Button>
              <Button
                variant="secondary"
                onClick={() => window.location.reload()}
                className="w-full"
              >
                刷新页面
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
