"use client";

import { useState } from "react";
import type { Storyboard, Shot } from "@/types/storyboard";
import type { Story } from "@/types/story";
import type { AuditReport } from "@/types/audit";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";

interface StoryboardToolbarProps {
  storyboard: Storyboard;
  shots: Shot[];
  story: Story | null;
  viewMode: "grid" | "list" | "timeline";
  onViewModeChange: (mode: "grid" | "list" | "timeline") => void;
  onAddShot: () => void;
  onOpenVersionManager: () => void;
  onShotsGenerated?: (shots: Shot[]) => void;
}

export function StoryboardToolbar({
  storyboard,
  shots,
  story,
  viewMode,
  onViewModeChange,
  onAddShot,
  onOpenVersionManager,
  onShotsGenerated,
}: StoryboardToolbarProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [generateOptions, setGenerateOptions] = useState({
    shotsPerScene: 2,
    style: "",
    includeDialogue: true,
  });
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [showAuditDialog, setShowAuditDialog] = useState(false);

  const totalDuration = shots.reduce((acc, shot) => acc + shot.duration, 0);
  const completedImages = shots.filter((s) => s.imageStatus === "completed").length;
  const completedVideos = shots.filter((s) => s.videoStatus === "completed").length;

  const handleGenerateStoryboard = async () => {
    if (!story) {
      alert("请先完成故事开发");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/generate-storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId: story.id,
          storyboardId: storyboard.id,
          style: generateOptions.style,
          options: {
            shotsPerScene: generateOptions.shotsPerScene,
            includeDialogue: generateOptions.includeDialogue,
          },
        }),
      });

      if (!response.ok) throw new Error("生成失败");

      const result = await response.json();
      
      if (onShotsGenerated) {
        onShotsGenerated(result.shots);
      }

      setShowGenerateDialog(false);
      alert(`成功生成 ${result.shotsGenerated} 个分镜`);
    } catch (error) {
      console.error("Error generating storyboard:", error);
      alert("生成失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAuditStoryboard = async () => {
    if (shots.length === 0) {
      alert("请先生成分镜");
      return;
    }

    setIsAuditing(true);
    setAuditReport(null);
    setShowAuditDialog(true);
    try {
      const response = await fetch("/api/ai/audit-storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyboardId: storyboard.id,
          strictMode: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "审计失败");
      }

      const result = await response.json();
      setAuditReport(result.report);
    } catch (error) {
      console.error("Error auditing storyboard:", error);
      alert(error instanceof Error ? error.message : "审计失败，请重试");
      setShowAuditDialog(false);
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {storyboard.name}
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                版本 {storyboard.version} {storyboard.isActive && "(当前)"}
              </p>
            </div>
            <button
              onClick={onOpenVersionManager}
              className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              版本管理
            </button>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {shots.length}
              </div>
              <div className="text-zinc-500 dark:text-zinc-400">分镜</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {Math.round(totalDuration)}s
              </div>
              <div className="text-zinc-500 dark:text-zinc-400">总时长</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                {completedImages}/{shots.length}
              </div>
              <div className="text-zinc-500 dark:text-zinc-400">图片</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {completedVideos}/{shots.length}
              </div>
              <div className="text-zinc-500 dark:text-zinc-400">视频</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
              <button
                onClick={() => onViewModeChange("grid")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "grid"
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
                title="网格视图"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => onViewModeChange("list")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "list"
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
                title="列表视图"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => onViewModeChange("timeline")}
                className={`p-2 rounded transition-colors ${
                  viewMode === "timeline"
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
                title="时间线视图"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {shots.length > 0 && (
                <button
                  onClick={handleAuditStoryboard}
                  disabled={isAuditing}
                  className="px-3 py-2 text-sm border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {isAuditing ? "审计中..." : "AI审计"}
                </button>
              )}
              {shots.length === 0 && story && (
                <button
                  onClick={() => setShowGenerateDialog(true)}
                  className="px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  自动生成
                </button>
              )}
              <button
                className="px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                批量生成
              </button>
              <button
                onClick={onAddShot}
                className="px-3 py-2 text-sm bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                添加分镜
              </button>
            </div>
          </div>
        </div>

        {story && shots.length === 0 && (
          <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-900/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-purple-900 dark:text-purple-100">自动生成分镜</h4>
                  <p className="text-sm text-purple-600 dark:text-purple-400">根据故事场景自动生成分镜脚本</p>
                </div>
              </div>
              <Button onClick={() => setShowGenerateDialog(true)}>
                开始生成
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>自动生成分镜</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2">每场景分镜数</label>
              <select
                value={generateOptions.shotsPerScene}
                onChange={(e) => setGenerateOptions({ ...generateOptions, shotsPerScene: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              >
                <option value={1}>1 个分镜（简洁）</option>
                <option value={2}>2 个分镜（标准）</option>
                <option value={3}>3 个分镜（详细）</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">视觉风格（可选）</label>
              <input
                type="text"
                value={generateOptions.style}
                onChange={(e) => setGenerateOptions({ ...generateOptions, style: e.target.value })}
                placeholder="例如：电影感、动漫风格、写实..."
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeDialogue"
                checked={generateOptions.includeDialogue}
                onChange={(e) => setGenerateOptions({ ...generateOptions, includeDialogue: e.target.checked })}
                className="rounded border-zinc-300"
              />
              <label htmlFor="includeDialogue" className="text-sm">包含对白信息</label>
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-sm text-zinc-600 dark:text-zinc-400">
              <p>将根据故事中的场景自动生成：</p>
              <ul className="mt-2 space-y-1">
                <li>• 建立镜头（远景）</li>
                <li>• 角色镜头（中景）</li>
                <li>• 特写镜头（如选择详细模式）</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              取消
            </Button>
            <Button onClick={handleGenerateStoryboard} disabled={isGenerating}>
              {isGenerating ? "生成中..." : "开始生成"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAuditDialog} onOpenChange={setShowAuditDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI 质量审计</DialogTitle>
          </DialogHeader>

          {isAuditing && !auditReport && (
            <div className="py-12 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <p className="text-sm text-zinc-500">正在审计分镜质量...</p>
            </div>
          )}

          {auditReport && (
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-center">
                  <div className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{auditReport.overallScore}</div>
                  <div className="text-xs text-zinc-500">综合评分</div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                  <div className="text-xl font-bold text-green-600">{auditReport.passedScenes}</div>
                  <div className="text-xs text-green-600">通过</div>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center">
                  <div className="text-xl font-bold text-amber-600">{auditReport.warningScenes}</div>
                  <div className="text-xs text-amber-600">警告</div>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                  <div className="text-xl font-bold text-red-600">{auditReport.errorScenes}</div>
                  <div className="text-xs text-red-600">错误</div>
                </div>
              </div>

              {auditReport.summary.topIssues.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">主要问题</h4>
                  <div className="space-y-2">
                    {auditReport.summary.topIssues.slice(0, 8).map((issue, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg text-sm ${
                          issue.severity === "error"
                            ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30"
                            : issue.severity === "warning"
                            ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30"
                            : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                            issue.severity === "error" ? "bg-red-100 text-red-700" :
                            issue.severity === "warning" ? "bg-amber-100 text-amber-700" :
                            "bg-blue-100 text-blue-700"
                          }`}>
                            {issue.severity === "error" ? "错误" : issue.severity === "warning" ? "警告" : "提示"}
                          </span>
                          <span className="text-xs text-zinc-500">{issue.dimension}</span>
                        </div>
                        <p className="text-zinc-700 dark:text-zinc-300">{issue.message}</p>
                        {issue.suggestion && (
                          <p className="text-xs text-zinc-500 mt-1">建议：{issue.suggestion}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {auditReport.summary.recommendations.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">优化建议</h4>
                  <ul className="space-y-1">
                    {auditReport.summary.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
