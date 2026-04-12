"use client";

import React, { useState, useRef } from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import type { NovelAnalysisResult } from "@/types/audit";

interface NovelImportTabProps {
  onAnalysisComplete: (result: NovelAnalysisResult) => void;
}

export function NovelImportTab({ onAnalysisComplete }: NovelImportTabProps) {
  const [step, setStep] = useState<"upload" | "analyzing" | "review">("upload");
  const [novelContent, setNovelContent] = useState("");
  const [novelTitle, setNovelTitle] = useState("");
  const [analysisResult, setAnalysisResult] = useState<NovelAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setWarnings([]);
    const fileName = file.name.toLowerCase();

    try {
      let text = "";

      if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
        text = await file.text();
      } else if (fileName.endsWith(".docx")) {
        setError("抱歉，目前暂不支持 .docx 格式，请先将文档另存为 .txt 格式后再上传");
        return;
      } else if (fileName.endsWith(".pdf")) {
        setError("抱歉，目前暂不支持 .pdf 格式，请先将文档复制/转换为文本内容后再上传");
        return;
      } else {
        setError(`不支持的文件格式: ${file.name}，请使用 .txt 或 .md 格式`);
        return;
      }

      setNovelContent(text);
      setNovelTitle(file.name.replace(/\.[^/.]+$/, ""));
    } catch (err) {
      console.error("Error reading file:", err);
      setError("读取文件失败，请重试");
    }
  };

  const handleAnalyze = async () => {
    if (!novelContent.trim()) return;

    setStep("analyzing");
    setError(null);
    setWarnings([]);
    setProgress(10);
    setProgressMessage("准备分析...");

    try {
      const response = await fetch("/api/ai/analyze-novel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: novelContent,
          title: novelTitle,
        }),
      });

      setProgress(60);
      setProgressMessage("处理分析结果...");

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "分析失败");
      }

      const data = await response.json();

      setProgress(90);
      setProgressMessage("验证数据...");

      if (!data.success) {
        throw new Error(data.error || "分析失败");
      }

      const analysis: NovelAnalysisResult = data.result;

      if (data.warnings && data.warnings.length > 0) {
        setWarnings(data.warnings);
      }

      setAnalysisResult(analysis);
      setProgress(100);
      setProgressMessage("分析完成");

      await new Promise((resolve) => setTimeout(resolve, 500));
      setStep("review");
    } catch (error) {
      console.error("Error analyzing novel:", error);
      setError(error instanceof Error ? error.message : "分析失败，请重试");
      setStep("upload");
    }
  };

  const handleApply = () => {
    if (analysisResult) {
      onAnalysisComplete(analysisResult);
      handleReset();
    }
  };

  const handleReset = () => {
    setStep("upload");
    setNovelContent("");
    setNovelTitle("");
    setAnalysisResult(null);
    setError(null);
    setWarnings([]);
    setProgress(0);
    setProgressMessage("");
  };

  return (
    <div className="space-y-6">
      {step === "upload" && (
        <>
          {/* Upload Area */}
          <div className="grid grid-cols-2 gap-6">
            {/* Left: File Upload */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                上传小说文件
                <Tooltip content="支持 .txt, .md 格式的文本文件，建议上传 5000-50000 字的小说内容">
                  <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Tooltip>
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.md"
                  className="hidden"
                />
                <svg className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">点击上传或拖拽文件</p>
                <p className="text-xs text-zinc-400 mb-2">支持 .txt, .md 格式</p>
                <p className="text-xs text-amber-600 dark:text-amber-400">.docx / .pdf 请先转为文本</p>
              </div>
            </div>

            {/* Right: Paste Content */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                或粘贴内容
                <Tooltip content="直接粘贴小说文本内容，适合已有电子版的情况">
                  <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Tooltip>
              </label>
              <textarea
                value={novelContent}
                onChange={(e) => {
                  setNovelContent(e.target.value);
                  setError(null);
                  setWarnings([]);
                }}
                placeholder="粘贴小说内容..."
                className="w-full h-40 px-4 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors text-sm"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h4 className="text-sm font-medium text-amber-700 dark:text-amber-300">验证警告</h4>
              </div>
              <ul className="text-sm text-amber-600 dark:text-amber-400 space-y-1">
                {warnings.map((warning, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview & Title */}
          {novelContent && (
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-zinc-500">内容预览</span>
                <span className="text-xs text-zinc-400">{novelContent.length} 字符</span>
              </div>
              <div className="mb-3">
                <input
                  type="text"
                  value={novelTitle}
                  onChange={(e) => setNovelTitle(e.target.value)}
                  placeholder="输入项目名称..."
                  className="w-full px-3 py-2 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="text-xs text-zinc-500 line-clamp-3">
                {novelContent.substring(0, 200)}...
              </p>
            </div>
          )}

          {/* Analyze Button */}
          <div className="flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={!novelContent.trim()}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              开始 AI 分析
            </button>
          </div>
        </>
      )}

      {step === "analyzing" && (
        <div className="py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
            AI 正在分析您的小说
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            {progressMessage || "正在提取角色、场景、情节结构..."}
          </p>

          <div className="max-w-xs mx-auto mb-6">
            <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-zinc-400 mt-2 text-right">{progress}%</p>
          </div>

          <div className="flex justify-center gap-3">
            <span className={`px-3 py-1.5 text-xs rounded-full ${progress >= 10 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}>
              内容预处理
            </span>
            <span className={`px-3 py-1.5 text-xs rounded-full ${progress >= 30 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}>
              角色识别
            </span>
            <span className={`px-3 py-1.5 text-xs rounded-full ${progress >= 60 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}>
              场景提取
            </span>
            <span className={`px-3 py-1.5 text-xs rounded-full ${progress >= 90 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}>
              分幕规划
            </span>
          </div>
        </div>
      )}

      {step === "review" && analysisResult && (
        <div className="space-y-6">
          {/* Success Banner */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-zinc-900 dark:text-zinc-100">分析完成</h4>
                <p className="text-sm text-zinc-500">AI 已识别出以下内容，请确认后应用</p>
              </div>
            </div>
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800/30">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <h4 className="text-sm font-medium text-amber-700 dark:text-amber-300">提示信息</h4>
              </div>
              <ul className="text-sm text-amber-600 dark:text-amber-400 space-y-1">
                {warnings.map((warning, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-5 gap-4">
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-center">
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {analysisResult.acts?.length || 0}
              </div>
              <div className="text-xs text-zinc-500">幕</div>
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-center">
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {analysisResult.characters?.length || 0}
              </div>
              <div className="text-xs text-zinc-500">角色</div>
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-center">
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {analysisResult.locations?.length || 0}
              </div>
              <div className="text-xs text-zinc-500">场景地点</div>
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-center">
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {analysisResult.props?.length || 0}
              </div>
              <div className="text-xs text-zinc-500">道具</div>
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-center">
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                {analysisResult.acts?.reduce((acc, act) => acc + (act.scenes?.length || 0), 0) || 0}
              </div>
              <div className="text-xs text-zinc-500">场景</div>
            </div>
          </div>

          {/* Characters Preview */}
          {analysisResult.characters && analysisResult.characters.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">识别到的角色</h4>
              <div className="grid grid-cols-3 gap-3">
                {analysisResult.characters.slice(0, 6).map((char, idx) => (
                  <div key={idx} className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xs font-medium">
                        {char.name?.[0] || "?"}
                      </div>
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {char.name}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-400">
                      {char.role === "protagonist" ? "主角" : char.role === "antagonist" ? "反派" : char.role === "supporting" ? "配角" : "龙套"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acts Preview */}
          {analysisResult.acts && analysisResult.acts.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">分幕结构</h4>
              <div className="space-y-2">
                {analysisResult.acts.map((act, idx) => (
                  <div key={idx} className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {act.title}
                      </span>
                      <span className="text-xs text-zinc-400">{act.scenes?.length || 0} 场景</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              重新上传
            </button>
            <button
              onClick={handleApply}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              应用到项目
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
