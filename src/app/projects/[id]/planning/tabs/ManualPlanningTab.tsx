"use client";

import React from "react";
import { Tooltip } from "@/components/ui/Tooltip";

interface ManualPlanningTabProps {
  logline: string;
  synopsis: string;
  genre: string;
  targetDuration: number;
  onLoglineChange: (value: string) => void;
  onSynopsisChange: (value: string) => void;
  onGenreChange: (value: string) => void;
  onTargetDurationChange: (value: number) => void;
}

export function ManualPlanningTab({
  logline,
  synopsis,
  genre,
  targetDuration,
  onLoglineChange,
  onSynopsisChange,
  onGenreChange,
  onTargetDurationChange,
}: ManualPlanningTabProps) {
  return (
    <div className="space-y-6">
      {/* Logline */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          一句话概括
          <Tooltip content="用一句话描述故事的核心冲突和主角目标，通常包含：主角+目标+障碍">
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </Tooltip>
        </label>
        <textarea
          value={logline}
          onChange={(e) => onLoglineChange(e.target.value)}
          placeholder="例如：一个孤独的图书管理员在无尽的高耸书架间发现了一个通往平行世界的秘密通道..."
          className="w-full px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
          rows={2}
        />
        <p className="mt-1 text-xs text-zinc-400">建议 30-50 字</p>
      </div>

      {/* Synopsis */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          剧情梗概
          <Tooltip content="简要描述故事的开端、发展、高潮和结局，突出主要冲突和转折点">
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </Tooltip>
        </label>
        <textarea
          value={synopsis}
          onChange={(e) => onSynopsisChange(e.target.value)}
          placeholder="描述故事的开端、发展和结局..."
          className="w-full px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
          rows={6}
        />
        <p className="mt-1 text-xs text-zinc-400">建议 200-500 字</p>
      </div>

      {/* Genre & Duration */}
      <div className="grid grid-cols-2 gap-6">
        {/* Genre */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            类型/风格
            <Tooltip content="选择最符合您故事的主要类型，这将影响后续的AI生成风格">
              <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Tooltip>
          </label>
          <select
            value={genre}
            onChange={(e) => onGenreChange(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            <option value="">选择类型...</option>
            <option value="scifi">科幻</option>
            <option value="fantasy">奇幻</option>
            <option value="thriller">惊悚</option>
            <option value="romance">爱情</option>
            <option value="comedy">喜剧</option>
            <option value="drama">剧情</option>
            <option value="documentary">纪录片</option>
            <option value="animation">动画</option>
            <option value="horror">恐怖</option>
            <option value="action">动作</option>
          </select>
        </div>

        {/* Target Duration */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            目标时长
            <Tooltip content="预计视频的总时长，这将帮助AI规划分镜数量和节奏">
              <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Tooltip>
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              value={targetDuration}
              onChange={(e) => onTargetDurationChange(Number(e.target.value))}
              min={15}
              max={300}
              step={15}
              className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="w-16 text-center text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {targetDuration}秒
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            {targetDuration <= 60 && "短视频"}
            {targetDuration > 60 && targetDuration <= 180 && "短片"}
            {targetDuration > 180 && "长片"}
            {" · 约 "}{Math.ceil(targetDuration / 6)} 个分镜
          </p>
        </div>
      </div>
    </div>
  );
}
