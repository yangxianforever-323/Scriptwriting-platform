"use client";

import { useState } from "react";
import type { Shot } from "@/types/storyboard";

interface TimelinePreviewProps {
  shots: Shot[];
  onRegenerateImage: (shotId: string) => void;
  onRegenerateVideo: (shotId: string) => void;
}

export function TimelinePreview({
  shots,
  onRegenerateImage,
  onRegenerateVideo,
}: TimelinePreviewProps) {
  const [selectedShot, setSelectedShot] = useState<Shot | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const totalDuration = shots.reduce((acc, s) => acc + s.duration, 0);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div>
          <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
            时间线预览
          </h3>
          <p className="text-sm text-zinc-500 mt-0.5">
            总时长: {totalDuration}秒 ({Math.round(totalDuration / 60)}:{String(
              Math.round(totalDuration % 60)
            ).padStart(2, "0")})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
          <span className="text-xs text-zinc-500 px-2">
            {shots.filter((s) => s.imageStatus === "completed").length}/
            {shots.length} 图片 ·{" "}
            {shots.filter((s) => s.videoStatus === "completed").length}/
            {shots.filter((s) => s.imageStatus === "completed").length} 视频
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-5 overflow-x-auto">
        {/* Time Ruler */}
        <div className="relative mb-2 ml-12">
          <div className="flex items-end gap-0 text-[10px] text-zinc-400">
            {Array.from({ length: Math.ceil(totalDuration / 10) + 1 }).map(
              (_, i) => (
                <span key={i} style={{ width: `${(10 / totalDuration) * 100}%` }}>
                  {i * 10}s
                </span>
              )
            )}
          </div>
        </div>

        {/* Shot Timeline */}
        <div className="space-y-2">
          {shots.map((shot, index) => {
            const widthPercent = (shot.duration / totalDuration) * 100;

            return (
              <div
                key={shot.id}
                onClick={() =>
                  setSelectedShot(selectedShot?.id === shot.id ? null : shot)
                }
                className={`group relative flex items-stretch cursor-pointer rounded-lg overflow-hidden transition-all ${
                  selectedShot?.id === shot.id
                    ? "ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/10"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                {/* Shot Index */}
                <div className="w-10 flex-shrink-0 flex items-center justify-center text-xs font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 py-2">
                  #{index + 1}
                </div>

                {/* Shot Bar */}
                <div
                  className="relative flex-shrink-0 h-14 rounded-r-lg overflow-hidden transition-all group-hover:h-16"
                  style={{ width: `${widthPercent}%` }}
                >
                  {/* Background */}
                  <div
                    className={`absolute inset-0 ${
                      shot.imageStatus === "completed"
                        ? "bg-green-500/20 dark:bg-green-500/10"
                        : shot.imageStatus === "generating"
                        ? "bg-yellow-500/20 dark:bg-yellow-500/10 animate-pulse"
                        : shot.imageStatus === "failed"
                        ? "bg-red-500/20 dark:bg-red-500/10"
                        : "bg-zinc-200 dark:bg-zinc-700"
                    }`}
                  />

                  {/* Image Preview */}
                  {shot.imageUrl && (
                    <img
                      src={shot.imageUrl}
                      alt={shot.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                      draggable={false}
                    />
                  )}

                  {/* Video Overlay */}
                  {shot.videoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg
                        className="w-6 h-6 text-white"
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
                  )}

                  {/* Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/70 to-transparent">
                    <p className="text-[10px] font-medium text-white truncate">
                      {shot.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] text-white/80">{shot.duration}s</span>
                      {shot.imageStatus === "completed" && (
                        <span className="inline-flex items-center w-1.5 h-1.5 bg-green-400 rounded-full" />
                      )}
                      {shot.videoStatus === "completed" && (
                        <span className="inline-flex items-center w-1.5 h-1.5 bg-purple-400 rounded-full" />
                      )}
                    </div>
                  </div>

                  {/* Actions (hover) */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    {!shot.imageUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRegenerateImage(shot.id);
                        }}
                        className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        title="生成图片"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                    )}
                    {shot.imageUrl && !shot.videoUrl && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRegenerateVideo(shot.id);
                        }}
                        className="p-1 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                        title="生成视频"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Shot Detail */}
      {selectedShot && (
        <div className="px-5 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-start gap-4">
            {/* Thumbnail */}
            <div className="w-32 h-20 rounded-lg overflow-hidden bg-zinc-200 dark:bg-zinc-700 flex-shrink-0">
              {selectedShot.imageUrl ? (
                <img
                  src={selectedShot.imageUrl}
                  alt={selectedShot.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-400">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                {selectedShot.title}
              </h4>
              <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                {selectedShot.description || "暂无描述"}
              </p>

              <div className="flex items-center gap-4 mt-2 text-xs">
                <span className="text-zinc-500">时长: {selectedShot.duration}s</span>
                <span className="text-zinc-500">镜头: {selectedShot.shotTypeName}</span>
                {selectedShot.cameraMovementName && (
                  <span className="text-zinc-500">
                    运镜: {selectedShot.cameraMovementName}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => onRegenerateImage(selectedShot.id)}
                  className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {selectedShot.imageUrl ? "重新生成图片" : "生成图片"}
                </button>

                {selectedShot.imageUrl && (
                  <button
                    onClick={() => onRegenerateVideo(selectedShot.id)}
                    disabled={!selectedShot.videoPrompt}
                    className="px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    {selectedShot.videoUrl ? "重新生成视频" : "生成视频"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="px-5 py-4 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {shots.length}
          </p>
          <p className="text-xs text-zinc-500">总分镜数</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {shots.filter((s) => s.imageStatus === "completed").length}
          </p>
          <p className="text-xs text-zinc-500">图片完成</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {shots.filter((s) => s.videoStatus === "completed").length}
          </p>
          <p className="text-xs text-zinc-500">视频完成</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {Math.round(shots.reduce((acc, s) => acc + s.duration, 0))}s
          </p>
          <p className="text-xs text-zinc-500">总时长</p>
        </div>
      </div>
    </div>
  );
}
