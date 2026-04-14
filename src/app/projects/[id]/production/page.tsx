"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { StageNavigator } from "@/components/project/StageNavigator";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import type { Project } from "@/types/database";
import type { Storyboard, Shot } from "@/types/storyboard";
import { ProductionToolbar } from "./components/ProductionToolbar";
import { ShotGrid } from "./components/ShotGrid";
import { GenerationQueue } from "./components/GenerationQueue";
import { TimelinePreview } from "./components/TimelinePreview";

export default function ProductionPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");
  const [selectedShotIds, setSelectedShotIds] = useState<Set<string>>(new Set());
  const [queue, setQueue] = useState<GenerationTask[]>([]);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error("Failed to fetch project");
      const data = await response.json();
      setProject(data.project);

      const boardResponse = await fetch(`/api/projects/${projectId}/storyboard-data`);
      if (boardResponse.ok) {
        const boardData = await boardResponse.json();
        setStoryboard(boardData.storyboard);
        setShots(boardData.shots || []);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshShots = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/storyboard-data`);
      if (res.ok) {
        const data = await res.json();
        setShots(data.shots || []);
      }
    } catch (e) {
      console.error("Failed to refresh shots", e);
    }
  }, [projectId]);

  const handleSelectAll = () => {
    if (selectedShotIds.size === shots.length) {
      setSelectedShotIds(new Set());
    } else {
      setSelectedShotIds(new Set(shots.map((s) => s.id)));
    }
  };

  const handleSelectShot = (shotId: string) => {
    setSelectedShotIds((prev) => {
      const next = new Set(prev);
      if (next.has(shotId)) {
        next.delete(shotId);
      } else {
        next.add(shotId);
      }
      return next;
    });
  };

  const handleBatchGenerateImages = async (options?: { style?: string }) => {
    const targets = selectedShotIds.size > 0
      ? shots.filter((s) => selectedShotIds.has(s.id))
      : shots.filter((s) => s.imageStatus !== "completed");

    const tasks: GenerationTask[] = targets
      .filter((s) => s.imagePrompt)
      .map((shot) => ({
        id: `${shot.id}-image-${Date.now()}`,
        shotId: shot.id,
        type: "image" as const,
        status: "pending" as const,
        prompt: shot.imagePrompt || "",
        title: shot.title || `分镜 ${shot.index + 1}`,
        createdAt: Date.now(),
      }));

    if (tasks.length === 0) {
      alert("没有可生成的分镜（请确保已生成提示词）");
      return;
    }

    setQueue((prev) => [...prev, ...tasks]);

    for (const task of tasks) {
      await processTask(task, refreshShots, setQueue);
    }
  };

  const handleBatchGenerateVideos = async (options?: {}) => {
    const targets = selectedShotIds.size > 0
      ? shots.filter((s) => selectedShotIds.has(s.id))
      : shots.filter(
          (s) =>
            s.videoStatus !== "completed" &&
            s.imageStatus === "completed"
        );

    const tasks: GenerationTask[] = targets
      .filter((s) => s.videoPrompt && s.imageUrl)
      .map((shot) => ({
        id: `${shot.id}-video-${Date.now()}`,
        shotId: shot.id,
        type: "video" as const,
        status: "pending" as const,
        prompt: shot.videoPrompt || "",
        title: shot.title || `分镜 ${shot.index + 1}`,
        createdAt: Date.now(),
      }));

    if (tasks.length === 0) {
      alert("没有可生成分镜视频（请先生成图片并确保有视频提示词）");
      return;
    }

    setQueue((prev) => [...prev, ...tasks]);

    for (const task of tasks) {
      await processTask(task, refreshShots, setQueue);
    }
  };

  const handleRegenerateImage = async (shotId: string) => {
    const shot = shots.find((s) => s.id === shotId);
    if (!shot?.imagePrompt) return;

    const task: GenerationTask = {
      id: `${shotId}-image-regen-${Date.now()}`,
      shotId,
      type: "image",
      status: "pending",
      prompt: shot.imagePrompt,
      title: shot.title || `分镜 ${shot.index + 1}`,
      createdAt: Date.now(),
    };

    setQueue((prev) => [...prev, task]);
    await processTask(task, refreshShots, setQueue);
  };

  const handleRegenerateVideo = async (shotId: string) => {
    const shot = shots.find((s) => s.id === shotId);
    if (!shot?.videoPrompt || !shot.imageUrl) return;

    const task: GenerationTask = {
      id: `${shotId}-video-regen-${Date.now()}`,
      shotId,
      type: "video",
      status: "pending",
      prompt: shot.videoPrompt,
      title: shot.title || `分镜 ${shot.index + 1}`,
      createdAt: Date.now(),
    };

    setQueue((prev) => [...prev, task]);
    await processTask(task, refreshShots, setQueue);
  };

  const handleComplete = async () => {
    const completedImages = shots.filter(
      (s) => s.imageStatus === "completed"
    ).length;
    const completedVideos = shots.filter(
      (s) => s.videoStatus === "completed"
    ).length;

    await fetch(`/api/projects/${projectId}/stage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage: "production",
        status: "completed",
        data: {
          imagesCompleted: completedImages,
          videosCompleted: completedVideos,
        },
      }),
    });
    router.push(`/projects/${projectId}/complete`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!project || !storyboard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-zinc-500">
          项目不存在或尚未创建分镜，请先完成分镜设计
        </p>
      </div>
    );
  }

  const stats = {
    total: shots.length,
    imagesCompleted: shots.filter((s) => s.imageStatus === "completed").length,
    imagesPending: shots.filter((s) => s.imageStatus === "pending").length,
    imagesGenerating: shots.filter((s) => s.imageStatus === "generating").length,
    imagesFailed: shots.filter((s) => s.imageStatus === "failed").length,
    videosCompleted: shots.filter((s) => s.videoStatus === "completed").length,
    videosPending: shots.filter(
      (s) =>
        s.videoStatus === "pending" &&
        s.imageStatus === "completed"
    ).length,
    videosGenerating: shots.filter((s) => s.videoStatus === "generating")
      .length,
    videosFailed: shots.filter((s) => s.videoStatus === "failed").length,
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <StageNavigator project={project} currentStage="production" />

      <div className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            素材创作
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            批量生成分镜图片与视频，完成最终素材制作
          </p>
        </div>

        {/* Toolbar */}
        <ProductionToolbar
          stats={stats}
          selectedCount={selectedShotIds.size}
          totalCount={shots.length}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onSelectAll={handleSelectAll}
          onBatchGenerateImages={handleBatchGenerateImages}
          onBatchGenerateVideos={handleBatchGenerateVideos}
        />

        {/* Generation Queue */}
        {queue.length > 0 && (
          <GenerationQueue
            queue={queue}
            onCancelTask={(taskId) =>
              setQueue((prev) => prev.filter((t) => t.id !== taskId))
            }
          />
        )}

        {/* Main Content */}
        {viewMode === "grid" ? (
          <ShotGrid
            shots={shots}
            selectedShotIds={selectedShotIds}
            onSelectShot={handleSelectShot}
            onRegenerateImage={handleRegenerateImage}
            onRegenerateVideo={handleRegenerateVideo}
            onRefresh={refreshShots}
          />
        ) : (
          <TimelinePreview
            shots={shots}
            onRegenerateImage={handleRegenerateImage}
            onRegenerateVideo={handleRegenerateVideo}
          />
        )}

        {/* Actions */}
        <div className="mt-8 flex justify-between items-center">
          <button
            onClick={() => router.push(`/projects/${projectId}/storyboard`)}
            className="px-6 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            ← 返回分镜设计
          </button>
          <Button
            onClick={handleComplete}
            disabled={stats.imagesCompleted === 0}
          >
            完成项目
            <svg className="w-4 h-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}

// Types
export interface GenerationTask {
  id: string;
  shotId: string;
  type: "image" | "video";
  status: "pending" | "processing" | "completed" | "failed";
  prompt: string;
  title: string;
  error?: string;
  resultUrl?: string;
  progress?: number;
  createdAt: number;
}

export interface BatchGenerateOptions {
  style?: string;
}

async function processTask(
  task: GenerationTask,
  onRefresh: () => void,
  setQueue: React.Dispatch<React.SetStateAction<GenerationTask[]>>
) {
  setQueue((prev) =>
    prev.map((t) => (t.id === task.id ? { ...t, status: "processing" as const } : t))
  );

  try {
    const endpoint =
      task.type === "image"
        ? "/api/generate/shot-image"
        : "/api/generate/shot-video";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shotId: task.shotId,
        prompt: task.prompt,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      setQueue((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: "completed" as const,
                resultUrl: result.imageUrl || result.videoUrl,
              }
            : t
        )
      );
      onRefresh();
    } else {
      throw new Error(result.error || "生成失败");
    }
  } catch (error) {
    console.error(`Task ${task.id} failed:`, error);
    setQueue((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              status: "failed" as const,
              error: error instanceof Error ? error.message : "未知错误",
            }
          : t
      )
    );
  }
}
