"use client";

import { useState, useEffect, useCallback } from "react";
import { useAssetStore } from "@/store/asset-store";
import { AssetCard } from "./AssetCard";
import { AssetUploader } from "./AssetUploader";
import { AssetDetail } from "./AssetDetail";
import type { Asset, AssetCategory } from "@/types/asset";
import { ASSET_CATEGORY_META } from "@/types/asset";

const CATEGORIES: AssetCategory[] = [
  "style_reference",
  "character",
  "location",
  "prop",
  "generated_image",
  "generated_video",
];

interface AssetLibraryProps {
  projectId: string;
  defaultCategory?: AssetCategory;
  selectable?: boolean;
  onSelect?: (asset: Asset) => void;
}

export function AssetLibrary({
  projectId,
  defaultCategory,
  selectable = false,
  onSelect,
}: AssetLibraryProps) {
  const { assets, loading, uploading, fetchAssets, uploadAsset, updateAsset, deleteAsset } =
    useAssetStore();

  const [activeCategory, setActiveCategory] = useState<AssetCategory | "all">(
    defaultCategory || "all"
  );
  const [search, setSearch] = useState("");
  const [showUploader, setShowUploader] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Asset | null>(null);

  useEffect(() => {
    fetchAssets(projectId);
  }, [projectId, fetchAssets]);

  const filteredAssets = assets.filter((a) => {
    if (activeCategory !== "all" && a.category !== activeCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const countByCategory = useCallback(
    (cat: AssetCategory) => assets.filter((a) => a.category === cat).length,
    [assets]
  );

  const handleUpload = async (
    file: File,
    meta: {
      category: AssetCategory;
      name: string;
      description: string;
      tags: string[];
      linkedEntityId?: string;
    }
  ) => {
    await uploadAsset(projectId, file, meta);
    setShowUploader(false);
  };

  const handleDelete = async (asset: Asset) => {
    await deleteAsset(asset.id);
    setDetailAsset(null);
    setConfirmDelete(null);
    setSelectedAsset(null);
  };

  const handleCardSelect = (asset: Asset) => {
    if (selectable && onSelect) {
      setSelectedAsset(asset);
      onSelect(asset);
    } else {
      setDetailAsset(asset);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d1f]">
      {/* Top toolbar */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2 border-b border-white/10">
        <div className="flex items-center gap-3">
          <h2 className="text-white font-semibold text-base">素材库</h2>
          <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
            {assets.length} 个素材
          </span>
          <div className="flex-1" />
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索素材..."
              className="pl-8 pr-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-400 w-44"
            />
          </div>
          {/* Upload button */}
          <button
            onClick={() => setShowUploader(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors font-medium"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            上传素材
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 mt-3 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveCategory("all")}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              activeCategory === "all"
                ? "bg-purple-600 text-white"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            全部 <span className="text-xs opacity-70">({assets.length})</span>
          </button>
          {CATEGORIES.map((cat) => {
            const meta = ASSET_CATEGORY_META[cat];
            const count = countByCategory(cat);
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  activeCategory === cat
                    ? "bg-purple-600 text-white"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
                {count > 0 && (
                  <span className="text-xs opacity-70">({count})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Asset grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-video bg-white/5 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="text-4xl mb-3">
              {activeCategory === "all" ? "📁" : ASSET_CATEGORY_META[activeCategory as AssetCategory]?.icon}
            </div>
            <p className="text-white/40 text-sm">
              {search ? `没有找到包含"${search}"的素材` : "还没有素材，点击上传添加"}
            </p>
            {!search && (
              <button
                onClick={() => setShowUploader(true)}
                className="mt-3 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded-lg text-sm transition-colors"
              >
                立即上传
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredAssets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                selected={selectable && selectedAsset?.id === asset.id}
                onSelect={handleCardSelect}
                onEdit={(a) => setDetailAsset(a)}
                onDelete={(a) => setConfirmDelete(a)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showUploader && (
        <AssetUploader
          projectId={projectId}
          defaultCategory={activeCategory !== "all" && activeCategory !== "generated_image" && activeCategory !== "generated_video"
            ? activeCategory
            : "style_reference"
          }
          onUpload={handleUpload}
          onClose={() => setShowUploader(false)}
        />
      )}

      {detailAsset && (
        <AssetDetail
          asset={detailAsset}
          onClose={() => setDetailAsset(null)}
          onUpdate={async (updates) => {
            await updateAsset(detailAsset.id, updates);
            // Refresh detail view
            setDetailAsset((prev) => prev ? { ...prev, ...updates } : null);
          }}
          onDelete={(a) => {
            setDetailAsset(null);
            setConfirmDelete(a);
          }}
        />
      )}

      {/* Confirm delete dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-[#12122a] border border-white/10 rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-white font-semibold mb-2">确认删除</h3>
            <p className="text-white/60 text-sm mb-4">
              确定要删除「{confirmDelete.name}」吗？此操作不可撤销，文件也将被永久删除。
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2 border border-white/20 text-white/70 rounded-lg text-sm hover:border-white/40 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
