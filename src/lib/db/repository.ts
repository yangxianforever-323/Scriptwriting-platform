import { localDb } from "./local-db";
import type { Project, Scene, Image, Video } from "@/types/database";

export interface DataRepository {
  projects: {
    create: typeof localDb.createProject;
    get: typeof localDb.getProjects;
    getById: typeof localDb.getProjectById;
    update: typeof localDb.updateProject;
    updateStage: typeof localDb.updateProjectStage;
    updateCurrentStage: typeof localDb.updateProjectCurrentStage;
    updateStageProgress: typeof localDb.updateStageProgress;
    canAccessStage: typeof localDb.canAccessStage;
    delete: typeof localDb.deleteProject;
    getWithScenes: typeof localDb.getProjectWithScenes;
  };

  scenes: {
    create: typeof localDb.createScenes;
    getByProjectId: typeof localDb.getScenesByProjectId;
    update: typeof localDb.updateScene;
    deleteByProjectId: typeof localDb.deleteScenesByProjectId;
  };

  images: {
    create: typeof localDb.createImage;
    getBySceneId: typeof localDb.getImagesBySceneId;
  };

  videos: {
    create: typeof localDb.createVideo;
    getBySceneId: typeof localDb.getVideosBySceneId;
    update: typeof localDb.updateVideo;
  };
}

export const repository: DataRepository = {
  projects: {
    create: localDb.createProject,
    get: localDb.getProjects,
    getById: localDb.getProjectById,
    update: localDb.updateProject,
    updateStage: localDb.updateProjectStage,
    updateCurrentStage: localDb.updateProjectCurrentStage,
    updateStageProgress: localDb.updateStageProgress,
    canAccessStage: localDb.canAccessStage,
    delete: localDb.deleteProject,
    getWithScenes: localDb.getProjectWithScenes,
  },

  scenes: {
    create: localDb.createScenes,
    getByProjectId: localDb.getScenesByProjectId,
    update: localDb.updateScene,
    deleteByProjectId: localDb.deleteScenesByProjectId,
  },

  images: {
    create: localDb.createImage,
    getBySceneId: localDb.getImagesBySceneId,
  },

  videos: {
    create: localDb.createVideo,
    getBySceneId: localDb.getVideosBySceneId,
    update: localDb.updateVideo,
  },
};

export function getRepository(): DataRepository {
  const useSupabase = process.env.NEXT_PUBLIC_USE_SUPABASE === "true";

  if (useSupabase) {
    console.warn("Supabase repository not implemented yet, falling back to local DB");
  }

  return repository;
}
