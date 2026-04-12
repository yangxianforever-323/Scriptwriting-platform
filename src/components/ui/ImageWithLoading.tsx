"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";

interface ImageWithLoadingProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: ReactNode;
  onClick?: () => void;
  onLoad?: () => void;
  onError?: () => void;
}

export function ImageWithLoading({
  src,
  alt,
  className = "",
  fallback,
  onClick,
  onLoad,
  onError,
}: ImageWithLoadingProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setImageSrc(src);
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 ${className}`}
        onClick={onClick}
      >
        {fallback || (
          <div className="flex flex-col items-center gap-2 text-zinc-400">
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-xs">加载失败</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-600 dark:border-t-zinc-300" />
        </div>
      )}
      <img
        ref={imageRef}
        src={imageSrc}
        alt={alt}
        className={`transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"} ${className}`}
        onLoad={handleLoad}
        onError={handleError}
        onClick={onClick}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
