"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { StageNavigator } from "@/components/project/StageNavigator";
import { Spinner } from "@/components/ui/Spinner";
import type { Project } from "@/types/database";

export default function PlanningPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [logline, setLogline] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [genre, setGenre] = useState("");
  const [targetDuration, setTargetDuration] = useState<number>(60);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error("Failed to fetch project");
      const data = await response.json();
      setProject(data.project);
      
      // Load existing data
      const progress = data.project.stage_progress;
      if (progress?.planning?.data) {
        setLogline(progress.planning.data.logline || "");
        setSynopsis(progress.planning.data.synopsis || "");
        setGenre(progress.planning.data.genre || "");
        setTargetDuration(progress.planning.data.targetDuration || 60);
      }
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage_progress: {
            ...project?.stage_progress,
            planning: {
              status: "completed",
              completedAt: new Date().toISOString(),
              data: {
                logline,
                synopsis,
                genre,
                targetDuration,
              },
            },
          },
        }),
      });
      
      if (!response.ok) throw new Error("Failed to save");
      
      // Unlock next stage and navigate
      await fetch(`/api/projects/${projectId}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: "planning",
          status: "completed",
        }),
      });
      
      router.push(`/projects/${projectId}/story`);
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-zinc-500">项目不存在</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <StageNavigator project={project} currentStage="planning" />
      
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            项目规划
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8">
            定义您的项目核心概念和目标
          </p>

          <div className="space-y-6">
            {/* Logline */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                一句话概括 (Logline)
                <span className="text-zinc-400 text-xs ml-2">用一句话描述您的故事核心</span>
              </label>
              <textarea
                value={logline}
                onChange={(e) => setLogline(e.target.value)}
                placeholder="例如：一个孤独的图书管理员在无尽的高耸书架间发现了一个通往平行世界的秘密通道..."
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
              />
            </div>

            {/* Synopsis */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                剧情梗概
                <span className="text-zinc-400 text-xs ml-2">简要描述故事的主要情节</span>
              </label>
              <textarea
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="描述故事的开端、发展和结局..."
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={6}
              />
            </div>

            {/* Genre */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                类型/风格
              </label>
              <select
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              </select>
            </div>

            {/* Target Duration */}
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                目标时长
                <span className="text-zinc-400 text-xs ml-2">预计视频总时长（秒）</span>
              </label>
              <input
                type="number"
                value={targetDuration}
                onChange={(e) => setTargetDuration(Number(e.target.value))}
                min={15}
                max={300}
                className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-zinc-500">
                建议：短视频 15-60秒，短片 60-180秒
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-end gap-4">
            <button
              onClick={() => router.push(`/projects/${projectId}`)}
              className="px-6 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              返回项目
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !logline.trim()}
              className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Spinner size="sm" />
                  保存中...
                </>
              ) : (
                <>
                  完成并进入故事开发
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
