"use client";

interface ProductionToolbarProps {
  stats: {
    total: number;
    imagesCompleted: number;
    imagesPending: number;
    imagesGenerating: number;
    imagesFailed: number;
    videosCompleted: number;
    videosPending: number;
    videosGenerating: number;
    videosFailed: number;
  };
  selectedCount: number;
  totalCount: number;
  viewMode: "grid" | "timeline";
  onViewModeChange: (mode: "grid" | "timeline") => void;
  onSelectAll: () => void;
  onBatchGenerateImages: (options?: { style?: string }) => void;
  onBatchGenerateVideos: (options?: {}) => void;
}

export function ProductionToolbar({
  stats,
  selectedCount,
  totalCount,
  viewMode,
  onViewModeChange,
  onSelectAll,
  onBatchGenerateImages,
  onBatchGenerateVideos,
}: ProductionToolbarProps) {
  const imageProgress =
    stats.total > 0
      ? Math.round((stats.imagesCompleted / stats.total) * 100)
      : 0;
  const videoProgress =
    stats.imagesCompleted > 0
      ? Math.round(
          (stats.videosCompleted / stats.imagesCompleted) * 100
        )
      : 0;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Stats */}
        <div className="flex flex-wrap items-center gap-6">
          {/* Image Stats */}
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                imageProgress === 100
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-blue-50 dark:bg-blue-900/20"
              }`}
            >
              <svg
                className={`w-5 h-5 ${
                  imageProgress === 100
                    ? "text-green-600 dark:text-green-400"
                    : "text-blue-600 dark:text-blue-400"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                图片 {stats.imagesCompleted}/{stats.total}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-24 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${imageProgress}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-500">{imageProgress}%</span>
              </div>
            </div>
          </div>

          {/* Video Stats */}
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                videoProgress === 100 && stats.videosCompleted > 0
                  ? "bg-green-100 dark:bg-green-900/30"
                  : "bg-purple-50 dark:bg-purple-900/20"
              }`}
            >
              <svg
                className={`w-5 h-5 ${
                  videoProgress === 100 && stats.videosCompleted > 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-purple-600 dark:text-purple-400"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                视频 {stats.videosCompleted}/{stats.imagesCompleted || 0}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-24 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full transition-all duration-300"
                    style={{ width: `${videoProgress}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-500">{videoProgress}%</span>
              </div>
            </div>
          </div>

          {/* Status Summary */}
          {(stats.imagesFailed > 0 || stats.videosFailed > 0) && (
            <div className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                {stats.imagesFailed + stats.videosFailed} 个失败
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange("grid")}
              className={`p-2 rounded transition-colors ${
                viewMode === "grid"
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
              title="网格视图"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => onViewModeChange("timeline")}
              className={`p-2 rounded transition-colors ${
                viewMode === "timeline"
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
              title="时间线视图"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          {/* Select All */}
          <button
            onClick={onSelectAll}
            className="px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            {selectedCount === totalCount ? "取消全选" : `全选 (${selectedCount}/${totalCount})`}
          </button>

          {/* Batch Generate Buttons */}
          <button
            onClick={() => onBatchGenerateImages()}
            disabled={stats.total === 0}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            批量生成图片
            {stats.imagesPending > 0 && (
              <span className="px-1.5 py-0.5 bg-blue-700 rounded text-xs">
                {stats.imagesPending}
              </span>
            )}
          </button>

          <button
            onClick={() => onBatchGenerateVideos()}
            disabled={stats.imagesCompleted === 0}
            className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            批量生成视频
            {stats.videosPending > 0 && (
              <span className="px-1.5 py-0.5 bg-purple-700 rounded text-xs">
                {stats.videosPending}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
