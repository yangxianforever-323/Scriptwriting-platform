"use client";

import { create } from "zustand";
import { localDb } from "@/lib/db/local-db";
import type { Scene, Image, Video } from "@/types/database";

interface SceneWithMedia extends Scene {
  images: Image[];
  videos: Video[];
}

interface ScenesState {
  scenes: SceneWithMedia[];
  loading: boolean;
  error: string | null;

  fetchScenesByProjectId: (projectId: string) => Promise<void>;
  createScenes: (
    projectId: string,
    scenes: Array<{
      order_index: number;
      description: string;
      [key: string]: unknown;
    }>
  ) => Promise<Scene[]>;
  updateScene: (sceneId: string, updates: Partial<Scene>) => Promise<void>;
  deleteScenesByProjectId: (projectId: string) => Promise<void>;
  createImage: (
    sceneId: string,
    storagePath: string,
    url: string,
    width?: number | null,
    height?: number | null
  ) => Promise<Image>;
  createVideo: (
    sceneId: string,
    storagePath: string,
    url: string,
    taskId?: string | null,
    duration?: number | null
  ) => Promise<Video>;
  updateVideo: (videoId: string, updates: Partial<Video>) => Promise<void>;
  clearError: () => void;
}

export const useScenesStore = create<ScenesState>((set, get) => ({
  scenes: [],
  loading: false,
  error: null,

  fetchScenesByProjectId: async (projectId) => {
    set({ loading: true, error: null });
    try {
      const scenes = localDb.getScenesByProjectId(projectId);
      const scenesWithMedia = scenes.map((scene) => ({
        ...scene,
        images: localDb.getImagesBySceneId(scene.id),
        videos: localDb.getVideosBySceneId(scene.id),
      }));
      set({ scenes: scenesWithMedia, loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to fetch scenes",
        loading: false,
      });
    }
  },

  createScenes: async (projectId, scenes) => {
    set({ loading: true, error: null });
    try {
      const newScenes = localDb.createScenes(projectId, scenes);
      const { scenes: currentScenes } = get();
      const newScenesWithMedia = newScenes.map((scene) => ({
        ...scene,
        images: [],
        videos: [],
      }));
      set({ scenes: [...currentScenes, ...newScenesWithMedia], loading: false });
      return newScenes;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create scenes";
      set({ error: errorMessage, loading: false });
      throw new Error(errorMessage);
    }
  },

  updateScene: async (sceneId, updates) => {
    set({ loading: true, error: null });
    try {
      const updatedScene = localDb.updateScene(sceneId, updates);
      if (updatedScene) {
        const { scenes } = get();
        set({
          scenes: scenes.map((s) =>
            s.id === sceneId
              ? {
                  ...updatedScene,
                  images: s.images,
                  videos: s.videos,
                }
              : s
          ),
          loading: false,
        });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to update scene",
        loading: false,
      });
    }
  },

  deleteScenesByProjectId: async (projectId) => {
    set({ loading: true, error: null });
    try {
      localDb.deleteScenesByProjectId(projectId);
      set({ scenes: [], loading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to delete scenes",
        loading: false,
      });
    }
  },

  createImage: async (sceneId, storagePath, url, width, height) => {
    set({ loading: true, error: null });
    try {
      const image = localDb.createImage(sceneId, storagePath, url, width, height);
      const { scenes } = get();
      set({
        scenes: scenes.map((s) =>
          s.id === sceneId
            ? {
                ...s,
                images: [image, ...s.images],
              }
            : s
        ),
        loading: false,
      });
      return image;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create image";
      set({ error: errorMessage, loading: false });
      throw new Error(errorMessage);
    }
  },

  createVideo: async (sceneId, storagePath, url, taskId, duration) => {
    set({ loading: true, error: null });
    try {
      const video = localDb.createVideo(sceneId, storagePath, url, taskId, duration);
      const { scenes } = get();
      set({
        scenes: scenes.map((s) =>
          s.id === sceneId
            ? {
                ...s,
                videos: [video, ...s.videos],
              }
            : s
        ),
        loading: false,
      });
      return video;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create video";
      set({ error: errorMessage, loading: false });
      throw new Error(errorMessage);
    }
  },

  updateVideo: async (videoId, updates) => {
    set({ loading: true, error: null });
    try {
      const updatedVideo = localDb.updateVideo(videoId, updates);
      if (updatedVideo) {
        const { scenes } = get();
        set({
          scenes: scenes.map((s) => ({
            ...s,
            videos: s.videos.map((v) => (v.id === videoId ? updatedVideo : v)),
          })),
          loading: false,
        });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Failed to update video",
        loading: false,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
