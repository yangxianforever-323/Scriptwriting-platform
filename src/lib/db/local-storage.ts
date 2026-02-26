/**
 * Local file storage service.
 * Stores all data in JSON files under the .data directory.
 */

import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".data");
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");
const SCENES_FILE = path.join(DATA_DIR, "scenes.json");
const IMAGES_FILE = path.join(DATA_DIR, "images.json");
const VIDEOS_FILE = path.join(DATA_DIR, "videos.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJsonFile<T>(filePath: string, defaultValue: T): T {
  ensureDataDir();
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), "utf-8");
    return defaultValue;
  }
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return defaultValue;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export interface LocalProject {
  id: string;
  user_id: string;
  title: string;
  story: string | null;
  style: string | null;
  stage: "draft" | "scenes" | "images" | "videos" | "completed";
  created_at: string;
  updated_at: string;
}

export interface LocalScene {
  id: string;
  project_id: string;
  order_index: number;
  description: string;
  description_confirmed: boolean;
  image_status: "pending" | "processing" | "completed" | "failed";
  image_confirmed: boolean;
  video_status: "pending" | "processing" | "completed" | "failed";
  video_confirmed: boolean;
  created_at: string;
}

export interface LocalImage {
  id: string;
  scene_id: string;
  storage_path: string;
  url: string;
  width: number | null;
  height: number | null;
  version: number;
  created_at: string;
}

export interface LocalVideo {
  id: string;
  scene_id: string;
  storage_path: string;
  url: string;
  duration: number | null;
  task_id: string | null;
  version: number;
  created_at: string;
}

interface DataStore {
  projects: LocalProject[];
  scenes: LocalScene[];
  images: LocalImage[];
  videos: LocalVideo[];
}

function loadData(): DataStore {
  return {
    projects: readJsonFile<LocalProject[]>(PROJECTS_FILE, []),
    scenes: readJsonFile<LocalScene[]>(SCENES_FILE, []),
    images: readJsonFile<LocalImage[]>(IMAGES_FILE, []),
    videos: readJsonFile<LocalVideo[]>(VIDEOS_FILE, []),
  };
}

function saveData(data: DataStore): void {
  writeJsonFile(PROJECTS_FILE, data.projects);
  writeJsonFile(SCENES_FILE, data.scenes);
  writeJsonFile(IMAGES_FILE, data.images);
  writeJsonFile(VIDEOS_FILE, data.videos);
}

export const localDb = {
  createProject(
    userId: string | null,
    title: string,
    story?: string,
    style?: string
  ): LocalProject {
    const data = loadData();
    const now = new Date().toISOString();
    const project: LocalProject = {
      id: generateId(),
      user_id: userId ?? "guest-user",
      title,
      story: story ?? null,
      style: style ?? null,
      stage: "draft",
      created_at: now,
      updated_at: now,
    };
    data.projects.push(project);
    saveData(data);
    return project;
  },

  getProjects(
    userId: string | null,
    options: { page?: number; limit?: number } = {}
  ): { projects: LocalProject[]; total: number } {
    const data = loadData();
    const effectiveUserId = userId ?? "guest-user";
    const userProjects = data.projects
      .filter((p) => p.user_id === effectiveUserId)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const offset = (page - 1) * limit;

    return {
      projects: userProjects.slice(offset, offset + limit),
      total: userProjects.length,
    };
  },

  getProjectById(projectId: string, userId: string | null): LocalProject | null {
    const data = loadData();
    const effectiveUserId = userId ?? "guest-user";
    return data.projects.find((p) => p.id === projectId && p.user_id === effectiveUserId) ?? null;
  },

  updateProject(
    projectId: string,
    userId: string | null,
    updates: Partial<Pick<LocalProject, "title" | "story" | "style" | "stage">>
  ): LocalProject | null {
    const data = loadData();
    const effectiveUserId = userId ?? "guest-user";
    const index = data.projects.findIndex(
      (p) => p.id === projectId && p.user_id === effectiveUserId
    );
    if (index === -1) return null;

    data.projects[index] = {
      ...data.projects[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveData(data);
    return data.projects[index];
  },

  updateProjectStage(
    projectId: string,
    userId: string | null,
    stage: LocalProject["stage"]
  ): LocalProject | null {
    return this.updateProject(projectId, userId, { stage });
  },

  deleteProject(projectId: string, userId: string | null): boolean {
    const data = loadData();
    const effectiveUserId = userId ?? "guest-user";
    const index = data.projects.findIndex(
      (p) => p.id === projectId && p.user_id === effectiveUserId
    );
    if (index === -1) return false;

    const projectScenes = data.scenes.filter((s) => s.project_id === projectId);
    const sceneIds = projectScenes.map((s) => s.id);

    data.images = data.images.filter((img) => !sceneIds.includes(img.scene_id));
    data.videos = data.videos.filter((vid) => !sceneIds.includes(vid.scene_id));
    data.scenes = data.scenes.filter((s) => s.project_id !== projectId);
    data.projects.splice(index, 1);

    saveData(data);
    return true;
  },

  createScenes(
    projectId: string,
    scenes: Array<{ order_index: number; description: string }>
  ): LocalScene[] {
    const data = loadData();
    const now = new Date().toISOString();
    const newScenes: LocalScene[] = scenes.map((s) => ({
      id: generateId(),
      project_id: projectId,
      order_index: s.order_index,
      description: s.description,
      description_confirmed: false,
      image_status: "pending" as const,
      image_confirmed: false,
      video_status: "pending" as const,
      video_confirmed: false,
      created_at: now,
    }));
    data.scenes.push(...newScenes);
    saveData(data);
    return newScenes;
  },

  getScenesByProjectId(projectId: string): LocalScene[] {
    const data = loadData();
    return data.scenes
      .filter((s) => s.project_id === projectId)
      .sort((a, b) => a.order_index - b.order_index);
  },

  deleteScenesByProjectId(projectId: string): void {
    const data = loadData();
    const sceneIds = data.scenes
      .filter((s) => s.project_id === projectId)
      .map((s) => s.id);
    data.images = data.images.filter((img) => !sceneIds.includes(img.scene_id));
    data.videos = data.videos.filter((vid) => !sceneIds.includes(vid.scene_id));
    data.scenes = data.scenes.filter((s) => s.project_id !== projectId);
    saveData(data);
  },

  updateScene(
    sceneId: string,
    updates: Partial<LocalScene>
  ): LocalScene | null {
    const data = loadData();
    const index = data.scenes.findIndex((s) => s.id === sceneId);
    if (index === -1) return null;
    data.scenes[index] = { ...data.scenes[index], ...updates };
    saveData(data);
    return data.scenes[index];
  },

  createImage(
    sceneId: string,
    storagePath: string,
    url: string,
    width?: number,
    height?: number
  ): LocalImage {
    const data = loadData();
    const now = new Date().toISOString();
    const existingImages = data.images.filter((img) => img.scene_id === sceneId);
    const maxVersion = existingImages.reduce((max, img) => Math.max(max, img.version), 0);

    const image: LocalImage = {
      id: generateId(),
      scene_id: sceneId,
      storage_path: storagePath,
      url,
      width: width ?? null,
      height: height ?? null,
      version: maxVersion + 1,
      created_at: now,
    };
    data.images.push(image);
    saveData(data);
    return image;
  },

  getImagesBySceneId(sceneId: string): LocalImage[] {
    const data = loadData();
    return data.images
      .filter((img) => img.scene_id === sceneId)
      .sort((a, b) => b.version - a.version);
  },

  createVideo(
    sceneId: string,
    storagePath: string,
    url: string,
    taskId?: string,
    duration?: number
  ): LocalVideo {
    const data = loadData();
    const now = new Date().toISOString();
    const existingVideos = data.videos.filter((vid) => vid.scene_id === sceneId);
    const maxVersion = existingVideos.reduce((max, vid) => Math.max(max, vid.version), 0);

    const video: LocalVideo = {
      id: generateId(),
      scene_id: sceneId,
      storage_path: storagePath,
      url,
      duration: duration ?? null,
      task_id: taskId ?? null,
      version: maxVersion + 1,
      created_at: now,
    };
    data.videos.push(video);
    saveData(data);
    return video;
  },

  getVideosBySceneId(sceneId: string): LocalVideo[] {
    const data = loadData();
    return data.videos
      .filter((vid) => vid.scene_id === sceneId)
      .sort((a, b) => b.version - a.version);
  },

  updateVideo(
    videoId: string,
    updates: Partial<LocalVideo>
  ): LocalVideo | null {
    const data = loadData();
    const index = data.videos.findIndex((v) => v.id === videoId);
    if (index === -1) return null;
    data.videos[index] = { ...data.videos[index], ...updates };
    saveData(data);
    return data.videos[index];
  },

  getProjectWithScenes(projectId: string, userId: string | null): {
    project: LocalProject;
    scenes: Array<LocalScene & { images: LocalImage[]; videos: LocalVideo[] }>;
  } | null {
    const project = this.getProjectById(projectId, userId);
    if (!project) return null;

    const scenes = this.getScenesByProjectId(projectId);
    const scenesWithMedia = scenes.map((scene) => ({
      ...scene,
      images: this.getImagesBySceneId(scene.id),
      videos: this.getVideosBySceneId(scene.id),
    }));

    return { project, scenes: scenesWithMedia };
  },
};

export type { DataStore };
