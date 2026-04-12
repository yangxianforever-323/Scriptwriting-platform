"use client";

import { create } from "zustand";
import { localDb } from "@/lib/db/local-db";
import type { Project } from "@/types/database";

interface ProjectsState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  total: number;

  fetchProjects: (
    userId: string | null,
    options?: { page?: number; limit?: number }
  ) => Promise<void>;
  fetchProjectById: (projectId: string, userId: string | null) => Promise<void>;
  createProject: (
    userId: string | null,
    title: string,
    story?: string | null,
    style?: string | null,
    shotCount?: number
  ) => Promise<Project>;
  updateProject: (
    projectId: string,
    userId: string | null,
    updates: Partial<Project>
  ) => Promise<void>;
  updateProjectStage: (
    projectId: string,
    userId: string | null,
    stage: string
  ) => Promise<void>;
  updateProjectCurrentStage: (
    projectId: string,
    userId: string | null,
    stage: string
  ) => Promise<void>;
  updateStageProgress: (
    projectId: string,
    userId: string | null,
    stage: string,
    status: "locked" | "active" | "completed",
    data?: Record<string, unknown>
  ) => Promise<void>;
  deleteProject: (projectId: string, userId: string | null) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  clearError: () => void;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  currentProject: null,
  loading: false,
  error: null,
  total: 0,

  fetchProjects: async (userId, options = {}) => {
    set({ loading: true, error: null });
    try {
      const result = localDb.getProjects(userId, options);
      set({ projects: result.projects, total: result.total, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch projects",
        loading: false,
      });
    }
  },

  fetchProjectById: async (projectId, userId) => {
    set({ loading: true, error: null });
    try {
      const project = localDb.getProjectById(projectId, userId);
      set({ currentProject: project, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch project",
        loading: false,
      });
    }
  },

  createProject: async (userId, title, story, style, shotCount) => {
    set({ loading: true, error: null });
    try {
      const project = localDb.createProject(userId, title, story, style, shotCount);
      const { projects } = get();
      set({ projects: [project, ...projects], loading: false });
      return project;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create project";
      set({ error: errorMessage, loading: false });
      throw new Error(errorMessage);
    }
  },

  updateProject: async (projectId, userId, updates) => {
    set({ loading: true, error: null });
    try {
      const updatedProject = localDb.updateProject(projectId, userId, updates);
      if (updatedProject) {
        const { projects, currentProject } = get();
        set({
          projects: projects.map((p) => (p.id === projectId ? updatedProject : p)),
          currentProject: currentProject?.id === projectId ? updatedProject : currentProject,
          loading: false,
        });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to update project",
        loading: false,
      });
    }
  },

  updateProjectStage: async (projectId, userId, stage) => {
    await get().updateProject(projectId, userId, { stage } as Partial<Project>);
  },

  updateProjectCurrentStage: async (projectId, userId, stage) => {
    await get().updateProject(projectId, userId, { current_stage: stage } as Partial<Project>);
  },

  updateStageProgress: async (projectId, userId, stage, status, data) => {
    set({ loading: true, error: null });
    try {
      const updatedProject = localDb.updateStageProgress(projectId, userId, stage, status, data);
      if (updatedProject) {
        const { projects, currentProject } = get();
        set({
          projects: projects.map((p) => (p.id === projectId ? updatedProject : p)),
          currentProject: currentProject?.id === projectId ? updatedProject : currentProject,
          loading: false,
        });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to update stage progress",
        loading: false,
      });
    }
  },

  deleteProject: async (projectId, userId) => {
    set({ loading: true, error: null });
    try {
      localDb.deleteProject(projectId, userId);
      const { projects, currentProject } = get();
      set({
        projects: projects.filter((p) => p.id !== projectId),
        currentProject: currentProject?.id === projectId ? null : currentProject,
        loading: false,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to delete project",
        loading: false,
      });
    }
  },

  setCurrentProject: (project) => {
    set({ currentProject: project });
  },

  clearError: () => {
    set({ error: null });
  },
}));
