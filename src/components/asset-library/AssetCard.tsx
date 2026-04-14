"use client";

import { useState } from "react";
import type { Asset } from "@/types/asset";
import { ASSET_CATEGORY_META } from "@/types/asset";

interface AssetCardProps {
  asset: Asset;
  onDelete?: (asset: Asset) => void;
  onEdit?: (asset: Asset) => void;
  onSelect?: (asset: Asset) => void;
  selected?: boolean;
}

export function AssetCard({ asset, onDelete, onEdit, onSelect, selected }: AssetCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [imageError, setImageError] = useState(false);
  const meta = ASSET_CATEGORY_META[asset.category];

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className={`group relative bg-[#1a1a2e] border rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
        selected
          ? "border-purple-500 ring-2 ring-purple-500/30"
          : "border-white/10 hover:border-white/30"
      }`}
      onClick={() => onSelect?.(asset)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-black/40 overflow-hidden">
        {asset.mediaType === "video" ? (
          <video
            src={asset.url}
            className="w-full h-full object-cover"
            muted
            preload="metadata"
          />
        ) : imageError ? (
          <div className="w-full h-full flex items-center justify-center text-white/30">
            <span className="text-4xl">{meta.icon}</span>
          </div>
        ) : (
          <img
            src={asset.url}
            alt={asset.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        )}

        {/* Overlay badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          <span className="px-1.5 py-0.5 text-xs bg-black/60 text-white/80 rounded backdrop-blur-sm">
            {meta.icon} {meta.label}
          </span>
        </div>

        {asset.source === "ai_generated" && (
          <div className="absolute top-2 right-2">
            <span className="px-1.5 py-0.5 text-xs bg-purple-600/80 text-white rounded backdrop-blur-sm">
              AI
            </span>
          </div>
        )}

        {asset.mediaType === "video" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 bg-black/60 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}

        {/* Hover actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {onEdit && (
            <button
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded transition-colors"
              onClick={(e) => { e.stopPropagation(); onEdit(asset); }}
            >
              编辑
            </button>
          )}
          {onDelete && (
            <button
              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/40 text-red-300 text-sm rounded transition-colors"
              onClick={(e) => { e.stopPropagation(); onDelete(asset); }}
            >
              删除
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="text-sm text-white font-medium truncate">{asset.name}</p>
        {asset.description && (
          <p className="text-xs text-white/50 truncate mt-0.5">{asset.description}</p>
        )}

        <div className="flex items-center justify-between mt-1.5">
          <span className="text-xs text-white/40">{formatSize(asset.sizeBytes)}</span>
          <span className="text-xs text-white/40">{formatDate(asset.createdAt)}</span>
        </div>

        {asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {asset.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-xs bg-white/5 text-white/50 rounded"
              >
                {tag}
              </span>
            ))}
            {asset.tags.length > 3 && (
              <span className="text-xs text-white/30">+{asset.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Selected indicator */}
      {selected && (
        <div className="absolute top-2 left-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
}
