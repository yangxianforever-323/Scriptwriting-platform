/**
 * Unified Save Utilities for all project stages
 * Provides consistent save functionality across planning, analysis, and story development
 */

import type { Project } from "@/types/database";

export interface SaveResult {
  success: boolean;
  error?: string;
}

export interface PlanningData {
  logline: string;
  synopsis: string;
  genre: string;
  targetDuration: number;
}

export interface StoryData {
  title: string;
  logline: string;
  synopsis: string;
  genre: string;
  targetDuration: number;
  structure?: string;
  theme?: string;
  tone?: string;
}

export interface SaveStageOptions {
  projectId: string;
  stage: "planning" | "story" | "storyboard" | "material" | "complete";
  status?: "in_progress" | "completed";
  data?: Record<string, unknown>;
}

/**
 * Save project stage progress to server
 */
export async function saveStageProgress(options: SaveStageOptions): Promise<SaveResult> {
  const { projectId, stage, status = "in_progress", data } = options;

  try {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage_progress: {
          [stage]: {
            status,
            completedAt: status === "completed" ? new Date().toISOString() : undefined,
            updatedAt: new Date().toISOString(),
            data,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save stage progress");
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving stage progress:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "保存失败",
    };
  }
}

/**
 * Update project stage status
 */
export async function updateStageStatus(
  projectId: string,
  stage: string,
  status: "in_progress" | "completed"
): Promise<SaveResult> {
  try {
    const response = await fetch(`/api/projects/${projectId}/stage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage, status }),
    });

    if (!response.ok) {
      throw new Error("Failed to update stage status");
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating stage status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "保存失败",
    };
  }
}

/**
 * Save planning data (logline, synopsis, genre, targetDuration)
 */
export async function savePlanningData(
  projectId: string,
  data: PlanningData
): Promise<SaveResult> {
  try {
    const response = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage_progress: {
          planning: {
            status: "in_progress",
            updatedAt: new Date().toISOString(),
            data,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save planning data");
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving planning data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "保存失败",
    };
  }
}

/**
 * Save story data to server-side storage (for story development stage)
 */
export async function saveStoryData(
  projectId: string,
  storyData: {
    title?: string;
    logline?: string;
    synopsis?: string;
    genre?: string;
    targetDuration?: number;
    characters?: Array<Record<string, unknown>>;
    locations?: Array<Record<string, unknown>>;
    props?: Array<Record<string, unknown>>;
    acts?: Array<Record<string, unknown>>;
  }
): Promise<SaveResult> {
  try {
    const response = await fetch(`/api/projects/${projectId}/story-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...storyData,
        stage: "story",
        status: "in_progress",
        updatedAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to save story data");
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving story data:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "保存失败",
    };
  }
}

/**
 * Auto-save hook for form data with debouncing
 */
export function createAutoSave(
  saveFunction: () => Promise<SaveResult>,
  delayMs: number = 2000
) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastSaveTime: Date | null = null;
  let isSaving: boolean = false;

  return {
    trigger: (immediate: boolean = false) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (immediate) {
        timeoutId = setTimeout(async () => {
          isSaving = true;
          await saveFunction();
          isSaving = false;
          lastSaveTime = new Date();
        }, 100);
      } else {
        timeoutId = setTimeout(async () => {
          isSaving = true;
          await saveFunction();
          isSaving = false;
          lastSaveTime = new Date();
        }, delayMs);
      }
    },

    cancel: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },

    getStatus: () => ({
      isSaving,
      lastSaveTime,
    }),
  };
}

/**
 * Format save status message
 */
export function formatSaveStatus(
  isSaving: boolean,
  lastSaveTime: Date | null,
  message?: string
): string {
  if (isSaving) {
    return "保存中...";
  }

  if (message) {
    return message;
  }

  if (lastSaveTime) {
    const diff = Date.now() - lastSaveTime.getTime();
    if (diff < 60000) {
      return "已保存";
    }
    return `上次保存: ${lastSaveTime.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
  }

  return "";
}
