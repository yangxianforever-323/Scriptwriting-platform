"use client";

import type { GenerationTask } from "../page";

interface GenerationQueueProps {
  queue: GenerationTask[];
  onCancelTask: (taskId: string) => void;
}

export function GenerationQueue({ queue, onCancelTask }: GenerationQueueProps) {
  const pending = queue.filter((t) => t.status === "pending");
  const processing = queue.filter((t) => t.status === "processing");
  const completed = queue.filter((t) => t.status === "completed");
  const failed = queue.filter((t) => t.status === "failed");

  if (queue.length === 0) return null;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden mb-6">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg
              className={`w-5 h-5 text-blue-600 dark:text-blue-400 ${
                processing.length > 0 ? "animate-spin" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {processing.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
            )}
          </div>
          <div>
            <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
              生成队列
            </p>
            <p className="text-xs text-zinc-500">
              共 {queue.length} 个任务 · {completed.length} 完成
              {failed.length > 0 && ` · ${failed.length} 失败`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-500">
          {pending.length > 0 && (
            <span>等待中: {pending.length}</span>
          )}
          {processing.length > 0 && (
            <span className="text-blue-600 dark:text-blue-400">处理中: {processing.length}</span>
          )}
        </div>
      </div>

      {/* Task List */}
      <div className="max-h-48 overflow-y-auto p-3 space-y-2">
        {queue.map((task) => (
          <div
            key={task.id}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
              ${
                task.status === "completed"
                  ? "bg-green-50 dark:bg-green-900/10"
                  : task.status === "failed"
                  ? "bg-red-50 dark:bg-red-900/10"
                  : task.status === "processing"
                  ? "bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800"
                  : "bg-zinc-50 dark:bg-zinc-800"
              }
            `}
          >
            {/* Icon */}
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                task.type === "image"
                  ? "bg-blue-100 dark:bg-blue-900/30"
                  : "bg-purple-100 dark:bg-purple-900/30"
              }`}
            >
              {task.status === "pending" && (
                <svg
                  className={`w-4 h-4 ${
                    task.type === "image"
                      ? "text-blue-600 dark:text-blue-400"
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}

              {task.status === "processing" && (
                <svg
                  className={`w-4 h-4 animate-spin ${
                    task.type === "image"
                      ? "text-blue-600 dark:text-blue-400"
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
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              )}

              {task.status === "completed" && (
                <svg
                  className="w-4 h-4 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}

              {task.status === "failed" && (
                <svg
                  className="w-4 h-4 text-red-600 dark:text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {task.title}
                </p>
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-medium rounded flex-shrink-0 ${
                    task.type === "image"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                  }`}
                >
                  {task.type === "image" ? "图片" : "视频"}
                </span>
              </div>

              {task.status === "processing" && (
                <div className="mt-1.5 w-full h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"
                    style={{ width: "60%" }}
                  />
                </div>
              )}

              {task.status === "failed" && task.error && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400 truncate">
                  {task.error}
                </p>
              )}

              {task.status === "completed" && task.resultUrl && (
                <button
                  onClick={() => window.open(task.resultUrl, "_blank")}
                  className="mt-1 text-xs text-green-600 dark:text-green-400 hover:underline flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  查看结果
                </button>
              )}
            </div>

            {/* Cancel Button */}
            {(task.status === "pending" || task.status === "failed") && (
              <button
                onClick={() => onCancelTask(task.id)}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors flex-shrink-0"
                title="取消任务"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
