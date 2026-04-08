"use client";

import type { Shot } from "@/types/storyboard";

interface ShotGridProps {
  shots: Shot[];
  selectedShotIds: Set<string>;
  onSelectShot: (shotId: string) => void;
  onRegenerateImage: (shotId: string) => void;
  onRegenerateVideo: (shotId: string) => void;
  onRefresh: () => void;
}

export function ShotGrid({
  shots,
  selectedShotIds,
  onSelectShot,
  onRegenerateImage,
  onRegenerateVideo,
  onRefresh,
}: ShotGridProps) {
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
              d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1-1v14a1 1 0 001-1 1z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
          没有分镜
        </h3>
        <p className="text-zinc-500 dark:text-zinc-400">
          请先在分镜设计页面创建分镜
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {shots.map((shot, index) => (
        <div
          key={shot.id}
          onClick={() => onSelectShot(shot.id)}
          className={`
            relative group cursor-pointer rounded-lg border-2 overflow-hidden transition-all
            ${
              selectedShotIds.has(shot.id)
                ? "border-blue-500 ring-2 ring-blue-500/20"
                : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
            }
          `}
        >
          {/* Shot Number */}
          <div className="absolute top-2 left-2 z-10">
            <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-medium bg-zinc-900/80 text-white rounded">
              {index + 1}
            </span>
          </div>

          {/* Actions */}
          <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerateImage(shot.id);
                }}
                className="p-1 bg-white/90 dark:bg-zinc-800/90 rounded hover:bg-white dark:hover:bg-zinc-700 transition-colors"
                title="重新生成图片"
              >
                <svg
                  className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5a1 1 0 011-1 1h14a1 1 0 011-1 9v2a1 1 0 00-2-2H5a1 1 0 00-2 2v6a1 1 0 001 1 1z"
                  />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerateVideo(shot.id);
                }}
                disabled={!shot.imageUrl}
                className="p-1 bg-white/90 dark:bg-zinc-800/90 rounded hover:bg-white dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                title="重新生成视频"
              >
                <svg
                  className={`w-3.5 h-3.5 ${
                    shot.imageUrl
                      ? "text-purple-600 dark:text-purple-400"
                      : "text-zinc-400 dark:text-zinc-600"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276a2 2 0 012-2.828 0L16 8m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2v12a2 2 0 00-2 2h-6a2 2 0 002-2v12a2 2 0 00-2z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Image Preview */}
          <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
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
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2v12a2 2 0 00-2 2h-6a2 2 0 002-2v12a2 2 0 00-2z"
                  />
                </svg>
                <p className="mt-2 text-xs text-zinc-400">暂无图片</p>
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

          {/* Video Preview */}
          {shot.videoUrl && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <video
                src={shot.videoUrl}
                className="w-full h-full object-contain"
                controls
                muted
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRegenerateVideo(shot.id);
                }}
                className="absolute bottom-3 right-3 px-3 py-1.5 bg-white/90 dark:bg-zinc-800/90 rounded-lg text-xs font-medium hover:bg-white dark:hover:bg-zinc-700 transition-colors"
              >
                重新生成
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
