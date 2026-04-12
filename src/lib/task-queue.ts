"use client";

import { create } from "zustand";
import type { GenerationTask, TaskStatus, TaskType } from "@/types/task-queue";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

interface TaskQueueStore {
  tasks: GenerationTask[];
  isProcessing: boolean;
  currentTaskId: string | null;

  addTask: (
    projectId: string,
    type: TaskType,
    metadata: Record<string, unknown>,
    options?: { sceneId?: string; priority?: number }
  ) => GenerationTask;

  updateTask: (taskId: string, updates: Partial<GenerationTask>) => void;

  updateTaskStatus: (taskId: string, status: TaskStatus, progress?: number) => void;

  setTaskError: (taskId: string, error: string) => void;

  setTaskResult: (taskId: string, result: unknown) => void;

  cancelTask: (taskId: string) => void;

  removeTask: (taskId: string) => void;

  clearCompletedTasks: () => void;

  getTasksByProjectId: (projectId: string) => GenerationTask[];

  getTasksBySceneId: (sceneId: string) => GenerationTask[];

  getNextPendingTask: () => GenerationTask | null;

  startProcessing: () => void;

  stopProcessing: () => void;
}

export const useTaskQueueStore = create<TaskQueueStore>((set, get) => ({
  tasks: [],
  isProcessing: false,
  currentTaskId: null,

  addTask: (projectId, type, metadata, options = {}) => {
    const task: GenerationTask = {
      id: generateId(),
      projectId,
      sceneId: options.sceneId,
      type,
      status: "pending",
      priority: options.priority ?? 0,
      progress: 0,
      createdAt: new Date().toISOString(),
      metadata,
    };

    set((state) => ({
      tasks: [...state.tasks, task].sort((a, b) => b.priority - a.priority),
    }));

    return task;
  },

  updateTask: (taskId, updates) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      ),
    }));
  },

  updateTaskStatus: (taskId, status, progress) => {
    const now = new Date().toISOString();
    set((state) => ({
      tasks: state.tasks.map((task) => {
        if (task.id !== taskId) return task;

        const updates: Partial<GenerationTask> = { status };
        if (progress !== undefined) updates.progress = progress;
        if (status === "processing" && !task.startedAt) updates.startedAt = now;
        if (status === "completed" || status === "failed" || status === "cancelled") {
          updates.completedAt = now;
        }

        return { ...task, ...updates };
      }),
      currentTaskId: status === "processing" ? taskId : state.currentTaskId,
    }));
  },

  setTaskError: (taskId, error) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: "failed",
              error,
              completedAt: new Date().toISOString(),
            }
          : task
      ),
    }));
  },

  setTaskResult: (taskId, result) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: "completed",
              result,
              progress: 100,
              completedAt: new Date().toISOString(),
            }
          : task
      ),
    }));
  },

  cancelTask: (taskId) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: "cancelled",
              completedAt: new Date().toISOString(),
            }
          : task
      ),
    }));
  },

  removeTask: (taskId) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId),
      currentTaskId: state.currentTaskId === taskId ? null : state.currentTaskId,
    }));
  },

  clearCompletedTasks: () => {
    set((state) => ({
      tasks: state.tasks.filter(
        (task) =>
          task.status !== "completed" &&
          task.status !== "failed" &&
          task.status !== "cancelled"
      ),
    }));
  },

  getTasksByProjectId: (projectId) => {
    return get().tasks.filter((task) => task.projectId === projectId);
  },

  getTasksBySceneId: (sceneId) => {
    return get().tasks.filter((task) => task.sceneId === sceneId);
  },

  getNextPendingTask: () => {
    return get().tasks.find((task) => task.status === "pending") || null;
  },

  startProcessing: () => {
    set({ isProcessing: true });
  },

  stopProcessing: () => {
    set({ isProcessing: false, currentTaskId: null });
  },
}));
