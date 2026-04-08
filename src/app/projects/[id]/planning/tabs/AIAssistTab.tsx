"use client";

import React, { useState } from "react";
import { Tooltip } from "@/components/ui/Tooltip";

interface AIAssistTabProps {
  logline: string;
  synopsis: string;
  genre: string;
  onLoglineChange: (value: string) => void;
  onSynopsisChange: (value: string) => void;
  onGenreChange: (value: string) => void;
}

export function AIAssistTab({
  logline,
  synopsis,
  genre,
  onLoglineChange,
  onSynopsisChange,
  onGenreChange,
}: AIAssistTabProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/generate-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error("生成失败");

      const result = await response.json();
      setSuggestions(result.suggestions || []);
    } catch (error) {
      console.error("Error generating suggestions:", error);
      // Mock suggestions for demo
      setSuggestions([
        "一个年轻的程序员发现了一段神秘的代码，运行后打开了通往数字世界的入口",
        "失忆的侦探在调查一起案件时，逐渐发现自己就是案件的当事人",
        "两个平行世界的陌生人通过梦境相遇，决定寻找彼此",
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    if (!logline) {
      onLoglineChange(suggestion);
    } else if (!synopsis) {
      onSynopsisChange(suggestion);
    }
    setSuggestions([]);
  };

  const quickPrompts = [
    { label: "科幻冒险", prompt: "生成一个科幻冒险故事创意" },
    { label: "都市爱情", prompt: "生成一个都市爱情故事创意" },
    { label: "悬疑推理", prompt: "生成一个悬疑推理故事创意" },
    { label: "奇幻史诗", prompt: "生成一个奇幻史诗故事创意" },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Prompts */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
          快速创意
          <Tooltip content="选择一个类型，AI 将为您生成相关的故事创意">
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </Tooltip>
        </label>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((qp) => (
            <button
              key={qp.label}
              onClick={() => {
                setPrompt(qp.prompt);
                handleGenerate();
              }}
              disabled={isGenerating}
              className="px-3 py-1.5 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors disabled:opacity-50"
            >
              {qp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Prompt */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
          自定义描述
          <Tooltip content="描述您想要的故事类型、风格或主题，AI 将生成相应的创意">
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </Tooltip>
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            placeholder="例如：一个关于时间旅行的爱情故事..."
            className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
          />
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm"
          >
            {isGenerating ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
            生成
          </button>
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
            AI 生成的创意
          </label>
          <div className="space-y-2">
            {suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectSuggestion(suggestion)}
                className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-transparent hover:border-blue-400 dark:hover:border-blue-500"
              >
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{suggestion}</p>
                <p className="text-xs text-zinc-400 mt-2">点击应用此创意</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Values */}
      <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">当前项目信息</h4>
        <div className="space-y-3">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
            <span className="text-xs text-zinc-400">一句话概括</span>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1">
              {logline || "尚未填写"}
            </p>
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
            <span className="text-xs text-zinc-400">剧情梗概</span>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-1">
              {synopsis || "尚未填写"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
