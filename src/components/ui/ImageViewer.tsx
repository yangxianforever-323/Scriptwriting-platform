"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface ImageViewerProps {
  src: string;
  alt?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageViewer({ src, alt = "Image", isOpen, onClose }: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, y: 0 });

  // 重置状态当图片变化时
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      positionRef.current = { x: 0, y: 0 };
    }
  }, [isOpen, src]);

  // 处理滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => {
      const newScale = Math.max(0.1, Math.min(5, prev + delta));
      return newScale;
    });
  }, []);

  // 处理中键按下开始拖动
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault();
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      positionRef.current = { ...position };
    }
  }, [position]);

  // 处理拖动
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      const newPosition = {
        x: positionRef.current.x + dx,
        y: positionRef.current.y + dy
      };
      setPosition(newPosition);
    }
  }, [isDragging]);

  // 处理释放
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 处理中键点击关闭
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault();
    }
  }, []);

  // 处理双击放大/缩小
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(prev => {
      // 如果当前缩放小于1.5，则放大到2倍，否则重置为1
      const newScale = prev < 1.5 ? 2 : 1;
      return newScale;
    });
    // 双击时重置位置到中心
    if (scale < 1.5) {
      setPosition({ x: 0, y: 0 });
      positionRef.current = { x: 0, y: 0 };
    }
  }, [scale]);

  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "+":
        case "=":
          setScale(prev => Math.min(5, prev + 0.2));
          break;
        case "-":
          setScale(prev => Math.max(0.1, prev - 0.2));
          break;
        case "0":
          setScale(1);
          setPosition({ x: 0, y: 0 });
          positionRef.current = { x: 0, y: 0 };
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // 全局鼠标事件
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove as unknown as EventListener);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove as unknown as EventListener);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-zinc-800/80 text-white flex items-center justify-center hover:bg-zinc-700 transition-colors"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* 控制栏 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-zinc-800/80 rounded-full text-white text-sm">
        <button
          onClick={(e) => { e.stopPropagation(); setScale(prev => Math.max(0.1, prev - 0.2)); }}
          className="w-8 h-8 rounded-full bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <span className="min-w-[60px] text-center">{Math.round(scale * 100)}%</span>
        <button
          onClick={(e) => { e.stopPropagation(); setScale(prev => Math.min(5, prev + 0.2)); }}
          className="w-8 h-8 rounded-full bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setScale(1); setPosition({ x: 0, y: 0 }); positionRef.current = { x: 0, y: 0 }; }}
          className="w-8 h-8 rounded-full bg-zinc-700 hover:bg-zinc-600 flex items-center justify-center ml-2"
          title="重置"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* 提示文字 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-zinc-400 text-xs">
        滚轮缩放 · 中键拖动 · 双击放大 · ESC关闭
      </div>

      {/* 图片容器 */}
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onContextMenu={(e) => e.preventDefault()}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-none select-none cursor-pointer"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
          draggable={false}
          onDoubleClick={handleDoubleClick}
        />
      </div>
    </div>
  );
}

// 可点击的图片组件
interface ClickableImageProps {
  src: string;
  alt?: string;
  className?: string;
  onClick?: () => void;
}

export function ClickableImage({ src, alt = "Image", className = "", onClick }: ClickableImageProps) {
  const [viewerOpen, setViewerOpen] = useState(false);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      setViewerOpen(true);
    }
  };

  return (
    <>
      <img
        src={src}
        alt={alt}
        className={`cursor-pointer hover:opacity-90 transition-opacity ${className}`}
        onClick={handleClick}
        draggable={false}
      />
      <ImageViewer
        src={src}
        alt={alt}
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
}
