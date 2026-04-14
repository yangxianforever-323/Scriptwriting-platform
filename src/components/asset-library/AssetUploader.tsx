"use client";

import { useState, useRef, useCallback } from "react";
import type { AssetCategory } from "@/types/asset";
import { ASSET_CATEGORY_META } from "@/types/asset";

interface AssetUploaderProps {
  projectId: string;
  defaultCategory?: AssetCategory;
  onUpload: (
    file: File,
    meta: {
      category: AssetCategory;
      name: string;
      description: string;
      tags: string[];
      linkedEntityId?: string;
    }
  ) => Promise<void>;
  onClose: () => void;
  linkedEntityId?: string;
  linkedEntityType?: string;
}

const UPLOADABLE_CATEGORIES: AssetCategory[] = [
  "style_reference",
  "character",
  "location",
  "prop",
];

export function AssetUploader({
  defaultCategory = "style_reference",
  onUpload,
  onClose,
  linkedEntityId,
}: AssetUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [category, setCategory] = useState<AssetCategory>(defaultCategory);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setName(f.name.replace(/\.[^.]+$/, ""));
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleSubmit = async () => {
    if (!file || !name.trim()) return;
    setUploading(true);
    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      await onUpload(file, {
        category,
        name: name.trim(),
        description: description.trim(),
        tags,
        linkedEntityId,
      });
      onClose();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#12122a] border border-white/10 rounded-xl w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-white font-semibold">上传素材</h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              dragging
                ? "border-purple-400 bg-purple-500/10"
                : "border-white/20 hover:border-white/40"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="预览"
                  className="max-h-40 mx-auto rounded object-contain"
                />
                <p className="text-xs text-white/40 mt-2">{file?.name}</p>
              </div>
            ) : (
              <>
                <div className="text-3xl mb-2">📁</div>
                <p className="text-white/60 text-sm">拖拽文件到此处，或点击选择</p>
                <p className="text-white/30 text-xs mt-1">支持 JPG、PNG、WebP、MP4</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-sm text-white/60 block mb-1.5">素材分类</label>
            <div className="grid grid-cols-2 gap-2">
              {UPLOADABLE_CATEGORIES.map((cat) => {
                const meta = ASSET_CATEGORY_META[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors text-left ${
                      category === cat
                        ? "border-purple-500 bg-purple-500/10 text-white"
                        : "border-white/10 text-white/60 hover:border-white/30"
                    }`}
                  >
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-sm text-white/60 block mb-1.5">名称 *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="素材名称"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-400 placeholder-white/30"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm text-white/60 block mb-1.5">描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简短描述（可选）"
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-400 placeholder-white/30 resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm text-white/60 block mb-1.5">标签</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="用逗号分隔，如：主角, 室内, 夜景"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-400 placeholder-white/30"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2 border border-white/20 text-white/70 rounded-lg text-sm hover:border-white/40 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!file || !name.trim() || uploading}
              className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
            >
              {uploading ? "上传中..." : "确认上传"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
