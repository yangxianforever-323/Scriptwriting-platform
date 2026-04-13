"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { StageNavigator } from "@/components/project/StageNavigator";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { storyboardDb, shotDb } from "@/lib/db/storyboard";
import { storyDb } from "@/lib/db/story";
import { saveStageProgress, createAutoSave } from "@/lib/save-utils";
import type { Project } from "@/types/database";
import type { Storyboard, Shot } from "@/types/storyboard";
import type { Story } from "@/types/story";
import { StoryboardEditor } from "./StoryboardEditor";

export default function StoryboardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const autoSaveRef = useRef<ReturnType<typeof createAutoSave> | null>(null);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    loadData();

    return () => {
      isMountedRef.current = false;
    };
  }, [projectId]);

  useEffect(() => {
    if (!storyboard || shots.length === 0) return;

    autoSaveRef.current = createAutoSave(async () => {
      const currentBoard = storyboardDb.getByProjectId(projectId);
      if (!currentBoard) return;

      const allShots = shotDb.getByStoryboardId(currentBoard.id);

      const result = await saveStageProgress({
        projectId,
        stage: "storyboard",
        status: "in_progress",
        data: {
          storyboardId: currentBoard.id,
          shotsCount: allShots.length,
          updatedAt: new Date().toISOString(),
        },
      });

      if (!result.success) {
        console.error("Auto-save failed:", result.error);
      }
    }, 3000);

    return () => {
      autoSaveRef.current?.cancel();
    };
  }, [projectId, storyboard?.id, shots.length]);

  const loadData = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error("Failed to fetch project");
      const data = await response.json();
      setProject(data.project);

      let storyData = null;
      try {
        const storyResponse = await fetch(`/api/projects/${projectId}/story-data`);
        if (storyResponse.ok) {
          const storyResult = await storyResponse.json();
          if (storyResult.story) {
            storyData = storyResult.story;
            if (storyResult.characters) storyData.characters = storyResult.characters;
            if (storyResult.locations) storyData.locations = storyResult.locations;
            if (storyResult.props) storyData.props = storyResult.props;
            if (storyResult.acts) storyData.acts = storyResult.acts;
          }
        }
      } catch (e) {
        console.log("Story data not available from API");
      }

      setStory(storyData);

      let activeBoard = storyboardDb.getActiveByProjectId(projectId);
      if (!activeBoard) {
        activeBoard = storyboardDb.create(projectId, {
          name: "版本 1",
          description: "默认分镜板",
        });
      }
      setStoryboard(activeBoard);

      const shotList = shotDb.getByStoryboardId(activeBoard.id);
      setShots(shotList);
      setSaveStatus("已加载");
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = useCallback((updatedStoryboard: Storyboard, updatedShots: Shot[]) => {
    setStoryboard(updatedStoryboard);
    setShots(updatedShots);
    setHasUnsavedChanges(true);
    autoSaveRef.current?.trigger();
  }, []);

  const handleManualSave = async () => {
    if (!storyboard) return;

    setSaving(true);
    setError(null);
    setSaveStatus("保存中...");

    try {
      const currentBoard = storyboardDb.getByProjectId(projectId);
      if (!currentBoard) throw new Error("Storyboard not found");

      const allShots = shotDb.getByStoryboardId(currentBoard.id);

      const result = await saveStageProgress({
        projectId,
        stage: "storyboard",
        status: "in_progress",
        data: {
          storyboardId: currentBoard.id,
          shotsCount: allShots.length,
          updatedAt: new Date().toISOString(),
        },
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setHasUnsavedChanges(false);
      setSaveStatus("已保存");

      setTimeout(() => {
        if (isMountedRef.current) {
          setSaveStatus("");
        }
      }, 2000);
    } catch (error) {
      console.error("Error saving:", error);
      setError("保存失败，请重试");
      setSaveStatus("");
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  };

  const handleComplete = async () => {
    if (!storyboard) return;

    setSaving(true);
    setError(null);

    try {
      const currentBoard = storyboardDb.getByProjectId(projectId);
      if (!currentBoard) throw new Error("Storyboard not found");

      const allShots = shotDb.getByStoryboardId(currentBoard.id);

      await saveStageProgress({
        projectId,
        stage: "storyboard",
        status: "completed",
        data: {
          storyboardId: currentBoard.id,
          shotsCount: allShots.length,
          completedAt: new Date().toISOString(),
        },
      });

      await fetch(`/api/projects/${projectId}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: "storyboard",
          status: "completed",
          data: {
            shotsCount: allShots.length,
            versionsCount: storyboardDb.getByProjectId(projectId).length,
          },
        }),
      });

      await new Promise((resolve) => setTimeout(resolve, 300));
      router.push(`/projects/${projectId}/production`);
    } catch (error) {
      console.error("Error completing storyboard:", error);
      setError(error instanceof Error ? error.message : "保存失败，请重试");
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
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
        <p className="text-zinc-500">项目不存在</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <StageNavigator project={project} currentStage="storyboard" />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              分镜设计
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              设计您的分镜，规划每个镜头的视觉呈现
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saveStatus && (
              <span className={`text-sm ${saveStatus.includes("失败") ? "text-red-500" : "text-green-500"}`}>
                {saveStatus}
              </span>
            )}
            {hasUnsavedChanges && !saving && (
              <span className="text-xs text-amber-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                未保存
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Storyboard Editor */}
        {story && (
          <StoryboardEditor
            storyboard={storyboard}
            shots={shots}
            story={story}
            onUpdate={handleUpdate}
          />
        )}

        {!story && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-12 text-center">
            <svg
              className="mx-auto h-16 w-16 text-zinc-300 dark:text-zinc-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-100">
              请先完成故事开发
            </h3>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
              需要先创建故事内容才能进行分镜设计
            </p>
            <Button
              className="mt-6"
              onClick={() => router.push(`/projects/${projectId}/story`)}
            >
              前往故事开发
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex justify-between items-center">
          <div className="flex gap-3">
            <button
              onClick={handleManualSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm flex items-center gap-2"
            >
              {saving ? (
                <Spinner size="sm" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              )}
              保存
            </button>
            <button
              onClick={() => router.push(`/projects/${projectId}/story`)}
              disabled={saving}
              className="px-5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm"
            >
              返回故事开发
            </button>
          </div>
          <button
            onClick={handleComplete}
            disabled={saving || shots.length === 0}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium"
          >
            {saving ? (
              <>
                <Spinner size="sm" />
                保存中...
              </>
            ) : (
              <>
                完成并进入素材创作
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </div>

        {/* Stats Summary */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{shots.length}</p>
            <p className="text-sm text-zinc-500">分镜总数</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {Math.round(shots.reduce((acc, s) => acc + s.duration, 0))}s
            </p>
            <p className="text-sm text-zinc-500">总时长</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {shots.filter((s) => s.imageStatus === "completed").length}
            </p>
            <p className="text-sm text-zinc-500">图片完成</p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-4 border border-zinc-200 dark:border-zinc-800">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {shots.filter((s) => s.videoStatus === "completed").length}
            </p>
            <p className="text-sm text-zinc-500">视频完成</p>
          </div>
        </div>

        {/* Save Info */}
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-green-700 dark:text-green-300">
              <p className="font-medium mb-1">保存机制</p>
              <ul className="space-y-1 text-xs">
                <li>✓ <strong>自动保存</strong>：修改内容后约3秒自动保存</li>
                <li>✓ <strong>手动保存</strong>：点击"保存"按钮立即保存</li>
                <li>✓ <strong>完成时保存</strong>：点击"完成并进入素材创作"保存所有数据</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
