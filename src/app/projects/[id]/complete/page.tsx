"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { StageNavigator } from "@/components/project/StageNavigator";
import { Spinner } from "@/components/ui/Spinner";
import type { Project } from "@/types/database";

export default function CompletePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

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
      <StageNavigator project={project} currentStage="complete" />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            项目完成
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8">
            恭喜！您的项目已完成所有阶段
          </p>

          {/* Completion Summary */}
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-green-800 dark:text-green-200">
                  项目已完成
                </h2>
                <p className="text-sm text-green-600 dark:text-green-400">
                  所有阶段已成功完成
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">✓</p>
                <p className="text-xs text-zinc-500">项目规划</p>
              </div>
              <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">✓</p>
                <p className="text-xs text-zinc-500">故事开发</p>
              </div>
              <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">✓</p>
                <p className="text-xs text-zinc-500">分镜设计</p>
              </div>
              <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">✓</p>
                <p className="text-xs text-zinc-500">素材创作</p>
              </div>
            </div>
          </div>

          {/* Project Info */}
          <div className="space-y-4 mb-8">
            <h3 className="font-medium text-zinc-900 dark:text-zinc-100">项目信息</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
                <p className="text-sm text-zinc-500">项目名称</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">{project.title}</p>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-4">
                <p className="text-sm text-zinc-500">创建时间</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.push(`/projects/${projectId}/production`)}
              className="px-6 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              ← 返回素材创作
            </button>
            <button
              onClick={() => router.push(`/projects/${projectId}`)}
              className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              查看项目详情
            </button>
            <button
              onClick={() => router.push("/projects")}
              className="px-6 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              返回项目列表
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
