"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { StageNavigator } from "@/components/project/StageNavigator";
import { Spinner } from "@/components/ui/Spinner";
import { Tooltip } from "@/components/ui/Tooltip";
import { PlanningTabs } from "./components/PlanningTabs";
import { ManualPlanningTab } from "./tabs/ManualPlanningTab";
import { NovelImportTab } from "./tabs/NovelImportTab";
import { AIAssistTab } from "./tabs/AIAssistTab";
import type { Project } from "@/types/database";

interface NovelAnalysisResult {
  title: string;
  logline: string;
  synopsis: string;
  genre: string;
  targetDuration: number;
  characters: Array<{
    name: string;
    description: string;
    role: string;
    appearance: string;
  }>;
  locations: Array<{
    name: string;
    description: string;
  }>;
  acts: Array<{
    title: string;
    description: string;
    scenes: Array<{
      title: string;
      description: string;
      location: string;
      characters: string[];
    }>;
  }>;
}

export default function PlanningPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"manual" | "novel" | "ai">("manual");
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
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

      await fetch(`/api/projects/${projectId}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: "planning",
          status: "completed",
        }),
      });

      await new Promise(resolve => setTimeout(resolve, 300));
      router.push(`/projects/${projectId}/story`);
    } catch (error) {
      console.error("Error saving:", error);
      setError("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleNovelAnalysisComplete = async (result: NovelAnalysisResult) => {
    setLogline(result.logline);
    setSynopsis(result.synopsis);
    setGenre(result.genre);
    setTargetDuration(result.targetDuration);

    try {
      console.log("Saving analysis data to session...");
      sessionStorage.setItem(`analysis_${projectId}`, JSON.stringify(result));

      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: result.title,
          stage_progress: {
            ...project?.stage_progress,
            planning: {
              status: "completed",
              completedAt: new Date().toISOString(),
              data: {
                logline: result.logline,
                synopsis: result.synopsis,
                genre: result.genre,
                targetDuration: result.targetDuration,
              },
            },
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to save project");

      await fetch(`/api/projects/${projectId}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: "planning",
          status: "completed",
        }),
      });

      console.log("Navigating to review page...");
      router.push(`/projects/${projectId}/planning/review`);
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "保存失败，请重试");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <p className="text-zinc-500">项目不存在</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <StageNavigator project={project} currentStage="planning" />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              项目规划
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
              选择您喜欢的方式开始创作
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="px-6 pt-4">
            <PlanningTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "manual" && (
              <ManualPlanningTab
                logline={logline}
                synopsis={synopsis}
                genre={genre}
                targetDuration={targetDuration}
                onLoglineChange={setLogline}
                onSynopsisChange={setSynopsis}
                onGenreChange={setGenre}
                onTargetDurationChange={setTargetDuration}
              />
            )}

            {activeTab === "novel" && (
              <NovelImportTab onAnalysisComplete={handleNovelAnalysisComplete} />
            )}

            {activeTab === "ai" && (
              <AIAssistTab
                logline={logline}
                synopsis={synopsis}
                genre={genre}
                onLoglineChange={setLogline}
                onSynopsisChange={setSynopsis}
                onGenreChange={setGenre}
              />
            )}
          </div>

          {/* Actions - Only show for manual and AI tabs */}
          {activeTab !== "novel" && (
            <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-4">
              <button
                onClick={() => router.push(`/projects/${projectId}`)}
                className="px-5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm"
              >
                返回项目
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !logline.trim()}
                className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium"
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
          )}
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-zinc-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              <p className="font-medium text-zinc-600 dark:text-zinc-300 mb-1">提示</p>
              <ul className="space-y-1 text-xs">
                <li>• <strong>手动规划</strong>：适合已有明确创意的项目</li>
                <li>• <strong>小说导入</strong>：上传小说文件，AI 自动分析提取角色、场景、情节</li>
                <li>• <strong>AI 辅助</strong>：输入关键词或选择类型，AI 生成创意建议</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
