"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { StageNavigator } from "@/components/project/StageNavigator";
import { Spinner } from "@/components/ui/Spinner";
import { shotDb, storyboardDb } from "@/lib/db/storyboard";
import { storyDb, characterDb, locationDb } from "@/lib/db/story";
import type { Shot } from "@/types/storyboard";
import type { Story, Character, Location } from "@/types/story";
import type { Project } from "@/types/database";
import {
  shotTypes,
  cameraMovements,
  cameraAngles,
  depthOfField,
  compositions,
  lightingTypes,
} from "@/lib/shot-language";
import { generateImagePrompt, generateVideoPrompt, STYLE_PRESETS } from "@/lib/prompt-generation";

export default function ShotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const shotId = params.shotId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [shot, setShot] = useState<Shot | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [allShots, setAllShots] = useState<Shot[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("basic");
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [projectId, shotId]);

  const loadData = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error("Failed to fetch project");
      const data = await response.json();
      setProject(data.project);

      const shotData = shotDb.getById(shotId);
      if (shotData) {
        setShot(shotData);
        const shots = shotDb.getByStoryboardId(shotData.storyboardId);
        setAllShots(shots);

        const storyData = storyDb.getByProjectId(projectId);
        if (storyData) {
          setStory(storyData);
          setCharacters(characterDb.getByProjectId(projectId));
          setLocations(locationDb.getByProjectId(projectId));
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (updates: Partial<Shot>) => {
    if (!shot) return;
    const updated = shotDb.update(shot.id, updates);
    if (updated) {
      setShot(updated);
      const idx = allShots.findIndex((s) => s.id === updated.id);
      if (idx !== -1) {
        const newShots = [...allShots];
        newShots[idx] = updated;
        setAllShots(newShots);
      }
    }
  };

  const handleGeneratePrompt = () => {
    if (!shot) return;
    const shotLocation = locations.find((l) => l.id === shot.locationId);
    const shotCharacters = characters.filter((c) =>
      shot.characterIds?.includes(c.id)
    );

    const imagePrompt = generateImagePrompt(shot, shotCharacters, shotLocation, {
      style: selectedStyle,
      aspectRatio: "16:9",
      quality: "high",
    });

    const videoPrompt = generateVideoPrompt(shot, shotCharacters, shotLocation, {
      style: selectedStyle,
      aspectRatio: "16:9",
    });

    handleUpdate({ imagePrompt, videoPrompt });
  };

  const handleGenerateImage = async () => {
    if (!shot || !shot.imagePrompt) {
      alert("请先生成提示词");
      return;
    }

    handleUpdate({ imageStatus: "generating" });

    try {
      const response = await fetch("/api/generate/shot-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shotId: shot.id,
          prompt: shot.imagePrompt,
          storyboardId: shot.storyboardId,
        }),
      });

      if (!response.ok) throw new Error("生成失败");

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
    if (!shot || !shot.videoPrompt) {
      alert("请先生成提示词");
      return;
    }

    handleUpdate({ videoStatus: "generating" });

    try {
      const response = await fetch("/api/generate/shot-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shotId: shot.id,
          prompt: shot.videoPrompt,
          storyboardId: shot.storyboardId,
        }),
      });

      if (!response.ok) throw new Error("生成失败");

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

  const currentIndex = allShots.findIndex((s) => s.id === shotId);
  const prevShot = currentIndex > 0 ? allShots[currentIndex - 1] : null;
  const nextShot =
    currentIndex < allShots.length - 1 ? allShots[currentIndex + 1] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!project || !shot) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-zinc-500">分镜不存在</p>
      </div>
    );
  }

  const tabs = [
    { id: "basic", label: "基础信息", icon: "📋" },
    { id: "visual", label: "镜头设计", icon: "🎥" },
    { id: "lighting", label: "灯光设计", icon: "💡" },
    { id: "composition", label: "构图设计", icon: "🖼️" },
    { id: "performance", label: "表演指导", icon: "🎭" },
    { id: "audio", label: "音效设计", icon: "🔊" },
    { id: "prompt", label: "AI提示词", icon: "✨" },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <StageNavigator project={project} currentStage="storyboard" />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/projects/${projectId}/storyboard`)}
              className="p-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                分镜 #{shot.index + 1}: {shot.title}
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                编辑分镜详情 · 共 {allShots.length} 个分镜
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                prevShot &&
                router.push(`/projects/${projectId}/storyboard/${prevShot.id}`)
              }
              disabled={!prevShot}
              className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              上一个
            </button>
            <span className="text-sm text-zinc-500 px-2">
              {currentIndex + 1} / {allShots.length}
            </span>
            <button
              onClick={() =>
                nextShot &&
                router.push(`/projects/${projectId}/storyboard/${nextShot.id}`)
              }
              disabled={!nextShot}
              className="px-4 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              下一个
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Preview Panel */}
          <div className="lg:col-span-1 space-y-4">
            {/* Image Preview */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 relative">
                {shot.imageUrl ? (
                  <img
                    src={shot.imageUrl}
                    alt={shot.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <svg
                      className="w-16 h-16 text-zinc-300 dark:text-zinc-600"
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
                    <p className="mt-2 text-sm text-zinc-400">暂无图片</p>
                  </div>
                )}

                {/* Status Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-lg ${
                      shot.imageStatus === "completed"
                        ? "bg-green-500 text-white"
                        : shot.imageStatus === "generating"
                        ? "bg-yellow-500 text-white animate-pulse"
                        : shot.imageStatus === "failed"
                        ? "bg-red-500 text-white"
                        : "bg-zinc-500/80 text-white"
                    }`}
                  >
                    {shot.imageStatus === "completed"
                      ? "✓ 图片完成"
                      : shot.imageStatus === "generating"
                      ? "生成中..."
                      : shot.imageStatus === "failed"
                      ? "✗ 失败"
                      : "待生成"}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-lg ${
                      shot.videoStatus === "completed"
                        ? "bg-green-500 text-white"
                        : shot.videoStatus === "generating"
                        ? "bg-yellow-500 text-white animate-pulse"
                        : shot.videoStatus === "failed"
                        ? "bg-red-500 text-white"
                        : "bg-zinc-500/80 text-white"
                    }`}
                  >
                    {shot.videoStatus === "completed"
                      ? "✓ 视频完成"
                      : shot.videoStatus === "generating"
                      ? "生成中..."
                      : shot.videoStatus === "failed"
                      ? "✗ 失败"
                      : "待生成"}
                  </span>
                </div>

                {/* Generate Buttons */}
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <button
                    onClick={handleGenerateImage}
                    disabled={shot.imageStatus === "generating"}
                    className="px-3 py-1.5 text-xs bg-white/90 dark:bg-zinc-800/90 backdrop-blur text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-white dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors shadow-lg"
                  >
                    {shot.imageStatus === "generating" ? "生成中..." : "生成图片"}
                  </button>
                  <button
                    onClick={handleGenerateVideo}
                    disabled={
                      shot.videoStatus === "generating" || !shot.imageUrl
                    }
                    className="px-3 py-1.5 text-xs bg-blue-600/90 backdrop-blur text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors shadow-lg"
                  >
                    {shot.videoStatus === "generating"
                      ? "生成中..."
                      : "生成视频"}
                  </button>
                </div>
              </div>

              {/* Video Preview */}
              {shot.videoUrl && (
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                  <p className="text-xs font-medium text-zinc-500 mb-2">视频预览</p>
                  <video
                    src={shot.videoUrl}
                    controls
                    className="w-full rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* Quick Info */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">镜头类型</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {shot.shotTypeName}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">时长</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {shot.duration}秒
                </span>
              </div>
              {shot.cameraMovementName && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">运镜方式</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {shot.cameraMovementName}
                  </span>
                </div>
              )}
              {shot.lightingName && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">灯光类型</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {shot.lightingName}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Editor Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              {/* Tabs */}
              <div className="border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
                <div className="flex min-w-max">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? "border-blue-500 text-blue-600 dark:text-blue-400"
                          : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                      }`}
                    >
                      <span className="mr-1.5">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6 max-h-[calc(100vh-400px)] overflow-y-auto">
                {/* Basic Tab */}
                {activeTab === "basic" && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        标题
                      </label>
                      <input
                        type="text"
                        value={shot.title || ""}
                        onChange={(e) => handleUpdate({ title: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="输入分镜标题..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        描述
                      </label>
                      <textarea
                        value={shot.description}
                        onChange={(e) => handleUpdate({ description: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="详细描述这个分镜的内容..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                          时长（秒）
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={60}
                          value={shot.duration}
                          onChange={(e) =>
                            handleUpdate({ duration: Number(e.target.value) })
                          }
                          className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                          场景地点
                        </label>
                        <select
                          value={shot.locationId || ""}
                          onChange={(e) =>
                            handleUpdate({
                              locationId: e.target.value || undefined,
                            })
                          }
                          className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">选择地点...</option>
                          {locations.map((loc) => (
                            <option key={loc.id} value={loc.id}>
                              {loc.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {characters.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                          出场角色
                        </label>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {characters.map((char) => (
                            <label
                              key={char.id}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={shot.characterIds.includes(char.id)}
                                onChange={(e) => {
                                  const newIds = e.target.checked
                                    ? [...shot.characterIds, char.id]
                                    : shot.characterIds.filter(
                                        (id) => id !== char.id
                                      );
                                  handleUpdate({ characterIds: newIds });
                                }}
                                className="rounded border-zinc-300 dark:border-zinc-700"
                              />
                              <div>
                                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                  {char.name}
                                </p>
                                {char.role && (
                                  <p className="text-xs text-zinc-500">{char.role}</p>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        对白内容
                      </label>
                      <textarea
                        value={shot.dialogue || ""}
                        onChange={(e) => handleUpdate({ dialogue: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="角色对白或旁白..."
                      />
                    </div>
                  </div>
                )}

                {/* Visual Tab */}
                {activeTab === "visual" && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        镜头类型
                      </label>
                      <select
                        value={shot.shotType}
                        onChange={(e) => {
                          const type = shotTypes.find(
                            (t) => t.code === e.target.value
                          );
                          handleUpdate({
                            shotType: e.target.value,
                            shotTypeName: type?.name || e.target.value,
                          });
                        }}
                        className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {shotTypes.map((type) => (
                          <option key={type.code} value={type.code}>
                            {type.name} - {type.description}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        镜头运动
                      </label>
                      <select
                        value={shot.cameraMovement || ""}
                        onChange={(e) => {
                          const movement = cameraMovements.find(
                            (m) => m.code === e.target.value
                          );
                          handleUpdate({
                            cameraMovement: e.target.value || undefined,
                            cameraMovementName: movement?.name,
                          });
                        }}
                        className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">固定镜头（无运动）</option>
                        {cameraMovements.map((movement) => (
                          <option key={movement.code} value={movement.code}>
                            {movement.name} - {movement.description}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        镜头角度
                      </label>
                      <select
                        value={shot.cameraAngle || ""}
                        onChange={(e) => {
                          const angle = cameraAngles.find(
                            (a) => a.code === e.target.value
                          );
                          handleUpdate({
                            cameraAngle: e.target.value || undefined,
                            cameraAngleName: angle?.name,
                          });
                        }}
                        className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">平视（默认）</option>
                        {cameraAngles.map((angle) => (
                          <option key={angle.code} value={angle.code}>
                            {angle.name} - {angle.description}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                          焦距
                        </label>
                        <input
                          type="text"
                          value={shot.focalLength || ""}
                          onChange={(e) =>
                            handleUpdate({ focalLength: e.target.value })
                          }
                          placeholder="如：35mm, 50mm, 85mm"
                          className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                          景深
                        </label>
                        <select
                          value={shot.depthOfField || ""}
                          onChange={(e) => {
                            const dof = depthOfField.find(
                              (d) => d.code === e.target.value
                            );
                            handleUpdate({
                              depthOfField: e.target.value || undefined,
                              depthOfFieldName: dof?.name,
                            });
                          }}
                          className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  </div>
                )}

                {/* Lighting Tab */}
                {activeTab === "lighting" && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        灯光类型
                      </label>
                      <select
                        value={shot.lightingType || ""}
                        onChange={(e) => {
                          const light = lightingTypes.find(
                            (l) => l.code === e.target.value
                          );
                          handleUpdate({
                            lightingType: e.target.value || undefined,
                            lightingName: light?.name,
                          });
                        }}
                        className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">自然光（默认）</option>
                        {lightingTypes.map((light) => (
                          <option key={light.code} value={light.code}>
                            {light.name} - {light.description}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                          主光源
                        </label>
                        <input
                          type="text"
                          value={shot.lightSource || ""}
                          onChange={(e) =>
                            handleUpdate({ lightSource: e.target.value })
                          }
                          placeholder="如：窗户、台灯、太阳"
                          className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                          光源位置
                        </label>
                        <input
                          type="text"
                          value={shot.lightPosition || ""}
                          onChange={(e) =>
                            handleUpdate({ lightPosition: e.target.value })
                          }
                          placeholder="如：左侧45度、顶部"
                          className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        色温/色调
                      </label>
                      <input
                        type="text"
                        value={shot.colorTone || ""}
                        onChange={(e) => handleUpdate({ colorTone: e.target.value })}
                        placeholder="如：暖色调、冷色调、自然光、黄金时刻"
                        className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                {/* Composition Tab */}
                {activeTab === "composition" && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        构图方式
                      </label>
                      <select
                        value={shot.composition || ""}
                        onChange={(e) => {
                          const comp = compositions.find(
                            (c) => c.code === e.target.value
                          );
                          handleUpdate({
                            composition: e.target.value || undefined,
                            compositionName: comp?.name,
                          });
                        }}
                        className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">默认构图</option>
                        {compositions.map((comp) => (
                          <option key={comp.code} value={comp.code}>
                            {comp.name} - {comp.description}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        主体位置
                      </label>
                      <input
                        type="text"
                        value={shot.subjectPosition || ""}
                        onChange={(e) =>
                          handleUpdate({ subjectPosition: e.target.value })
                        }
                        placeholder="如：画面中央、左侧三分线、右下角"
                        className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                          前景元素
                        </label>
                        <input
                          type="text"
                          value={shot.foreground || ""}
                          onChange={(e) =>
                            handleUpdate({ foreground: e.target.value })
                          }
                          placeholder="前景装饰或物体..."
                          className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                          背景元素
                        </label>
                        <input
                          type="text"
                          value={shot.background || ""}
                          onChange={(e) =>
                            handleUpdate({ background: e.target.value })
                          }
                          placeholder="背景环境描述..."
                          className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Performance Tab */}
                {activeTab === "performance" && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                          起始动作
                        </label>
                        <input
                          type="text"
                          value={shot.performanceStart || ""}
                          onChange={(e) =>
                            handleUpdate({ performanceStart: e.target.value })
                          }
                          placeholder="开始时的状态..."
                          className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                          主要动作
                        </label>
                        <input
                          type="text"
                          value={shot.performanceAction || ""}
                          onChange={(e) =>
                            handleUpdate({ performanceAction: e.target.value })
                          }
                          placeholder="核心动作..."
                          className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                          结束动作
                        </label>
                        <input
                          type="text"
                          value={shot.performanceEnd || ""}
                          onChange={(e) =>
                            handleUpdate({ performanceEnd: e.target.value })
                          }
                          placeholder="结束时的状态..."
                          className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        情感曲线
                      </label>
                      <input
                        type="text"
                        value={shot.emotionCurve || ""}
                        onChange={(e) => handleUpdate({ emotionCurve: e.target.value })}
                        placeholder="如：紧张→放松、悲伤→希望、平静→震惊"
                        className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        创作意图
                      </label>
                      <textarea
                        value={shot.creativeIntent || ""}
                        onChange={(e) =>
                          handleUpdate({ creativeIntent: e.target.value })
                        }
                        rows={3}
                        placeholder="这个镜头想要表达什么情感或叙事目的..."
                        className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        电影参考
                      </label>
                      <input
                        type="text"
                        value={shot.filmReference || ""}
                        onChange={(e) =>
                          handleUpdate({ filmReference: e.target.value })
                        }
                        placeholder="参考的电影、导演或具体场景..."
                        className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                {/* Audio Tab */}
                {activeTab === "audio" && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        环境音效
                      </label>
                      <input
                        type="text"
                        value={shot.ambientSound || ""}
                        onChange={(e) =>
                          handleUpdate({ ambientSound: e.target.value })
                        }
                        placeholder="如：雨声、风声、城市噪音、森林鸟鸣..."
                        className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        动作音效
                      </label>
                      <input
                        type="text"
                        value={shot.actionSound || ""}
                        onChange={(e) =>
                          handleUpdate({ actionSound: e.target.value })
                        }
                        placeholder="如：脚步声、关门声、打斗声..."
                        className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        背景音乐
                      </label>
                      <input
                        type="text"
                        value={shot.music || ""}
                        onChange={(e) => handleUpdate({ music: e.target.value })}
                        placeholder="音乐风格或具体曲目参考..."
                        className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        对白时机
                      </label>
                      <input
                        type="text"
                        value={shot.dialogueTiming || ""}
                        onChange={(e) =>
                          handleUpdate({ dialogueTiming: e.target.value })
                        }
                        placeholder="如：第2秒开始说台词，持续3秒..."
                        className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                {/* Prompt Tab */}
                {activeTab === "prompt" && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        视觉风格预设
                      </label>
                      <select
                        value={selectedStyle}
                        onChange={(e) => setSelectedStyle(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">默认风格</option>
                        {STYLE_PRESETS.map((style) => (
                          <option key={style.value} value={style.value}>
                            {style.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleGeneratePrompt}
                      className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      自动生成AI提示词
                    </button>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        图像生成提示词
                      </label>
                      <textarea
                        value={shot.imagePrompt || ""}
                        onChange={(e) =>
                          handleUpdate({ imagePrompt: e.target.value })
                        }
                        rows={4}
                        placeholder="用于AI图像生成的英文提示词..."
                        className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                      />
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => {
                            if (shot.imagePrompt) {
                              navigator.clipboard.writeText(shot.imagePrompt);
                            }
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          复制提示词
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        视频生成提示词
                      </label>
                      <textarea
                        value={shot.videoPrompt || ""}
                        onChange={(e) =>
                          handleUpdate({ videoPrompt: e.target.value })
                        }
                        rows={4}
                        placeholder="用于AI视频生成的英文提示词..."
                        className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
                      />
                      <div className="mt-2 flex justify-end">
                        <button
                          onClick={() => {
                            if (shot.videoPrompt) {
                              navigator.clipboard.writeText(shot.videoPrompt);
                            }
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          复制提示词
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        💡 提示词说明
                      </p>
                      <ul className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                        <li>• 点击"自动生成"将根据当前分镜设置智能生成提示词</li>
                        <li>• 包含镜头类型、角色外貌、场景氛围等信息</li>
                        <li>• 可手动编辑优化以获得更好的生成效果</li>
                        <li>• 支持多种视觉风格预设选择</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
