"use client";

import { create } from "zustand";
import type { Asset, AssetCategory, AssetFilter } from "@/types/asset";

interface AssetState {
  assets: Asset[];
  loading: boolean;
  uploading: boolean;
  error: string | null;
  filter: AssetFilter;
  currentProjectId: string | null;

  // Actions
  fetchAssets: (projectId: string, filter?: AssetFilter) => Promise<void>;
  uploadAsset: (
    projectId: string,
    file: File,
    meta: {
      category: AssetCategory;
      name: string;
      description?: string;
      tags?: string[];
      linkedEntityId?: string;
      linkedEntityType?: string;
    }
  ) => Promise<Asset | null>;
  updateAsset: (assetId: string, updates: Partial<Asset>) => Promise<void>;
  deleteAsset: (assetId: string) => Promise<void>;
  setFilter: (filter: AssetFilter) => void;
  clearFilter: () => void;
  getByCategory: (category: AssetCategory) => Asset[];
  getByLinkedEntity: (entityId: string) => Asset[];
  clearError: () => void;
}

export const useAssetStore = create<AssetState>((set, get) => ({
  assets: [],
  loading: false,
  uploading: false,
  error: null,
  filter: {},
  currentProjectId: null,

  fetchAssets: async (projectId: string, filter?: AssetFilter) => {
    set({ loading: true, error: null, currentProjectId: projectId });
    try {
      const params = new URLSearchParams();
      const f = filter || get().filter;
      if (f.category) params.set("category", f.category);
      if (f.mediaType) params.set("mediaType", f.mediaType);
      if (f.source) params.set("source", f.source);
      if (f.linkedEntityId) params.set("linkedEntityId", f.linkedEntityId);
      if (f.search) params.set("search", f.search);
      if (f.tags?.length) params.set("tags", f.tags.join(","));

      const res = await fetch(
        `/api/projects/${projectId}/assets?${params.toString()}`
      );
      if (!res.ok) throw new Error("获取素材失败");
      const data = await res.json();
      set({ assets: data.assets, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "未知错误",
        loading: false,
      });
    }
  },

  uploadAsset: async (projectId, file, meta) => {
    set({ uploading: true, error: null });
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", meta.category);
      formData.append("name", meta.name);
      if (meta.description) formData.append("description", meta.description);
      if (meta.tags?.length) formData.append("tags", meta.tags.join(","));
      if (meta.linkedEntityId) formData.append("linkedEntityId", meta.linkedEntityId);
      if (meta.linkedEntityType) formData.append("linkedEntityType", meta.linkedEntityType);

      const res = await fetch(`/api/projects/${projectId}/assets`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("上传失败");
      const data = await res.json();

      // Add to local state
      set((state) => ({
        assets: [data.asset, ...state.assets],
        uploading: false,
      }));
      return data.asset as Asset;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "上传失败",
        uploading: false,
      });
      return null;
    }
  },

  updateAsset: async (assetId, updates) => {
    try {
      const state = get();
      const asset = state.assets.find((a) => a.id === assetId);
      if (!asset) return;

      const res = await fetch(
        `/api/projects/${asset.projectId}/assets/${assetId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }
      );
      if (!res.ok) throw new Error("更新失败");
      const data = await res.json();

      set((state) => ({
        assets: state.assets.map((a) => (a.id === assetId ? data.asset : a)),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "更新失败" });
    }
  },

  deleteAsset: async (assetId) => {
    try {
      const state = get();
      const asset = state.assets.find((a) => a.id === assetId);
      if (!asset) return;

      const res = await fetch(
        `/api/projects/${asset.projectId}/assets/${assetId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("删除失败");

      set((state) => ({
        assets: state.assets.filter((a) => a.id !== assetId),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "删除失败" });
    }
  },

  setFilter: (filter) => {
    set({ filter });
    const { currentProjectId } = get();
    if (currentProjectId) {
      get().fetchAssets(currentProjectId, filter);
    }
  },

  clearFilter: () => {
    set({ filter: {} });
    const { currentProjectId } = get();
    if (currentProjectId) {
      get().fetchAssets(currentProjectId, {});
    }
  },

  getByCategory: (category) => {
    return get().assets.filter((a) => a.category === category);
  },

  getByLinkedEntity: (entityId) => {
    return get().assets.filter((a) => a.linkedEntityId === entityId);
  },

  clearError: () => set({ error: null }),
}));
