"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { StageNavigator } from "@/components/project/StageNavigator";
import { Spinner } from "@/components/ui/Spinner";
import { PlanningTabs } from "./components/PlanningTabs";
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
  props: Array<{
    name: string;
    description: string;
    importance: string;
  }>;
  acts: Array<{
    title: string;
    description: string;
    scenes: Array<{
      title: string;
      description: string;
      location: string;
      characters: string[];
      props?: string[];
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
  const [activeTab, setActiveTab] = useState<"novel" | "ai">("novel");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error("Failed to fetch project");
      const data = await response.json();
      setProject(data.project);
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNovelAnalysisComplete = async (result: NovelAnalysisResult) => {
    try {
      console.log("Saving analysis data...");
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

      if (result.characters?.length || result.locations?.length || result.acts?.length || result.props?.length) {
        const applyResponse = await fetch(`/api/projects/${projectId}/apply-analysis`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: result.title,
            logline: result.logline,
            synopsis: result.synopsis,
            genre: result.genre,
            targetDuration: result.targetDuration,
            characters: result.characters,
            locations: result.locations,
            props: result.props,
            acts: result.acts,
          }),
        });

        if (!applyResponse.ok) {
          const errorData = await applyResponse.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to apply analysis");
        }
      }

      await fetch(`/api/projects/${projectId}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: "planning",
          status: "completed",
        }),
      });

      console.log("All data saved successfully, navigating to review page...");
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
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                项目规划
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                选择您喜欢的方式开始创作
              </p>
            </div>
          </div>

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

          <div className="px-6 pt-4">
            <PlanningTabs
              activeTab={activeTab}
              onTabChange={(tabId) => setActiveTab(tabId as "novel" | "ai")}
            />
          </div>

          <div className="p-6">
            {activeTab === "novel" && (
              <NovelImportTab onAnalysisComplete={handleNovelAnalysisComplete} />
            )}

            {activeTab === "ai" && (
              <AIAssistTab
                logline=""
                synopsis=""
                genre=""
                onLoglineChange={() => {}}
                onSynopsisChange={() => {}}
                onGenreChange={() => {}}
              />
            )}
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">创作方式说明</p>
              <ul className="space-y-1 text-xs">
                <li>• <strong>小说导入</strong>：上传小说文件，AI 自动分析提取角色、场景、情节、道具等信息</li>
                <li>• <strong>AI 辅助</strong>：输入关键词或选择类型，AI 生成创意建议和故事框架</li>
                <li className="text-green-600 dark:text-green-400 mt-2">✓ 分析完成后自动保存数据并进入结果确认页面</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
