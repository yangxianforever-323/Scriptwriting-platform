"use client";

import { useState, useEffect } from "react";
import type { Shot } from "@/types/storyboard";
import type { Story, Character, Location } from "@/types/story";
import { shotDb } from "@/lib/db/storyboard";
import { shotTypes, cameraMovements, cameraAngles, depthOfField, compositions, lightingTypes } from "@/lib/shot-language";
import { generateImagePrompt, generateVideoPrompt, STYLE_PRESETS } from "@/lib/prompt-generation";
import { characterDb, locationDb } from "@/lib/db/story";

interface ShotEditorProps {
  shot: Shot | null;
  story: Story | null;
  onUpdate: (shot: Shot) => void;
  onEditFull?: () => void;
}

export function ShotEditor({ shot, story, onUpdate, onEditFull }: ShotEditorProps) {
  const [activeTab, setActiveTab] = useState<"basic" | "visual" | "lighting" | "composition" | "performance" | "prompt">("basic");
  const [localShot, setLocalShot] = useState<Shot | null>(shot);
  const [selectedStyle, setSelectedStyle] = useState<string>("");

  useEffect(() => {
    setLocalShot(shot);
  }, [shot]);

  const characters = story ? characterDb.getByProjectId(story.projectId) : [];
  const locations = story ? locationDb.getByProjectId(story.projectId) : [];

  const generatePrompt = () => {
    const shotLocation = locations.find(l => l.id === localShot?.locationId);
    const shotCharacters = characters.filter(c => localShot?.characterIds?.includes(c.id));
    
    const imagePrompt = generateImagePrompt(localShot!, shotCharacters, shotLocation, {
      style: selectedStyle,
      aspectRatio: "16:9",
      quality: "high",
    });
    
    const videoPrompt = generateVideoPrompt(localShot!, shotCharacters, shotLocation, {
      style: selectedStyle,
      aspectRatio: "16:9",
    });
    
    handleUpdate({
      imagePrompt,
      videoPrompt,
    });
  };

  if (!localShot) {
    return (
      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-8 text-center">
        <svg
          className="mx-auto h-12 w-12 text-zinc-300 dark:text-zinc-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
          />
        </svg>
        <p className="mt-4 text-zinc-500 dark:text-zinc-400">
          选择一个分镜进行编辑
        </p>
      </div>
    );
  }

  const handleUpdate = (updates: Partial<Shot>) => {
    const updated = { ...localShot, ...updates };
    setLocalShot(updated);
    const saved = shotDb.update(localShot.id, updates);
    if (saved) {
      onUpdate(saved);
    }
  };

  const handleGenerateImage = async () => {
    if (!localShot.imagePrompt) {
      alert("请先生成提示词");
      return;
    }
    
    handleUpdate({ imageStatus: "generating" });
    
    try {
      const response = await fetch("/api/generate/shot-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shotId: localShot.id,
          prompt: localShot.imagePrompt,
          storyboardId: localShot.storyboardId,
        }),
      });

      if (!response.ok) {
        throw new Error("生成失败");
      }

      const result = await response.json();
      
      handleUpdate({
        imageStatus: "completed",
        imageUrl: result.imageUrl,
      });
    } catch (error) {
      console.error("Error generating image:", error);
      handleUpdate({ imageStatus: "failed" });
      alert("图片生成失败，请重试");
    }
  };

  const handleGenerateVideo = async () => {
    if (!localShot.videoPrompt) {
      alert("请先生成提示词");
      return;
    }
    
    handleUpdate({ videoStatus: "generating" });
    
    try {
      const response = await fetch("/api/generate/shot-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shotId: localShot.id,
          prompt: localShot.videoPrompt,
          storyboardId: localShot.storyboardId,
        }),
      });

      if (!response.ok) {
        throw new Error("生成失败");
      }

      const result = await response.json();
      
      handleUpdate({
        videoStatus: "completed",
        videoUrl: result.videoUrl,
      });
    } catch (error) {
      console.error("Error generating video:", error);
      handleUpdate({ videoStatus: "failed" });
      alert("视频生成失败，请重试");
    }
  };

  const tabs = [
    { id: "basic", label: "基础", icon: "📋" },
    { id: "visual", label: "镜头", icon: "🎥" },
    { id: "lighting", label: "灯光", icon: "💡" },
    { id: "composition", label: "构图", icon: "🖼️" },
    { id: "performance", label: "表演", icon: "🎭" },
    { id: "prompt", label: "提示词", icon: "✨" },
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div>
          <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
            分镜 #{localShot?.index !== undefined ? localShot.index + 1 : '-'}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            {localShot?.title || '未选择分镜'}
          </p>
        </div>
        {localShot && onEditFull && (
          <button
            onClick={onEditFull}
            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            完整编辑
          </button>
        )}
      </div>

      {/* Preview */}
      <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 relative">
        {localShot.imageUrl ? (
          <img
            src={localShot.imageUrl}
            alt={localShot.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <svg
                className="mx-auto h-10 w-10 text-zinc-300 dark:text-zinc-600"
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
              <p className="text-xs text-zinc-400 mt-2">暂无图片</p>
            </div>
          </div>
        )}

        {/* Generate Buttons */}
        <div className="absolute bottom-2 right-2 flex gap-2">
          <button
            onClick={handleGenerateImage}
            disabled={localShot.imageStatus === "generating"}
            className="px-2 py-1 text-xs bg-white/90 dark:bg-zinc-800/90 text-zinc-700 dark:text-zinc-300 rounded hover:bg-white dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {localShot.imageStatus === "generating" ? "生成中..." : "生成图片"}
          </button>
          <button
            onClick={handleGenerateVideo}
            disabled={localShot.videoStatus === "generating" || !localShot.imageUrl}
            className="px-2 py-1 text-xs bg-blue-600/90 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            {localShot.videoStatus === "generating" ? "生成中..." : "生成视频"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`
                px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-colors
                ${activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                }
              `}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[400px] overflow-y-auto">
        {/* Basic Tab */}
        {activeTab === "basic" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                标题
              </label>
              <input
                type="text"
                value={localShot.title || ""}
                onChange={(e) => handleUpdate({ title: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                描述
              </label>
              <textarea
                value={localShot.description}
                onChange={(e) => handleUpdate({ description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                时长 (秒)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={localShot.duration}
                onChange={(e) => handleUpdate({ duration: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {locations.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  场景地点
                </label>
                <select
                  value={localShot.locationId || ""}
                  onChange={(e) => handleUpdate({ locationId: e.target.value || undefined })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">选择地点...</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {characters.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  出场角色
                </label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {characters.map((char) => (
                    <label key={char.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={localShot.characterIds.includes(char.id)}
                        onChange={(e) => {
                          const newIds = e.target.checked
                            ? [...localShot.characterIds, char.id]
                            : localShot.characterIds.filter((id) => id !== char.id);
                          handleUpdate({ characterIds: newIds });
                        }}
                        className="rounded border-zinc-300 dark:border-zinc-700"
                      />
                      <span className="text-zinc-700 dark:text-zinc-300">{char.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                对话
              </label>
              <textarea
                value={localShot.dialogue || ""}
                onChange={(e) => handleUpdate({ dialogue: e.target.value })}
                rows={2}
                placeholder="角色对话..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        )}

        {/* Visual Tab */}
        {activeTab === "visual" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                镜头类型
              </label>
              <select
                value={localShot.shotType}
                onChange={(e) => {
                  const type = shotTypes.find((t) => t.code === e.target.value);
                  handleUpdate({
                    shotType: e.target.value,
                    shotTypeName: type?.name || e.target.value,
                  });
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {shotTypes.map((type) => (
                  <option key={type.code} value={type.code}>
                    {type.name} - {type.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                镜头运动
              </label>
              <select
                value={localShot.cameraMovement || ""}
                onChange={(e) => {
                  const movement = cameraMovements.find((m) => m.code === e.target.value);
                  handleUpdate({
                    cameraMovement: e.target.value || undefined,
                    cameraMovementName: movement?.name,
                  });
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">无运动</option>
                {cameraMovements.map((movement) => (
                  <option key={movement.code} value={movement.code}>
                    {movement.name} - {movement.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                镜头角度
              </label>
              <select
                value={localShot.cameraAngle || ""}
                onChange={(e) => {
                  const angle = cameraAngles.find((a) => a.code === e.target.value);
                  handleUpdate({
                    cameraAngle: e.target.value || undefined,
                    cameraAngleName: angle?.name,
                  });
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">默认</option>
                {cameraAngles.map((angle) => (
                  <option key={angle.code} value={angle.code}>
                    {angle.name} - {angle.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                焦距
              </label>
              <input
                type="text"
                value={localShot.focalLength || ""}
                onChange={(e) => handleUpdate({ focalLength: e.target.value })}
                placeholder="例如: 35mm, 50mm, 85mm"
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                景深
              </label>
              <select
                value={localShot.depthOfField || ""}
                onChange={(e) => {
                  const dof = depthOfField.find((d) => d.code === e.target.value);
                  handleUpdate({
                    depthOfField: e.target.value || undefined,
                    depthOfFieldName: dof?.name,
                  });
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">默认</option>
                {depthOfField.map((dof) => (
                  <option key={dof.code} value={dof.code}>
                    {dof.name} - {dof.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Lighting Tab */}
        {activeTab === "lighting" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                灯光类型
              </label>
              <select
                value={localShot.lightingType || ""}
                onChange={(e) => {
                  const light = lightingTypes.find((l) => l.code === e.target.value);
                  handleUpdate({
                    lightingType: e.target.value || undefined,
                    lightingName: light?.name,
                  });
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">默认</option>
                {lightingTypes.map((light) => (
                  <option key={light.code} value={light.code}>
                    {light.name} - {light.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                光源
              </label>
              <input
                type="text"
                value={localShot.lightSource || ""}
                onChange={(e) => handleUpdate({ lightSource: e.target.value })}
                placeholder="例如: 窗户, 台灯, 太阳"
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                光源位置
              </label>
              <input
                type="text"
                value={localShot.lightPosition || ""}
                onChange={(e) => handleUpdate({ lightPosition: e.target.value })}
                placeholder="例如: 左侧45度, 顶部"
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                色温/色调
              </label>
              <input
                type="text"
                value={localShot.colorTone || ""}
                onChange={(e) => handleUpdate({ colorTone: e.target.value })}
                placeholder="例如: 暖色调, 冷色调, 自然光"
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Composition Tab */}
        {activeTab === "composition" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                构图方式
              </label>
              <select
                value={localShot.composition || ""}
                onChange={(e) => {
                  const comp = compositions.find((c) => c.code === e.target.value);
                  handleUpdate({
                    composition: e.target.value || undefined,
                    compositionName: comp?.name,
                  });
                }}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">默认</option>
                {compositions.map((comp) => (
                  <option key={comp.code} value={comp.code}>
                    {comp.name} - {comp.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                主体位置
              </label>
              <input
                type="text"
                value={localShot.subjectPosition || ""}
                onChange={(e) => handleUpdate({ subjectPosition: e.target.value })}
                placeholder="例如: 画面中央, 左侧三分线"
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                前景
              </label>
              <input
                type="text"
                value={localShot.foreground || ""}
                onChange={(e) => handleUpdate({ foreground: e.target.value })}
                placeholder="前景元素描述..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                背景
              </label>
              <input
                type="text"
                value={localShot.background || ""}
                onChange={(e) => handleUpdate({ background: e.target.value })}
                placeholder="背景元素描述..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === "performance" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                起始动作
              </label>
              <input
                type="text"
                value={localShot.performanceStart || ""}
                onChange={(e) => handleUpdate({ performanceStart: e.target.value })}
                placeholder="镜头开始时的动作..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                主要动作
              </label>
              <input
                type="text"
                value={localShot.performanceAction || ""}
                onChange={(e) => handleUpdate({ performanceAction: e.target.value })}
                placeholder="镜头中的主要动作..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                结束动作
              </label>
              <input
                type="text"
                value={localShot.performanceEnd || ""}
                onChange={(e) => handleUpdate({ performanceEnd: e.target.value })}
                placeholder="镜头结束时的动作..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                情感曲线
              </label>
              <input
                type="text"
                value={localShot.emotionCurve || ""}
                onChange={(e) => handleUpdate({ emotionCurve: e.target.value })}
                placeholder="例如: 紧张→放松, 悲伤→希望"
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                环境音效
              </label>
              <input
                type="text"
                value={localShot.ambientSound || ""}
                onChange={(e) => handleUpdate({ ambientSound: e.target.value })}
                placeholder="例如: 雨声, 风声, 城市噪音"
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                动作音效
              </label>
              <input
                type="text"
                value={localShot.actionSound || ""}
                onChange={(e) => handleUpdate({ actionSound: e.target.value })}
                placeholder="例如: 脚步声, 关门声"
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                音乐
              </label>
              <input
                type="text"
                value={localShot.music || ""}
                onChange={(e) => handleUpdate({ music: e.target.value })}
                placeholder="音乐描述或参考..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                创作意图
              </label>
              <textarea
                value={localShot.creativeIntent || ""}
                onChange={(e) => handleUpdate({ creativeIntent: e.target.value })}
                rows={2}
                placeholder="这个镜头想要表达什么..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                电影参考
              </label>
              <input
                type="text"
                value={localShot.filmReference || ""}
                onChange={(e) => handleUpdate({ filmReference: e.target.value })}
                placeholder="参考的电影或导演..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Prompt Tab */}
        {activeTab === "prompt" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                视觉风格
              </label>
              <select
                value={selectedStyle}
                onChange={(e) => setSelectedStyle(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                <option value="">默认</option>
                {STYLE_PRESETS.map((style) => (
                  <option key={style.value} value={style.value}>
                    {style.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={generatePrompt}
                className="flex-1 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                ✨ 自动生成提示词
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                图像提示词
              </label>
              <textarea
                value={localShot.imagePrompt || ""}
                onChange={(e) => handleUpdate({ imagePrompt: e.target.value })}
                rows={4}
                placeholder="图像生成提示词..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 resize-none"
              />
              <button
                onClick={() => {
                  if (localShot.imagePrompt) {
                    navigator.clipboard.writeText(localShot.imagePrompt);
                    alert("已复制到剪贴板");
                  }
                }}
                className="mt-1 text-xs text-blue-600 hover:text-blue-700"
              >
                复制提示词
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                视频提示词
              </label>
              <textarea
                value={localShot.videoPrompt || ""}
                onChange={(e) => handleUpdate({ videoPrompt: e.target.value })}
                rows={4}
                placeholder="视频生成提示词..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 resize-none"
              />
              <button
                onClick={() => {
                  if (localShot.videoPrompt) {
                    navigator.clipboard.writeText(localShot.videoPrompt);
                    alert("已复制到剪贴板");
                  }
                }}
                className="mt-1 text-xs text-blue-600 hover:text-blue-700"
              >
                复制提示词
              </button>
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-xs text-zinc-500">
              <p className="font-medium mb-1">💡 提示词生成说明</p>
              <ul className="space-y-1">
                <li>• 自动根据分镜信息生成提示词</li>
                <li>• 包含镜头类型、角色、场景、氛围等</li>
                <li>• 可手动编辑优化提示词</li>
                <li>• 支持多种视觉风格预设</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
