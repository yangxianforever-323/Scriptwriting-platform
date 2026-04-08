"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { StageNavigator } from "@/components/project/StageNavigator";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { storyboardDb, shotDb } from "@/lib/db/storyboard";
import { storyDb } from "@/lib/db/story";
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

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error("Failed to fetch project");
      const data = await response.json();
      setProject(data.project);

      const storyData = storyDb.getByProjectId(projectId);
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
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (updatedStoryboard: Storyboard, updatedShots: Shot[]) => {
    setStoryboard(updatedStoryboard);
    setShots(updatedShots);
  };

  const handleComplete = async () => {
    await fetch(`/api/projects/${projectId}/stage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage: "storyboard",
        status: "completed",
        data: {
          shotsCount: shots.length,
          versionsCount: storyboardDb.getByProjectId(projectId).length,
        },
      }),
    });
    router.push(`/projects/${projectId}/production`);
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            分镜设计
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            设计您的分镜，规划每个镜头的视觉呈现
          </p>
        </div>

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
          <button
            onClick={() => router.push(`/projects/${projectId}/story`)}
            className="px-6 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            ← 返回故事开发
          </button>
          <button
            onClick={handleComplete}
            disabled={shots.length === 0}
            className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            完成并进入素材创作
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
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
      </div>
    </div>
  );
}
