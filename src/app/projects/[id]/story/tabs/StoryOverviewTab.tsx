"use client";

import { useState } from "react";
import type { Story, StoryStructure } from "@/types/story";
import { storyDb } from "@/lib/db/story";

interface StoryOverviewTabProps {
  story: Story;
  onUpdate: (story: Story) => void;
}

const STRUCTURE_OPTIONS: { value: StoryStructure; label: string; description: string }[] = [
  {
    value: "three-act",
    label: "三幕式结构",
    description: "经典的三幕结构：开端、发展、结局",
  },
  {
    value: "five-act",
    label: "五幕式结构",
    description: "更细致的五幕： exposition, rising action, climax, falling action, resolution",
  },
  {
    value: "hero-journey",
    label: "英雄之旅",
    description: "神话学家约瑟夫·坎贝尔提出的经典叙事模式",
  },
  {
    value: "serial",
    label: "系列/连续",
    description: "适合多集连续剧或系列故事",
  },
];

export function StoryOverviewTab({ story, onUpdate }: StoryOverviewTabProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: story.title,
    logline: story.logline,
    synopsis: story.synopsis,
    structure: story.structure,
    theme: story.theme,
    tone: story.tone,
    genre: story.genre,
    targetDuration: story.targetDuration,
  });

  const handleSave = () => {
    const updated = storyDb.update(story.id, formData);
    if (updated) {
      onUpdate(updated);
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          故事概览
        </h2>
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {isEditing ? "保存" : "编辑"}
        </button>
      </div>

      {/* Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              故事标题
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            ) : (
              <p className="text-zinc-900 dark:text-zinc-100">{story.title || "未设置"}</p>
            )}
          </div>

          {/* Logline */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              一句话概括
            </label>
            {isEditing ? (
              <textarea
                value={formData.logline}
                onChange={(e) => setFormData({ ...formData, logline: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            ) : (
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">{story.logline || "未设置"}</p>
            )}
          </div>

          {/* Synopsis */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              剧情梗概
            </label>
            {isEditing ? (
              <textarea
                value={formData.synopsis}
                onChange={(e) => setFormData({ ...formData, synopsis: e.target.value })}
                rows={6}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            ) : (
              <p className="text-zinc-600 dark:text-zinc-400 text-sm whitespace-pre-wrap">
                {story.synopsis || "未设置"}
              </p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Structure */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              故事结构
            </label>
            {isEditing ? (
              <select
                value={formData.structure}
                onChange={(e) => setFormData({ ...formData, structure: e.target.value as StoryStructure })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              >
                {STRUCTURE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <div>
                <p className="text-zinc-900 dark:text-zinc-100">
                  {STRUCTURE_OPTIONS.find((s) => s.value === story.structure)?.label}
                </p>
                <p className="text-xs text-zinc-500">
                  {STRUCTURE_OPTIONS.find((s) => s.value === story.structure)?.description}
                </p>
              </div>
            )}
          </div>

          {/* Genre */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              类型
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.genre}
                onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            ) : (
              <p className="text-zinc-900 dark:text-zinc-100">{story.genre || "未设置"}</p>
            )}
          </div>

          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              主题
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            ) : (
              <p className="text-zinc-900 dark:text-zinc-100">{story.theme || "未设置"}</p>
            )}
          </div>

          {/* Tone */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              基调
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.tone}
                onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            ) : (
              <p className="text-zinc-900 dark:text-zinc-100">{story.tone || "未设置"}</p>
            )}
          </div>

          {/* Target Duration */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              目标时长（秒）
            </label>
            {isEditing ? (
              <input
                type="number"
                value={formData.targetDuration}
                onChange={(e) => setFormData({ ...formData, targetDuration: Number(e.target.value) })}
                min={15}
                max={300}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            ) : (
              <p className="text-zinc-900 dark:text-zinc-100">{story.targetDuration} 秒</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-zinc-200 dark:border-zinc-800">
        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {story.acts?.length || 0}
          </p>
          <p className="text-sm text-zinc-500">幕/章节</p>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {story.characters?.length || 0}
          </p>
          <p className="text-sm text-zinc-500">角色</p>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {story.locations?.length || 0}
          </p>
          <p className="text-sm text-zinc-500">场景地点</p>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {story.props?.length || 0}
          </p>
          <p className="text-sm text-zinc-500">道具</p>
        </div>
      </div>
    </div>
  );
}
