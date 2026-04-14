"use client";

import { useState, useRef } from "react";
import type { Shot } from "@/types/storyboard";
import type { Story } from "@/types/story";

interface ShotListProps {
  shots: Shot[];
  story: Story | null;
  viewMode: "grid" | "list" | "timeline";
  selectedShotId: string | null;
  onSelectShot: (shot: Shot) => void;
  onShotDoubleClick?: (shot: Shot) => void;
  onUpdateShots: (shots: Shot[]) => void;
  storyboardId?: string;
  projectId: string;
}

export function ShotList({
  shots,
  story,
  viewMode,
  selectedShotId,
  onSelectShot,
  onShotDoubleClick,
  onUpdateShots,
  storyboardId,
  projectId,
}: ShotListProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragItemRef = useRef<Shot | null>(null);

  const handleAddShot = async () => {
    const sbId = storyboardId || shots[0]?.storyboardId;
    if (!sbId) return;

    const res = await fetch(`/api/projects/${projectId}/shots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storyboardId: sbId,
        title: `分镜 ${shots.length + 1}`,
        description: "",
        duration: 6,
      }),
    });
    if (!res.ok) return;
    const newShot: Shot = await res.json();
    onUpdateShots([...shots, newShot]);
    onSelectShot(newShot);
  };

  const handleDeleteShot = async (shotId: string) => {
    await fetch(`/api/projects/${projectId}/shots/${shotId}`, { method: "DELETE" });
    onUpdateShots(shots.filter((s) => s.id !== shotId));
  };

  const handleDuplicateShot = async (shot: Shot) => {
    const res = await fetch(`/api/projects/${projectId}/shots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storyboardId: shot.storyboardId,
        title: `${shot.title} (复制)`,
        description: shot.description,
        duration: shot.duration,
        shotType: shot.shotType,
        shotTypeName: shot.shotTypeName,
        imageStatus: "pending",
        videoStatus: "pending",
      }),
    });
    if (!res.ok) return;
    const newShot: Shot = await res.json();
    onUpdateShots([...shots, newShot]);
  };

  const handleGenerateFromStory = async () => {
    if (!story || !storyboardId) return;

    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/generate-storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId: story.id,
          storyboardId: storyboardId,
          options: {
            shotsPerScene: 3,
            includeDialogue: true,
          },
        }),
      });

      if (!response.ok) throw new Error("生成失败");

      // Reload shots from API
      const boardRes = await fetch(`/api/projects/${projectId}/storyboard-data`);
      if (boardRes.ok) {
        const boardData = await boardRes.json();
        onUpdateShots(boardData.shots || []);
      }
    } catch (error) {
      console.error("Error generating from story:", error);
      alert("生成失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    dragItemRef.current = shots[index];
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));

    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.opacity = "0.5";
    dragImage.style.transform = "scale(1.02)";
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 75, 75);

    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newShots = [...shots];
    const [removed] = newShots.splice(draggedIndex, 1);
    newShots.splice(dropIndex, 0, removed);

    const sbId = shots[0]?.storyboardId;
    if (sbId) {
      const shotIds = newShots.map((s) => s.id);
      await fetch(`/api/projects/${projectId}/shots/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storyboardId: sbId, shotIds }),
      });
    }

    onUpdateShots(newShots);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragItemRef.current = null;
  };

  const getStatusBadge = (shot: Shot) => {
    if (shot.imageStatus === "completed" && shot.videoStatus === "completed") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          完成
        </span>
      );
    }
    if (
      shot.imageStatus === "generating" ||
      shot.videoStatus === "generating"
    ) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 animate-pulse">
          生成中
        </span>
      );
    }
    if (shot.imageStatus === "failed" || shot.videoStatus === "failed") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          失败
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
        待处理
      </span>
    );
  };

  if (shots.length === 0) {
    return (
      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-12 text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          还没有分镜
        </h3>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">
          从故事场景自动生成，或手动创建分镜
        </p>
        <div className="flex justify-center gap-3">
          {story && (
            <button
              onClick={handleGenerateFromStory}
              disabled={isGenerating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isGenerating ? "生成中..." : "从故事生成"}
            </button>
          )}
          <button
            onClick={handleAddShot}
            className="px-4 py-2 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
          >
            手动创建
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            共 {shots.length} 个分镜
          </span>
          <span className="text-sm text-zinc-400 dark:text-zinc-500">
            总时长: {Math.round(shots.reduce((acc, s) => acc + s.duration, 0))}秒
          </span>
        </div>
        <div className="flex items-center gap-2">
          {story && (
            <button
              onClick={handleGenerateFromStory}
              disabled={isGenerating}
              className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50 transition-colors"
            >
              {isGenerating ? "生成中..." : "从故事生成"}
            </button>
          )}
          <button
            onClick={handleAddShot}
            className="px-3 py-1.5 text-sm bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加分镜
          </button>
        </div>
      </div>

      {/* Drag hint */}
      <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 px-1">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
        拖拽分镜卡片可调整顺序
      </div>

      {/* Shot Grid with Drag and Drop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {shots.map((shot, index) => (
          <div
            key={shot.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            onClick={() => onSelectShot(shot)}
            onDoubleClick={() => onShotDoubleClick?.(shot)}
            className={`
              relative group cursor-pointer rounded-lg border-2 overflow-hidden transition-all
              ${
                selectedShotId === shot.id
                  ? "border-blue-500 ring-2 ring-blue-500/20"
                  : draggedIndex === index
                  ? "border-blue-400 opacity-50 scale-[0.98]"
                  : dragOverIndex === index
                  ? "border-blue-400 border-dashed bg-blue-50/50 dark:bg-blue-900/10"
                  : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
              }
              ${draggedIndex !== null ? "transition-all duration-200" : ""}
            `}
          >
            {/* Shot Number */}
            <div className="absolute top-2 left-2 z-10">
              <span
                className={`inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded ${
                  draggedIndex === index
                    ? "bg-blue-500 text-white"
                    : "bg-zinc-900/80 text-white"
                }`}
              >
                <svg
                  className={`w-3 h-3 mr-0.5 ${draggedIndex === index ? "" : "opacity-60"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8h16M4 16h16"
                  />
                </svg>
                {index + 1}
              </span>
            </div>

            {/* Actions */}
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicateShot(shot);
                  }}
                  className="p-1 bg-white/90 dark:bg-zinc-800/90 rounded hover:bg-white dark:hover:bg-zinc-700 transition-colors"
                  title="复制"
                >
                  <svg
                    className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteShot(shot.id);
                  }}
                  className="p-1 bg-white/90 dark:bg-zinc-800/90 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                  title="删除"
                >
                  <svg
                    className="w-3.5 h-3.5 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Image Preview */}
            <div
              className={`aspect-video bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center ${
                draggedIndex === index ? "opacity-30" : ""
              }`}
            >
              {shot.imageUrl ? (
                <img
                  src={shot.imageUrl}
                  alt={shot.title}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              ) : (
                <div className="text-center p-4">
                  <svg
                    className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Shot Info */}
            <div className="p-3">
              <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                {shot.title}
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                {shot.description || "暂无描述"}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {shot.duration}s
                </span>
                {getStatusBadge(shot)}
              </div>
            </div>
          </div>
        ))}

        {/* Add Button */}
        <button
          onClick={handleAddShot}
          className="aspect-[4/5] rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center gap-2 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
        >
          <svg
            className="w-8 h-8 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            添加分镜
          </span>
        </button>
      </div>
    </div>
  );
}
