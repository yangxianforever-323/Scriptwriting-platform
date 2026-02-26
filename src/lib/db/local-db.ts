import fs from "fs";
import path from "path";
import type { Project, Scene, Image, Video, DEFAULT_STAGE_PROGRESS } from "@/types/database";

const DATA_DIR = path.join(process.cwd(), "data");
const PROJECTS_FILE = path.join(DATA_DIR, "projects.json");
const SCENES_FILE = path.join(DATA_DIR, "scenes.json");
const IMAGES_FILE = path.join(DATA_DIR, "images.json");
const VIDEOS_FILE = path.join(DATA_DIR, "videos.json");

interface DataStore {
  projects: Project[];
  scenes: Scene[];
  images: Image[];
  videos: Video[];
}

function ensureDataDir(): void {
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

function loadData(): DataStore {
  return {
    projects: readJsonFile<Project[]>(PROJECTS_FILE, []),
    scenes: readJsonFile<Scene[]>(SCENES_FILE, []),
    images: readJsonFile<Image[]>(IMAGES_FILE, []),
    videos: readJsonFile<Video[]>(VIDEOS_FILE, []),
  };
}

function saveData(data: DataStore): void {
  writeJsonFile(PROJECTS_FILE, data.projects);
  writeJsonFile(SCENES_FILE, data.scenes);
  writeJsonFile(IMAGES_FILE, data.images);
  writeJsonFile(VIDEOS_FILE, data.videos);
}

interface LocalDb {
  loadData: () => DataStore;
  saveData: (data: DataStore) => void;
  createProject: (
    userId: string | null,
    title: string,
    story?: string | null,
    style?: string | null,
    shotCount?: number
  ) => Project;
  getProjects: (
    userId: string | null,
    options?: { page?: number; limit?: number }
  ) => { projects: Project[]; total: number };
  getProjectById: (projectId: string, userId: string | null) => Project | null;
  updateProject: (
    projectId: string,
    userId: string | null,
    updates: Partial<Project>
  ) => Project | null;
  updateProjectStage: (
    projectId: string,
    userId: string | null,
    stage: string
  ) => Project | null;
  // New stage management methods
  updateProjectCurrentStage: (
    projectId: string,
    userId: string | null,
    stage: string
  ) => Project | null;
  updateStageProgress: (
    projectId: string,
    userId: string | null,
    stage: string,
    status: "locked" | "active" | "completed",
    data?: Record<string, unknown>
  ) => Project | null;
  canAccessStage: (
    projectId: string,
    userId: string | null,
    stage: string
  ) => boolean;
  deleteProject: (projectId: string, userId: string | null) => boolean;
  createScenes: (
    projectId: string,
    scenes: Array<{
      order_index: number;
      description: string;
      // 1. 图片生成描述 (For NanoBananaPro)
      image_prompt?: string;
      // 2. 视频生成分镜脚本 (For 4-10s Video)
      // 2.1 基础信息
      duration_seconds?: number;
      location?: string;
      time_weather?: string;
      // 2.2 镜头设计
      shot_type?: string;
      shot_type_name?: string;
      camera_position?: string;
      camera_movement?: string;
      camera_movement_name?: string;
      movement_details?: string;
      camera_angle?: string;
      camera_angle_name?: string;
      focal_length?: string;
      depth_of_field?: string;
      depth_of_field_name?: string;
      // 2.3 光影设计
      lighting_type?: string;
      lighting_name?: string;
      light_source?: string;
      light_position?: string;
      light_quality?: string;
      color_tone?: string;
      // 2.4 构图设计
      composition?: string;
      composition_name?: string;
      subject_position?: string;
      foreground?: string;
      background?: string;
      // 2.5 角色表演 (关键帧 - 完整视频内容)
      performance_start?: string;
      performance_action?: string;
      performance_end?: string;
      emotion_curve?: string;
      facial_expression?: string;
      eye_direction?: string;
      body_language?: string;
      interaction_with_environment?: string;
      performance_rhythm?: string;
      // 2.6 对白/旁白 (带时机)
      dialogue?: string;
      dialogue_timing?: string;
      dialogue_tone?: string;
      voice_type?: string;
      // 2.7 音效设计 (带时机)
      ambient_sound?: string;
      ambient_sound_timing?: string;
      action_sound?: string;
      action_sound_timing?: string;
      special_sound?: string;
      special_sound_timing?: string;
      music?: string;
      music_timing?: string;
      // 2.8 特效/后期
      vfx?: string;
      color_grading?: string;
      speed_effect?: string;
      transition?: string;
      // 2.9 创意说明
      creative_intent?: string;
      narrative_function?: string;
      film_reference?: string;
      director_notes?: string;
      // Legacy
      prompt_text?: string;
      performance?: string;
    }>
  ) => Scene[];
  getScenesByProjectId: (projectId: string) => Scene[];
  deleteScenesByProjectId: (projectId: string) => void;
  updateScene: (sceneId: string, updates: Partial<Scene>) => Scene | null;
  createImage: (
    sceneId: string,
    storagePath: string,
    url: string,
    width?: number | null,
    height?: number | null
  ) => Image;
  getImagesBySceneId: (sceneId: string) => Image[];
  createVideo: (
    sceneId: string,
    storagePath: string,
    url: string,
    taskId?: string | null,
    duration?: number | null
  ) => Video;
  getVideosBySceneId: (sceneId: string) => Video[];
  updateVideo: (videoId: string, updates: Partial<Video>) => Video | null;
  getProjectWithScenes: (
    projectId: string,
    userId: string | null
  ) => { project: Project; scenes: (Scene & { images: Image[]; videos: Video[] })[] } | null;
}

export const localDb: LocalDb = {
  loadData,
  saveData,
  
  createProject(userId, title, story, style, shotCount) {
    const data = loadData();
    const now = new Date().toISOString();
    const project: Project = {
      id: generateId(),
      user_id: userId ?? "guest-user",
      title,
      story: story ?? null,
      style: style ?? null,
      shot_count: shotCount ?? 9,
      stage: "draft",
      // New stage system
      current_stage: "planning",
      stage_progress: DEFAULT_STAGE_PROGRESS,
      created_at: now,
      updated_at: now,
    };
    data.projects.push(project);
    saveData(data);
    return project;
  },

  getProjects(userId, options = {}) {
    const data = loadData();
    const effectiveUserId = userId ?? "guest-user";
    const userProjects = data.projects
      .filter((p) => p.user_id === effectiveUserId)
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const offset = (page - 1) * limit;
    return {
      projects: userProjects.slice(offset, offset + limit),
      total: userProjects.length,
    };
  },

  getProjectById(projectId, userId) {
    const data = loadData();
    const effectiveUserId = userId ?? "guest-user";
    return (
      data.projects.find(
        (p) => p.id === projectId && p.user_id === effectiveUserId
      ) ?? null
    );
  },

  updateProject(projectId, userId, updates) {
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

  updateProjectStage(projectId, userId, stage) {
    return this.updateProject(projectId, userId, { stage } as Partial<Project>);
  },

  // New stage management methods
  updateProjectCurrentStage(projectId, userId, stage) {
    return this.updateProject(projectId, userId, { 
      current_stage: stage 
    } as Partial<Project>);
  },

  updateStageProgress(projectId, userId, stage, status, data) {
    const project = this.getProjectById(projectId, userId);
    if (!project) return null;
    
    const stageProgress = project.stage_progress || DEFAULT_STAGE_PROGRESS;
    const stageKey = stage as keyof typeof stageProgress;
    
    if (stageProgress[stageKey]) {
      stageProgress[stageKey].status = status;
      if (status === "completed") {
        stageProgress[stageKey].completedAt = new Date().toISOString();
      }
      if (data) {
        stageProgress[stageKey].data = { ...stageProgress[stageKey].data, ...data };
      }
      
      // Unlock next stage if current is completed
      const stageOrder = ["planning", "story", "storyboard", "production", "complete"];
      const currentIndex = stageOrder.indexOf(stage);
      if (status === "completed" && currentIndex < stageOrder.length - 1) {
        const nextStage = stageOrder[currentIndex + 1];
        const nextStageKey = nextStage as keyof typeof stageProgress;
        if (stageProgress[nextStageKey] && stageProgress[nextStageKey].status === "locked") {
          stageProgress[nextStageKey].status = "active";
        }
      }
    }
    
    return this.updateProject(projectId, userId, { stage_progress: stageProgress });
  },

  canAccessStage(projectId, userId, stage) {
    const project = this.getProjectById(projectId, userId);
    if (!project) return false;
    
    const stageProgress = project.stage_progress || DEFAULT_STAGE_PROGRESS;
    const stageKey = stage as keyof typeof stageProgress;
    
    if (!stageProgress[stageKey]) return false;
    
    return stageProgress[stageKey].status !== "locked";
  },

  deleteProject(projectId, userId) {
    const data = loadData();
    const effectiveUserId = userId ?? "guest-user";
    const index = data.projects.findIndex(
      (p) => p.id === projectId && p.user_id === effectiveUserId
    );
    if (index === -1) return false;
    const projectScenes = data.scenes.filter(
      (s) => s.project_id === projectId
    );
    const sceneIds = projectScenes.map((s) => s.id);
    data.images = data.images.filter(
      (img) => !sceneIds.includes(img.scene_id)
    );
    data.videos = data.videos.filter(
      (vid) => !sceneIds.includes(vid.scene_id)
    );
    data.scenes = data.scenes.filter((s) => s.project_id !== projectId);
    data.projects.splice(index, 1);
    saveData(data);
    return true;
  },

  createScenes(projectId, scenes) {
    const data = loadData();
    const now = new Date().toISOString();
    const newScenes: Scene[] = scenes.map((s) => ({
      id: generateId(),
      project_id: projectId,
      order_index: s.order_index,
      description: s.description,
      description_confirmed: false,
      image_status: "pending",
      image_confirmed: false,
      video_status: "pending",
      video_confirmed: false,
      created_at: now,
      // 1. 图片生成描述 (For NanoBananaPro)
      image_prompt: s.image_prompt || null,
      // 2. 视频生成分镜脚本 (For 4-10s Video)
      // 2.1 基础信息
      duration_seconds: s.duration_seconds ?? null,
      location: s.location || null,
      time_weather: s.time_weather || null,
      // 2.2 镜头设计
      shot_type: s.shot_type || null,
      shot_type_name: s.shot_type_name || null,
      camera_position: s.camera_position || null,
      camera_movement: s.camera_movement || null,
      camera_movement_name: s.camera_movement_name || null,
      movement_details: s.movement_details || null,
      camera_angle: s.camera_angle || null,
      camera_angle_name: s.camera_angle_name || null,
      focal_length: s.focal_length || null,
      depth_of_field: s.depth_of_field || null,
      depth_of_field_name: s.depth_of_field_name || null,
      // 2.3 光影设计
      lighting_type: s.lighting_type || null,
      lighting_name: s.lighting_name || null,
      light_source: s.light_source || null,
      light_position: s.light_position || null,
      light_quality: s.light_quality || null,
      color_tone: s.color_tone || null,
      // 2.4 构图设计
      composition: s.composition || null,
      composition_name: s.composition_name || null,
      subject_position: s.subject_position || null,
      foreground: s.foreground || null,
      background: s.background || null,
      // 2.5 角色表演 (关键帧 - 完整视频内容)
      performance_start: s.performance_start || null,
      performance_action: s.performance_action || null,
      performance_end: s.performance_end || null,
      emotion_curve: s.emotion_curve || null,
      facial_expression: s.facial_expression || null,
      eye_direction: s.eye_direction || null,
      body_language: s.body_language || null,
      interaction_with_environment: s.interaction_with_environment || null,
      performance_rhythm: s.performance_rhythm || null,
      // 2.6 对白/旁白 (带时机)
      dialogue: s.dialogue || null,
      dialogue_timing: s.dialogue_timing || null,
      dialogue_tone: s.dialogue_tone || null,
      voice_type: s.voice_type || null,
      // 2.7 音效设计 (带时机)
      ambient_sound: s.ambient_sound || null,
      ambient_sound_timing: s.ambient_sound_timing || null,
      action_sound: s.action_sound || null,
      action_sound_timing: s.action_sound_timing || null,
      special_sound: s.special_sound || null,
      special_sound_timing: s.special_sound_timing || null,
      music: s.music || null,
      music_timing: s.music_timing || null,
      // 2.8 特效/后期
      vfx: s.vfx || null,
      color_grading: s.color_grading || null,
      speed_effect: s.speed_effect || null,
      transition: s.transition || null,
      // 2.9 创意说明
      creative_intent: s.creative_intent || null,
      narrative_function: s.narrative_function || null,
      film_reference: s.film_reference || null,
      director_notes: s.director_notes || null,
      // Legacy
      prompt_text: s.prompt_text || null,
      performance: s.performance || null,
    }));
    data.scenes.push(...newScenes);
    saveData(data);
    return newScenes;
  },

  getScenesByProjectId(projectId) {
    const data = loadData();
    return data.scenes
      .filter((s) => s.project_id === projectId)
      .sort((a, b) => a.order_index - b.order_index);
  },

  deleteScenesByProjectId(projectId) {
    const data = loadData();
    const sceneIds = data.scenes
      .filter((s) => s.project_id === projectId)
      .map((s) => s.id);
    data.images = data.images.filter(
      (img) => !sceneIds.includes(img.scene_id)
    );
    data.videos = data.videos.filter(
      (vid) => !sceneIds.includes(vid.scene_id)
    );
    data.scenes = data.scenes.filter((s) => s.project_id !== projectId);
    saveData(data);
  },

  updateScene(sceneId, updates) {
    const data = loadData();
    const index = data.scenes.findIndex((s) => s.id === sceneId);
    if (index === -1) return null;
    data.scenes[index] = { ...data.scenes[index], ...updates };
    saveData(data);
    return data.scenes[index];
  },

  createImage(sceneId, storagePath, url, width, height) {
    const data = loadData();
    const now = new Date().toISOString();
    const existingImages = data.images.filter(
      (img) => img.scene_id === sceneId
    );
    const maxVersion = existingImages.reduce(
      (max, img) => Math.max(max, img.version),
      0
    );
    const image: Image = {
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

  getImagesBySceneId(sceneId) {
    const data = loadData();
    return data.images
      .filter((img) => img.scene_id === sceneId)
      .sort((a, b) => b.version - a.version);
  },

  createVideo(sceneId, storagePath, url, taskId, duration) {
    const data = loadData();
    const now = new Date().toISOString();
    const existingVideos = data.videos.filter(
      (vid) => vid.scene_id === sceneId
    );
    const maxVersion = existingVideos.reduce(
      (max, vid) => Math.max(max, vid.version),
      0
    );
    const video: Video = {
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

  getVideosBySceneId(sceneId) {
    const data = loadData();
    return data.videos
      .filter((vid) => vid.scene_id === sceneId)
      .sort((a, b) => b.version - a.version);
  },

  updateVideo(videoId, updates) {
    const data = loadData();
    const index = data.videos.findIndex((v) => v.id === videoId);
    if (index === -1) return null;
    data.videos[index] = { ...data.videos[index], ...updates };
    saveData(data);
    return data.videos[index];
  },

  getProjectWithScenes(projectId, userId) {
    const project = this.getProjectById(projectId, userId);
    if (!project) return null;
    const scenes = this.getScenesByProjectId(projectId);
    const scenesWithMedia = scenes.map((scene) => ({
      ...scene,
      images: this.getImagesBySceneId(scene.id),
      videos: this.getVideosBySceneId(scene.id),
    }));
    return {
      project,
      scenes: scenesWithMedia,
    };
  },
};
