"use client";

import { useState, useCallback } from "react";

export function useImageViewer() {
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [viewerAlt, setViewerAlt] = useState<string>("Image");

  const openViewer = useCallback((src: string, alt?: string) => {
    setViewerImage(src);
    if (alt) setViewerAlt(alt);
  }, []);

  const closeViewer = useCallback(() => {
    setViewerImage(null);
    setViewerAlt("Image");
  }, []);

  return {
    viewerImage,
    viewerAlt,
    openViewer,
    closeViewer,
    isOpen: !!viewerImage,
  };
}
