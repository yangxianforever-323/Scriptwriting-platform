"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateProjectPage() {
  const router = useRouter();
  const [projectName, setProjectName] = useState("");
  const [projectType, setProjectType] = useState<"novel" | "script" | "idea">("novel");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!projectName.trim()) {
      setError("请输入项目名称");
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName,
          type: projectType,
        }),
      });

      if (!response.ok) {
        throw new Error("创建失败");
      }

      const project = await response.json();
      router.push(`/projects/${project.id}/planning`);
    } catch (err) {
      setError("创建项目失败，请重试");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-white to-zinc-100 dark:from-zinc-900 dark:to-zinc-800">
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/projects" className="inline-flex items-center gap-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              返回项目列表
            </Link>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              创建新项目
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              输入项目信息，开始您的创作之旅
            </p>
          </div>

          <form onSubmit={handleCreate} className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-6 shadow-lg">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  项目名称 *
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="输入项目名称"
                  className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                  项目类型
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setProjectType("novel")}
                    className={`p-4 rounded-lg border-2 transition-all text-center ${
                      projectType === "novel"
                        ? "border-zinc-600 bg-zinc-50 dark:bg-zinc-700"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                    }`}
                  >
                    <div className="text-2xl mb-1">📚</div>
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">小说改编</div>
                    <div className="text-xs text-zinc-500 mt-1">导入小说AI分析</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProjectType("script")}
                    className={`p-4 rounded-lg border-2 transition-all text-center ${
                      projectType === "script"
                        ? "border-zinc-600 bg-zinc-50 dark:bg-zinc-700"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                    }`}
                  >
                    <div className="text-2xl mb-1">✍️</div>
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">原创剧本</div>
                    <div className="text-xs text-zinc-500 mt-1">手动编写剧本</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setProjectType("idea")}
                    className={`p-4 rounded-lg border-2 transition-all text-center ${
                      projectType === "idea"
                        ? "border-zinc-600 bg-zinc-50 dark:bg-zinc-700"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                    }`}
                  >
                    <div className="text-2xl mb-1">💡</div>
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">创意想法</div>
                    <div className="text-xs text-zinc-500 mt-1">AI辅助生成</div>
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isCreating}
                className="w-full h-12 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? "创建中..." : "创建项目"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            <p>创建后将进入项目规划阶段</p>
          </div>
        </div>
      </main>
    </div>
  );
}
