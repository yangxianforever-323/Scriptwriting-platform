"use client";

import { useState } from "react";
import type { Asset } from "@/types/asset";
import { ASSET_CATEGORY_META } from "@/types/asset";

interface AssetDetailProps {
  asset: Asset;
  onClose: () => void;
  onUpdate: (updates: Partial<Asset>) => Promise<void>;
  onDelete: (asset: Asset) => void;
}

export function AssetDetail({ asset, onClose, onUpdate, onDelete }: AssetDetailProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(asset.name);
  const [description, setDescription] = useState(asset.description);
  const [tagsInput, setTagsInput] = useState(asset.tags.join(", "));
  const [saving, setSaving] = useState(false);

  const meta = ASSET_CATEGORY_META[asset.category];

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({
        name: name.trim(),
        description: description.trim(),
        tags: tagsInput.split(",").map((t) => t.trim()).filter(Boolean),
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#12122a] border border-white/10 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">{meta.icon}</span>
            <div>
              <h2 className="text-white font-semibold">{asset.name}</h2>
              <p className="text-xs text-white/40">{meta.label}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-0 overflow-hidden flex-1">
          {/* Preview */}
          <div className="md:w-1/2 bg-black flex items-center justify-center p-4">
            {asset.mediaType === "video" ? (
              <video src={asset.url} controls className="max-w-full max-h-64 rounded" />
            ) : (
              <img
                src={asset.url}
                alt={asset.name}
                className="max-w-full max-h-64 rounded object-contain"
              />
            )}
          </div>

          {/* Info */}
          <div className="md:w-1/2 p-4 overflow-y-auto space-y-4">
            {editing ? (
              <>
                <div>
                  <label className="text-xs text-white/50 block mb-1">名称</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 block mb-1">描述</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-400 resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/50 block mb-1">标签（逗号分隔）</label>
                  <input
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="flex-1 py-2 border border-white/20 text-white/70 rounded-lg text-sm hover:border-white/40 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {saving ? "保存中..." : "保存"}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* File info */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">文件大小</span>
                    <span className="text-white/80">{formatSize(asset.sizeBytes)}</span>
                  </div>
                  {asset.width && asset.height && (
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">尺寸</span>
                      <span className="text-white/80">{asset.width} × {asset.height}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">来源</span>
                    <span className={`${asset.source === "ai_generated" ? "text-purple-400" : "text-blue-400"}`}>
                      {asset.source === "ai_generated" ? "AI 生成" : "用户上传"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">版本</span>
                    <span className="text-white/80">v{asset.version}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/40">创建时间</span>
                    <span className="text-white/80">
                      {new Date(asset.createdAt).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                </div>

                {asset.description && (
                  <div>
                    <p className="text-xs text-white/40 mb-1">描述</p>
                    <p className="text-sm text-white/70">{asset.description}</p>
                  </div>
                )}

                {asset.tags.length > 0 && (
                  <div>
                    <p className="text-xs text-white/40 mb-1.5">标签</p>
                    <div className="flex flex-wrap gap-1.5">
                      {asset.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-xs bg-white/5 border border-white/10 text-white/60 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {asset.generationPrompt && (
                  <div>
                    <p className="text-xs text-white/40 mb-1">生成提示词</p>
                    <p className="text-xs text-white/50 bg-white/5 rounded p-2 font-mono">
                      {asset.generationPrompt}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  <a
                    href={asset.url}
                    download={asset.filename}
                    className="flex items-center justify-center gap-2 w-full py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-lg text-sm transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    下载
                  </a>
                  <button
                    onClick={() => setEditing(true)}
                    className="w-full py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-lg text-sm transition-colors"
                  >
                    编辑信息
                  </button>
                  <button
                    onClick={() => onDelete(asset)}
                    className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-colors"
                  >
                    删除素材
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
