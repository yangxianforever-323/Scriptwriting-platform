"use client";

import { useState, useEffect } from "react";
import type { Storyboard, Shot } from "@/types/storyboard";
import { storyboardDb, shotDb } from "@/lib/db/storyboard";
import { Spinner } from "@/components/ui/Spinner";

interface VersionManagerProps {
  projectId: string;
  currentStoryboard: Storyboard;
  onClose: () => void;
  onSwitchVersion: (storyboard: Storyboard, shots: Shot[]) => void;
}

export function VersionManager({
  projectId,
  currentStoryboard,
  onClose,
  onSwitchVersion,
}: VersionManagerProps) {
  const [storyboards, setStoryboards] = useState<Storyboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [newVersionName, setNewVersionName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadStoryboards();
  }, [projectId]);

  const loadStoryboards = () => {
    const boards = storyboardDb.getByProjectId(projectId);
    setStoryboards(boards);
    setLoading(false);
  };

  const handleCreateVersion = () => {
    if (!newVersionName.trim()) return;

    setIsCreating(true);
    const newStoryboard = storyboardDb.create(projectId, {
      name: newVersionName,
      description: `创建于 ${new Date().toLocaleDateString("zh-CN")}`,
    });

    setStoryboards([newStoryboard, ...storyboards]);
    setNewVersionName("");
    setIsCreating(false);
  };

  const handleDuplicateVersion = (storyboardId: string) => {
    const duplicated = storyboardDb.duplicate(storyboardId);
    if (duplicated) {
      loadStoryboards();
    }
  };

  const handleDeleteVersion = (storyboardId: string) => {
    if (storyboards.length <= 1) {
      alert("至少保留一个版本");
      return;
    }
    if (!confirm("确定要删除这个版本吗？此操作不可恢复。")) return;

    storyboardDb.delete(storyboardId);
    loadStoryboards();
  };

  const handleSwitchVersion = (storyboardId: string) => {
    const activated = storyboardDb.setActive(storyboardId);
    if (activated) {
      const shots = shotDb.getByStoryboardId(activated.id);
      onSwitchVersion(activated, shots);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-8">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              版本管理
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              管理分镜的不同版本
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Create New Version */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
            创建新版本
          </h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={newVersionName}
              onChange={(e) => setNewVersionName(e.target.value)}
              placeholder="输入版本名称..."
              className="flex-1 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleCreateVersion}
              disabled={!newVersionName.trim() || isCreating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isCreating ? "创建中..." : "创建"}
            </button>
          </div>
        </div>

        {/* Version List */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
            所有版本 ({storyboards.length})
          </h3>
          <div className="space-y-3">
            {storyboards.map((sb) => (
              <div
                key={sb.id}
                className={`
                  flex items-center justify-between p-4 rounded-lg border transition-colors
                  ${sb.isActive
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                  }
                `}
              >
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[60px]">
                    <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      v{sb.version}
                    </div>
                    {sb.isActive && (
                      <span className="text-xs text-blue-600 dark:text-blue-400">
                        当前
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-zinc-900 dark:text-zinc-100">
                      {sb.name}
                    </h4>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {sb.shotCount} 个分镜 · {new Date(sb.createdAt).toLocaleDateString("zh-CN")}
                    </p>
                    {sb.description && (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                        {sb.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!sb.isActive && (
                    <button
                      onClick={() => handleSwitchVersion(sb.id)}
                      className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      切换
                    </button>
                  )}
                  <button
                    onClick={() => handleDuplicateVersion(sb.id)}
                    className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    title="复制"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteVersion(sb.id)}
                    className="p-1.5 text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="删除"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
