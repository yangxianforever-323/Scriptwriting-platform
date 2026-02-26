"use client";

import { useState } from "react";
import { SceneDescriptionCard } from "./SceneDescriptionCard";
import type { Scene } from "@/types/database";

interface SceneDescriptionListProps {
  projectId: string;
  scenes: Scene[];
  shotCount?: number;
}

const SHOT_COUNT_OPTIONS = [
  { value: 9, label: "9宫格", description: "3×3" },
  { value: 16, label: "16宫格", description: "4×4" },
  { value: 25, label: "25宫格", description: "5×5" },
];

export function SceneDescriptionList({
  projectId,
  scenes,
  shotCount = 9,
}: SceneDescriptionListProps) {
  const [localScenes, setLocalScenes] = useState(scenes);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isConfirmingAll, setIsConfirmingAll] = useState(false);
  const [selectedShotCount, setSelectedShotCount] = useState(shotCount);
  const [showShotCountSelector, setShowShotCountSelector] = useState(false);

  const confirmedCount = localScenes.filter(
    (s) => s.description_confirmed
  ).length;
  const allConfirmed = confirmedCount === localScenes.length;

  const handleConfirmScene = async (sceneId: string) => {
    const response = await fetch(`/api/scenes/${sceneId}/confirm-description`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Failed to confirm scene");
    }

    setLocalScenes((prev) =>
      prev.map((s) =>
        s.id === sceneId ? { ...s, description_confirmed: true } : s
      )
    );
  };

  const handleUpdateScene = async (sceneId: string, description: string) => {
    const response = await fetch(`/api/scenes/${sceneId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ description }),
    });

    if (!response.ok) {
      throw new Error("Failed to update scene");
    }

    setLocalScenes((prev) =>
      prev.map((s) =>
        s.id === sceneId ? { ...s, description } : s
      )
    );
  };

  const handleConfirmAll = async () => {
    setIsConfirmingAll(true);
    try {
      const response = await fetch("/api/scenes/confirm-all-descriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        throw new Error("Failed to confirm all scenes");
      }

      // Refresh the page to show the next stage (images)
      window.location.reload();
    } catch (error) {
      console.error("Failed to confirm all scenes:", error);
      setIsConfirmingAll(false);
    }
  };

  const handleRegenerate = async (newShotCount?: number) => {
    const shotCountToUse = newShotCount ?? selectedShotCount;
    const message = shotCountToUse !== localScenes.length
      ? `确定要将分镜数量调整为 ${shotCountToUse} 个吗？当前的分镜将被删除并重新生成。`
      : "确定要重新生成分镜吗？当前的分镜将被删除。";
    
    if (!confirm(message)) {
      return;
    }

    setIsRegenerating(true);
    setShowShotCountSelector(false);
    try {
      const response = await fetch("/api/generate/scenes/regenerate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId, shotCount: shotCountToUse }),
      });

      if (!response.ok) {
        throw new Error("Failed to regenerate scenes");
      }

      const { scenes: newScenes } = await response.json();
      setLocalScenes(newScenes);
      setSelectedShotCount(shotCountToUse);
    } catch (error) {
      console.error("Failed to regenerate scenes:", error);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            已确认 {confirmedCount} / {localScenes.length} 个分镜
          </span>
          {allConfirmed && (
            <span className="text-sm text-green-600 dark:text-green-400">
              ✓ 全部确认
            </span>
          )}
        </div>
        <div className="relative">
          <button
            onClick={() => setShowShotCountSelector(!showShotCountSelector)}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            {SHOT_COUNT_OPTIONS.find(o => o.value === localScenes.length)?.label ?? `${localScenes.length}个分镜`}
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showShotCountSelector && (
            <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              <div className="mb-2 px-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                调整分镜数量
              </div>
              {SHOT_COUNT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    if (option.value !== localScenes.length) {
                      handleRegenerate(option.value);
                    }
                  }}
                  disabled={isRegenerating || option.value === localScenes.length}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-sm transition-colors ${
                    option.value === localScenes.length
                      ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  <span>{option.label}</span>
                  <span className="text-xs text-zinc-400">{option.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Scene Cards */}
      <div className="space-y-3">
        {localScenes.map((scene) => (
          <SceneDescriptionCard
            key={scene.id}
            scene={scene}
            onConfirm={handleConfirmScene}
            onUpdate={handleUpdateScene}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800 sm:flex-row sm:justify-between">
        <button
          onClick={() => handleRegenerate()}
          disabled={isRegenerating}
          className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <svg
            className={`h-4 w-4 ${isRegenerating ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {isRegenerating ? "重新生成中..." : "重新生成分镜"}
        </button>

        {!allConfirmed && (
          <button
            onClick={handleConfirmAll}
            disabled={isConfirmingAll}
            className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isConfirmingAll ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                确认中...
              </>
            ) : (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                确认所有分镜
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
