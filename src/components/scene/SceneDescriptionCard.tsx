"use client";

import { useState } from "react";
import type { Scene } from "@/types/database";

interface SceneDescriptionCardProps {
  scene: Scene;
  onConfirm: (sceneId: string) => Promise<void>;
  onUpdate: (sceneId: string, description: string) => Promise<void>;
}

const SHOT_TYPE_NAMES: Record<string, { name: string; nameEn: string }> = {
  EWS: { name: "极远景", nameEn: "Extreme Wide Shot" },
  LS: { name: "远景", nameEn: "Long Shot" },
  FS: { name: "全景", nameEn: "Full Shot" },
  MS: { name: "中景", nameEn: "Medium Shot" },
  MCU: { name: "中近景", nameEn: "Medium Close-up" },
  CU: { name: "特写", nameEn: "Close-up" },
  ECU: { name: "极特写", nameEn: "Extreme Close-up" },
};

const CAMERA_MOVEMENT_NAMES: Record<string, { name: string; effect: string }> = {
  static: { name: "固定镜头", effect: "稳定、庄重" },
  push: { name: "推镜头", effect: "聚焦、增强紧张感" },
  pull: { name: "拉镜头", effect: "揭示全貌、疏离感" },
  pan: { name: "摇镜头", effect: "展示环境" },
  tilt: { name: "俯仰镜头", effect: "展示高度变化" },
  dolly: { name: "移动镜头", effect: "跟随人物" },
  crane: { name: "升降镜头", effect: "宏大场面" },
  tracking: { name: "跟踪镜头", effect: "跟随运动" },
  zoom: { name: "变焦", effect: "快速聚焦" },
  handheld: { name: "手持镜头", effect: "真实感、紧张" },
  steadicam: { name: "稳定器跟拍", effect: "流畅运动" },
  rack_focus: { name: "焦点转移", effect: "视线引导" },
};

const CAMERA_ANGLE_NAMES: Record<string, { name: string; effect: string }> = {
  eye_level: { name: "平视", effect: "平等、客观" },
  high_angle: { name: "俯拍", effect: "渺小、弱势" },
  low_angle: { name: "仰拍", effect: "高大、威严" },
  dutch_angle: { name: "荷兰角", effect: "不安、紧张" },
  birds_eye: { name: "鸟瞰", effect: "全知视角" },
  worms_eye: { name: "虫视", effect: "极度仰视" },
};

const LIGHTING_NAMES: Record<string, { name: string; mood: string }> = {
  natural: { name: "自然光", mood: "真实、温暖" },
  golden_hour: { name: "黄金时刻", mood: "浪漫、怀旧" },
  blue_hour: { name: "蓝调时刻", mood: "神秘、忧郁" },
  high_key: { name: "高调光", mood: "明亮、欢乐" },
  low_key: { name: "低调光", mood: "神秘、紧张" },
  rim: { name: "轮廓光", mood: "立体感、神圣" },
  backlight: { name: "逆光", mood: "剪影、神秘" },
  dramatic: { name: "戏剧性光", mood: "强对比、情感强烈" },
  soft: { name: "柔光", mood: "温柔、浪漫" },
  hard: { name: "硬光", mood: "强烈、真实" },
  neon: { name: "霓虹光", mood: "赛博朋克、未来" },
};

const COMPOSITION_NAMES: Record<string, { name: string; effect: string }> = {
  rule_of_thirds: { name: "三分法", effect: "平衡、和谐" },
  center: { name: "中心构图", effect: "稳定、重要" },
  golden_ratio: { name: "黄金比例", effect: "美感、自然" },
  leading_lines: { name: "引导线", effect: "深度、引导视线" },
  frame_within_frame: { name: "框中框", effect: "层次、窥视" },
  symmetry: { name: "对称构图", effect: "庄重、仪式感" },
  diagonal: { name: "对角线", effect: "动感、张力" },
  negative_space: { name: "负空间", effect: "孤独、思考" },
};

const DOF_NAMES: Record<string, { name: string; effect: string }> = {
  shallow: { name: "浅景深", effect: "聚焦主体、虚化背景" },
  deep: { name: "深景深", effect: "全部清晰" },
  rack: { name: "变焦", effect: "焦点转移" },
};

export function SceneDescriptionCard({
  scene,
  onConfirm,
  onUpdate,
}: SceneDescriptionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(scene.description);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const shotType = scene.shot_type ? SHOT_TYPE_NAMES[scene.shot_type] : null;
  const cameraMovement = scene.camera_movement ? CAMERA_MOVEMENT_NAMES[scene.camera_movement] : null;
  const cameraAngle = scene.camera_angle ? CAMERA_ANGLE_NAMES[scene.camera_angle] : null;
  const lighting = scene.lighting_type ? LIGHTING_NAMES[scene.lighting_type] : null;
  const composition = scene.composition ? COMPOSITION_NAMES[scene.composition] : null;
  const depthOfField = scene.depth_of_field ? DOF_NAMES[scene.depth_of_field] : null;

  const handleSaveEdit = async () => {
    if (editedDescription.trim() === scene.description) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onUpdate(scene.id, editedDescription.trim());
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update scene:", error);
      setEditedDescription(scene.description);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedDescription(scene.description);
    setIsEditing(false);
  };

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm(scene.id);
    } catch (error) {
      console.error("Failed to confirm scene:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div
      className={`rounded-xl border transition-colors ${
        scene.description_confirmed
          ? "border-green-200 bg-green-50 dark:border-green-900/50 dark:bg-green-900/20"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 text-sm font-bold text-white dark:from-zinc-600 dark:to-zinc-800">
              {scene.order_index}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  分镜 {scene.order_index}
                </span>
                {shotType && (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                    {shotType.name} ({scene.shot_type})
                  </span>
                )}
              </div>
              {shotType && (
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {shotType.nameEn}
                </span>
              )}
            </div>
            {scene.description_confirmed && (
              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                已确认
              </span>
            )}
          </div>

          {!scene.description_confirmed && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              编辑
            </button>
          )}
        </div>

        {(shotType || cameraMovement || cameraAngle || lighting) && (
          <div className="mb-3 flex flex-wrap gap-2">
            {cameraMovement && (
              <div className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs dark:bg-gray-800/50">
                <svg className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="font-medium text-gray-600 dark:text-gray-300">{cameraMovement.name}</span>
                <span className="text-gray-400 dark:text-gray-500">· {cameraMovement.effect}</span>
              </div>
            )}
            {cameraAngle && (
              <div className="flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs dark:bg-stone-800/50">
                <svg className="h-3.5 w-3.5 text-stone-500 dark:text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
                <span className="font-medium text-stone-600 dark:text-stone-300">{cameraAngle.name}</span>
                <span className="text-stone-400 dark:text-stone-500">· {cameraAngle.effect}</span>
              </div>
            )}
            {lighting && (
              <div className="flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs dark:bg-orange-900/20">
                <svg className="h-3.5 w-3.5 text-orange-400 dark:text-orange-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="font-medium text-orange-600 dark:text-orange-300">{lighting.name}</span>
                <span className="text-orange-400 dark:text-orange-400/70">· {lighting.mood}</span>
              </div>
            )}
            {composition && (
              <div className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs dark:bg-slate-800/50">
                <svg className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                <span className="font-medium text-slate-600 dark:text-slate-300">{composition.name}</span>
                <span className="text-slate-400 dark:text-slate-500">· {composition.effect}</span>
              </div>
            )}
            {depthOfField && (
              <div className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs dark:bg-zinc-800/50">
                <svg className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="font-medium text-zinc-600 dark:text-zinc-300">{depthOfField.name}</span>
              </div>
            )}
          </div>
        )}

        {isEditing ? (
          <div className="space-y-3">
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              disabled={isSaving}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving || !editedDescription.trim()}
                className="rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {isSaving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
            {scene.description}
          </p>
        )}

        {scene.director_notes && !isEditing && (
          <div className="mt-3">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              <svg
                className={`h-3.5 w-3.5 transition-transform ${showDetails ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              导演备注
            </button>
            {showDetails && scene.director_notes && (
              <div className="mt-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
                <p className="text-xs text-zinc-600 dark:text-zinc-400">{scene.director_notes}</p>
              </div>
            )}
          </div>
        )}

        {/* 图片生成描述 */}
        {scene.image_prompt && !isEditing && (
          <div className="mt-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700">
            <div className="mb-2 flex items-center gap-1.5">
              <svg className="h-4 w-4 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">图片生成描述 (NanoBananaPro)</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 font-mono">
              {scene.image_prompt}
            </p>
          </div>
        )}

        {/* 视频生成脚本 - 关键帧表演 */}
        {(scene.performance_start || scene.performance_action || scene.performance_end || scene.emotion_curve) && !isEditing && (
          <div className="mt-3 rounded-lg bg-stone-50 p-3 dark:bg-stone-800/30 border border-stone-200 dark:border-stone-700">
            <div className="mb-2 flex items-center gap-1.5">
              <svg className="h-4 w-4 text-stone-500 dark:text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-semibold text-stone-600 dark:text-stone-300">视频生成脚本 (4-10s)</span>
            </div>
            
            {/* 关键帧表演 */}
            {(scene.performance_start || scene.performance_action || scene.performance_end) && (
              <div className="mb-3 space-y-2">
                <div className="text-xs font-medium text-stone-500 dark:text-stone-400">关键帧表演</div>
                {scene.performance_start && (
                  <div className="flex gap-2">
                    <span className="text-xs font-medium text-stone-400 dark:text-stone-500 w-12 shrink-0">起始:</span>
                    <span className="text-xs text-stone-600 dark:text-stone-300">{scene.performance_start}</span>
                  </div>
                )}
                {scene.performance_action && (
                  <div className="flex gap-2">
                    <span className="text-xs font-medium text-stone-400 dark:text-stone-500 w-12 shrink-0">动作:</span>
                    <span className="text-xs text-stone-600 dark:text-stone-300 whitespace-pre-wrap">{scene.performance_action}</span>
                  </div>
                )}
                {scene.performance_end && (
                  <div className="flex gap-2">
                    <span className="text-xs font-medium text-stone-400 dark:text-stone-500 w-12 shrink-0">结束:</span>
                    <span className="text-xs text-stone-600 dark:text-stone-300">{scene.performance_end}</span>
                  </div>
                )}
              </div>
            )}

            {/* 情绪曲线 */}
            {scene.emotion_curve && (
              <div className="mb-3">
                <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">情绪曲线</div>
                <p className="text-xs text-stone-600 dark:text-stone-300">{scene.emotion_curve}</p>
              </div>
            )}

            {/* 表情与眼神 */}
            {(scene.facial_expression || scene.eye_direction) && (
              <div className="mb-3 space-y-1">
                {(scene.facial_expression || scene.eye_direction) && (
                  <div className="text-xs font-medium text-stone-500 dark:text-stone-400">表情与眼神</div>
                )}
                {scene.facial_expression && (
                  <p className="text-xs text-stone-600 dark:text-stone-300">
                    <span className="text-stone-400 dark:text-stone-500">表情: </span>{scene.facial_expression}
                  </p>
                )}
                {scene.eye_direction && (
                  <p className="text-xs text-stone-600 dark:text-stone-300">
                    <span className="text-stone-400 dark:text-stone-500">眼神: </span>{scene.eye_direction}
                  </p>
                )}
              </div>
            )}

            {/* 肢体语言 */}
            {scene.body_language && (
              <div className="mb-3">
                <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">肢体语言</div>
                <p className="text-xs text-stone-600 dark:text-stone-300">{scene.body_language}</p>
              </div>
            )}

            {/* 环境互动 */}
            {scene.interaction_with_environment && (
              <div className="mb-3">
                <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">环境互动</div>
                <p className="text-xs text-stone-600 dark:text-stone-300">{scene.interaction_with_environment}</p>
              </div>
            )}

            {/* 对白时机 */}
            {(scene.dialogue || scene.dialogue_timing) && (
              <div className="mb-3">
                <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">对白</div>
                {scene.dialogue_timing && (
                  <span className="inline-block text-xs bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded mb-1">
                    {scene.dialogue_timing}
                  </span>
                )}
                {scene.dialogue && (
                  <p className="text-xs text-stone-600 dark:text-stone-300 italic">&ldquo;{scene.dialogue}&rdquo;</p>
                )}
              </div>
            )}

            {/* 音效时机 */}
            {(scene.ambient_sound || scene.action_sound || scene.special_sound || scene.music) && (
              <div>
                <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">音效设计</div>
                <div className="space-y-1">
                  {scene.ambient_sound && (
                    <div className="flex gap-2 items-center">
                      <span className="text-xs text-stone-400 dark:text-stone-500 w-12 shrink-0">环境:</span>
                      <span className="text-xs text-stone-600 dark:text-stone-300">{scene.ambient_sound}</span>
                      {scene.sound_timing && (
                        <span className="text-xs bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400 px-1.5 py-0.5 rounded">{scene.sound_timing}</span>
                      )}
                    </div>
                  )}
                  {scene.action_sound && (
                    <div className="flex gap-2 items-center">
                      <span className="text-xs text-stone-400 dark:text-stone-500 w-12 shrink-0">动作:</span>
                      <span className="text-xs text-stone-600 dark:text-stone-300">{scene.action_sound}</span>
                    </div>
                  )}
                  {scene.special_sound && (
                    <div className="flex gap-2 items-center">
                      <span className="text-xs text-stone-400 dark:text-stone-500 w-12 shrink-0">特效:</span>
                      <span className="text-xs text-stone-600 dark:text-stone-300">{scene.special_sound}</span>
                    </div>
                  )}
                  {scene.music && (
                    <div className="flex gap-2 items-center">
                      <span className="text-xs text-stone-400 dark:text-stone-500 w-12 shrink-0">音乐:</span>
                      <span className="text-xs text-stone-600 dark:text-stone-300">{scene.music}</span>
                      {scene.music_mood && (
                        <span className="text-xs bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400 px-1.5 py-0.5 rounded">{scene.music_mood}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legacy Prompt */}
        {scene.prompt_text && !isEditing && (
          <div className="mt-3 rounded-lg bg-zinc-50 p-2.5 dark:bg-zinc-800/50">
            <div className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">Prompt (Legacy)</div>
            <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 font-mono">
              {scene.prompt_text}
            </p>
          </div>
        )}
      </div>

      {!scene.description_confirmed && !isEditing && (
        <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <div className="flex justify-end">
            <button
              onClick={handleConfirm}
              disabled={isConfirming}
              className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isConfirming ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  确认中...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  确认此分镜
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
