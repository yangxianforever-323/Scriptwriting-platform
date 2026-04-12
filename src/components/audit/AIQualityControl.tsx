"use client";

import React, { useState } from "react";
import type { AuditReport } from "@/types/audit";

interface AIQualityControlProps {
  projectId: string;
  onAuditComplete?: (report: AuditReport) => void;
  onFixComplete?: (result: any) => void;
}

export function AIQualityControl({ projectId, onAuditComplete, onFixComplete }: AIQualityControlProps) {
  const [isAuditing, setIsAuditing] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"audit" | "style">("audit");

  const handleAudit = async () => {
    setIsAuditing(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/audit-scenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "审计失败");
      setAuditReport(data.report);
      onAuditComplete?.(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "审计失败");
    } finally {
      setIsAuditing(false);
    }
  };

  const handleAutoFix = async () => {
    if (!auditReport) return;
    setIsFixing(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/fix-scenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, autoFix: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "修复失败");
      setAuditReport(data.result?.reportAfter || null);
      onFixComplete?.(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "修复失败");
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="rounded-xl border border-purple-200 bg-purple-50/30 dark:border-purple-800/50 dark:bg-purple-900/10 overflow-hidden">
      <div className="p-4 border-b border-purple-200/50 dark:border-purple-800/30">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-purple-900 dark:text-purple-100">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          AI 质量控制
        </h3>

        <div className="flex gap-2 mt-3">
          <button
            onClick={handleAudit}
            disabled={isAuditing || isFixing}
            className="px-3 py-1.5 text-xs rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-1"
          >
            {isAuditing ? (
              <>
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                审计中...
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                运行审计
              </>
            )}
          </button>

          {auditReport && (
            <button
              onClick={handleAutoFix}
              disabled={isFixing || isAuditing || auditReport.overallScore >= 85}
              className="px-3 py-1.5 text-xs rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-1"
            >
              {isFixing ? (
                <>
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  修复中...
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  一键修复 ({auditReport.overallScore}分)
                </>
              )}
            </button>
          )}

          {auditReport && (
            <AuditBadge passed={auditReport.overallScore >= 80} score={auditReport.overallScore} />
          )}
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {auditReport && (
        <div className="max-h-[400px] overflow-y-auto">
          <AuditResultPanel report={auditReport} onFixIssue={(idx) => {
            console.log("Fix scene:", idx);
          }} />
        </div>
      )}

      {!auditReport && !error && (
        <div className="p-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          <svg className="w-10 h-10 mx-auto mb-2 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          点击「运行审计」检查分镜质量
        </div>
      )}
    </div>
  );
}

export function SceneAuditBadge({ sceneIndex, score }: { sceneIndex: number; score?: number }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
      score === undefined ? "bg-gray-100 text-gray-500" :
      score >= 85 ? "bg-green-100 text-green-700" :
      score >= 70 ? "bg-yellow-100 text-yellow-700" :
      "bg-red-100 text-red-700"
    }`}>
      #{sceneIndex + 1}{score !== undefined ? ` ${score}` : ""}
    </span>
  );
}

interface AuditResultPanelProps {
  report: AuditReport;
  onFixIssue?: (sceneIndex: number) => void;
}

function getSeverityColor(severity: "error" | "warning" | "info"): string {
  switch (severity) {
    case "error":
      return "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800";
    case "warning":
      return "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-800";
    case "info":
      return "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800";
    default:
      return "text-zinc-600 bg-zinc-50 border-zinc-200 dark:text-zinc-400 dark:bg-zinc-800/30 dark:border-zinc-700";
  }
}

function getSeverityIcon(severity: "error" | "warning" | "info"): string {
  switch (severity) {
    case "error": return "❌";
    case "warning": return "⚠️";
    case "info": return "ℹ️";
    default: return "";
  }
}

function getScoreColor(score: number): string {
  if (score >= 90) return "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400";
  if (score >= 70) return "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400";
  if (score >= 50) return "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400";
  return "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400";
}

export function AuditResultPanel({ report, onFixIssue }: AuditResultPanelProps) {
  const [expandedScene, setExpandedScene] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "scenes" | "dimensions">("overview");

  const passRate = Math.round((report.passedScenes / report.totalScenes) * 100);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
      <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              分镜审计报告
            </h3>
            <p className="text-sm text-zinc-500 mt-1">共审计 {report.totalScenes} 个场景</p>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-bold ${getScoreColor(report.overallScore)}`}>
            {report.overallScore}分
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 mt-4">
          <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
            <div className="text-xl font-bold text-green-600 dark:text-green-400">{report.passedScenes}</div>
            <div className="text-xs text-green-600/70 dark:text-green-500/70">通过</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{report.warningScenes}</div>
            <div className="text-xs text-amber-600/70 dark:text-amber-500/70">警告</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
            <div className="text-xl font-bold text-red-600 dark:text-red-400">{report.errorScenes}</div>
            <div className="text-xs text-red-600/70 dark:text-red-500/70">错误</div>
          </div>
          <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{passRate}%</div>
            <div className="text-xs text-blue-600/70 dark:text-blue-500/70">通过率</div>
          </div>
        </div>
      </div>

      <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-4">
        {(["overview", "scenes", "dimensions"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === tab
                ? "text-purple-600 dark:text-purple-400"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {{ overview: "总览", scenes: "逐场分析", dimensions: "维度评分" }[tab]}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-t" />
            )}
          </button>
        ))}
      </div>

      <div className="p-5 max-h-[500px] overflow-y-auto">
        {activeTab === "overview" && (
          <div className="space-y-4">
            {report.summary.topIssues.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">🔴 主要问题</h4>
                <div className="space-y-2">
                  {report.summary.topIssues.slice(0, 6).map((issue, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${getSeverityColor(issue.severity)}`}
                    >
                      <div className="flex items-start gap-2">
                        <span>{getSeverityIcon(issue.severity)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{issue.message}</p>
                          <p className="text-xs mt-1 opacity-80">{issue.suggestion}</p>
                        </div>
                        <span className="text-xs opacity-60 whitespace-nowrap ml-2">
                          {issue.dimension}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {report.summary.recommendations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">💡 改进建议</h4>
                <ul className="space-y-1.5">
                  {report.summary.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      <span className="text-purple-400 mt-0.5">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">📊 维度评分分布</h4>
              <div className="space-y-2">
                {Object.entries(report.summary.dimensionScores)
                  .sort(([, a], [, b]) => (a?.avg ?? 0) - (b?.avg ?? 0))
                  .slice(0, 8)
                  .map(([dim, scores]) => (
                    <div key={dim} className="flex items-center gap-3">
                      <span className="text-xs w-24 truncate text-zinc-500 dark:text-zinc-400">
                        {dim}
                      </span>
                      <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            (scores?.avg ?? 0) >= 80 ? "bg-green-500" : (scores?.avg ?? 0) >= 60 ? "bg-amber-500" : "bg-red-500"
                          }`}
                          style={{ width: `${scores?.avg ?? 0}%` }}
                        />
                      </div>
                      <span className="text-xs w-10 text-right text-zinc-500 dark:text-zinc-400">
                        {Math.round(scores?.avg ?? 0)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "scenes" && (
          <div className="space-y-3">
            {report.scenes.map((sceneAudit) => (
              <div
                key={sceneAudit.sceneIndex}
                className={`rounded-lg border transition-colors ${
                  sceneAudit.passed
                    ? "border-green-200 bg-green-50/30 dark:border-green-800/30 dark:bg-green-900/10"
                    : "border-amber-200 bg-amber-50/30 dark:border-amber-800/30 dark:bg-amber-900/10"
                }`}
              >
                <button
                  onClick={() => setExpandedScene(expandedScene === sceneAudit.sceneIndex ? null : sceneAudit.sceneIndex)}
                  className="w-full p-3 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      sceneAudit.passed
                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
                    }`}>
                      {sceneAudit.sceneIndex + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 line-clamp-1">
                        {sceneAudit.scene.description?.slice(0, 60) || `Scene #${sceneAudit.sceneIndex + 1}`}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {sceneAudit.scene.location || "?"}/{sceneAudit.scene.time_weather || "?"}
                        {" · "}
                        {sceneAudit.scene.shot_type_name || sceneAudit.scene.shot_type || "?"}
                        {" · "}
                        {sceneAudit.scene.duration_seconds || "?"}s
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getScoreColor(sceneAudit.overallScore)}`}>
                      {sceneAudit.overallScore}
                    </span>
                    {!sceneAudit.passed && (
                      <span className="text-xs text-amber-600 dark:text-amber-400">
                        {sceneAudit.issues.filter(i => i.severity === "error").length}E/
                        {sceneAudit.issues.filter(i => i.severity === "warning").length}W
                      </span>
                    )}
                    <svg
                      className={`w-4 h-4 text-zinc-400 transition-transform ${expandedScene === sceneAudit.sceneIndex ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {expandedScene === sceneAudit.sceneIndex && (
                  <div className="px-3 pb-3 space-y-2 border-t border-zinc-200/50 dark:border-zinc-700/50 pt-3">
                    {sceneAudit.issues.length > 0 ? (
                      sceneAudit.issues.map((issue, idx) => (
                        <div key={idx} className={`p-2.5 rounded-md text-sm border ${getSeverityColor(issue.severity)}`}>
                          <div className="font-medium">{getSeverityIcon(issue.severity)} {issue.message}</div>
                          <div className="mt-1 text-xs opacity-80">💡 {issue.suggestion}</div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-green-600 dark:text-green-400 p-2">✅ 此场景未发现问题</p>
                    )}

                    {!sceneAudit.passed && onFixIssue && (
                      <button
                        onClick={() => onFixIssue(sceneAudit.sceneIndex)}
                        className="mt-2 w-full py-2 px-3 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:hover:bg-purple-900/50 text-sm font-medium transition-colors"
                      >
                        🛠️ 一键修复此场景
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === "dimensions" && (
          <div className="space-y-3">
            {Object.entries(report.summary.dimensionScores)
              .sort(([, a], [, b]) => (a?.avg ?? 0) - (b?.avg ?? 0))
              .map(([dim, scores]) => (
                <div key={dim} className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {dim}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getScoreColor(scores?.avg ?? 0)}`}>
                      {Math.round(scores?.avg ?? 0)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400">最低:</span>
                    <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-400 via-amber-400 to-green-400 rounded-full"
                        style={{ width: `${scores?.min ?? 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-zinc-500 w-8">{Math.round(scores?.min ?? 0)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-zinc-400">最高:</span>
                    <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-400 via-amber-400 to-green-400 rounded-full"
                        style={{ width: `${scores?.max ?? 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-zinc-500 w-8">{Math.round(scores?.max ?? 0)}</span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AuditBadge({ passed, score, onClick }: { passed: boolean; score?: number; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
        passed
          ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
          : "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400"
      }`}
    >
      {passed ? "✅ 通过" : "⚠️ 待审查"}
      {score !== undefined && <span>({score})</span>}
    </button>
  );
}
