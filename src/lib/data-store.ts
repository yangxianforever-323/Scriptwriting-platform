/**
 * 统一数据持久化层
 * 将所有数据（项目、故事、角色、场景、分镜）统一存储到 JSON 文件
 */

import fs from "fs";
import path from "path";
import type { Project, Scene, Image, Video } from "@/types/database";
import type {
  Story,
  Act,
  StoryScene,
  Character,
  Location,
  Prop,
} from "@/types/story";
import type { Storyboard, Shot, ShotImageStatus, ShotVideoStatus } from "@/types/storyboard";
import type { Asset, AssetCategory, AssetFilter } from "@/types/asset";

const DATA_DIR = path.join(process.cwd(), "data");
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

interface DataFiles {
  projects: string;
  scenes: string;
  images: string;
  videos: string;
  stories: string;
  acts: string;
  storyScenes: string;
  characters: string;
  locations: string;
  props: string;
  storyboards: string;
  shots: string;
  assets: string;
}

const FILES: DataFiles = {
  projects: path.join(DATA_DIR, "projects.json"),
  scenes: path.join(DATA_DIR, "scenes.json"),
  images: path.join(DATA_DIR, "images.json"),
  videos: path.join(DATA_DIR, "videos.json"),
  stories: path.join(DATA_DIR, "stories.json"),
  acts: path.join(DATA_DIR, "acts.json"),
  storyScenes: path.join(DATA_DIR, "story_scenes.json"),
  characters: path.join(DATA_DIR, "characters.json"),
  locations: path.join(DATA_DIR, "locations.json"),
  props: path.join(DATA_DIR, "props.json"),
  storyboards: path.join(DATA_DIR, "storyboards.json"),
  shots: path.join(DATA_DIR, "shots.json"),
  assets: path.join(DATA_DIR, "assets.json"),
};

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJsonFile<T>(filePath: string): T[] {
  ensureDataDir();
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as T[];
  } catch {
    return [];
  }
}

function writeJsonFile<T>(filePath: string, data: T[]): void {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

// ============================================
// Projects (项目)
// ============================================
export const projectStore = {
  getAll(): Project[] {
    return readJsonFile<Project>(FILES.projects);
  },

  getById(id: string): Project | null {
    const projects = this.getAll();
    return projects.find((p) => p.id === id) || null;
  },

  getByUserId(userId: string): Project[] {
    const effectiveUserId = userId || "guest-user";
    return this.getAll()
      .filter((p) => p.user_id === effectiveUserId)
      .sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
  },

  create(data: {
    userId?: string | null;
    title: string;
    story?: string | null;
    style?: string | null;
    shotCount?: number;
  }): Project {
    const projects = this.getAll();
    const now = new Date().toISOString();
    const project: Project = {
      id: generateId(),
      user_id: data.userId ?? "guest-user",
      title: data.title,
      story: data.story ?? null,
      style: data.style ?? null,
      shot_count: data.shotCount ?? 9,
      stage: "draft",
      current_stage: "planning",
      stage_progress: {
        planning: { status: "active" },
        story: { status: "locked" },
        storyboard: { status: "locked" },
        production: { status: "locked" },
        complete: { status: "locked" },
      },
      created_at: now,
      updated_at: now,
    };
    projects.push(project);
    writeJsonFile(FILES.projects, projects);
    return project;
  },

  update(id: string, updates: Partial<Project>): Project | null {
    const projects = this.getAll();
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) return null;

    projects[index] = {
      ...projects[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    writeJsonFile(FILES.projects, projects);
    return projects[index];
  },

  delete(id: string): boolean {
    const projects = this.getAll();
    const index = projects.findIndex((p) => p.id === id);
    if (index === -1) return false;

    // 删除关联的场景、图片、视频
    sceneStore.deleteByProjectId(id);

    projects.splice(index, 1);
    writeJsonFile(FILES.projects, projects);
    return true;
  },

  updateStageProgress(
    projectId: string,
    stage: string,
    status: "locked" | "active" | "completed",
    data?: Record<string, unknown>
  ): Project | null {
    const project = this.getById(projectId);
    if (!project) return null;

    const stageProgress = project.stage_progress || {};
    const stageKey = stage as keyof typeof stageProgress;

    if (stageProgress[stageKey]) {
      const stageData = stageProgress[stageKey] as any;
      stageData.status = status;
      if (status === "completed") {
        stageData.completedAt = new Date().toISOString();
      }
      if (data) {
        stageData.data = { ...(stageData.data || {}), ...data };
      }

      // 解锁下一阶段
      const stageOrder = ["planning", "story", "storyboard", "production", "complete"];
      const currentIndex = stageOrder.indexOf(stage);
      if (
        status === "completed" &&
        currentIndex < stageOrder.length - 1
      ) {
        const nextStage = stageOrder[currentIndex + 1];
        const nextKey = nextStage as keyof typeof stageProgress;
        if (stageProgress[nextKey]?.status === "locked") {
          stageProgress[nextKey].status = "active";
        }
      }
    }

    return this.update(projectId, { stage_progress: stageProgress });
  },
};

// ============================================
// Scenes (场景/分镜)
// ============================================
export const sceneStore = {
  getAll(): Scene[] {
    return readJsonFile<Scene>(FILES.scenes);
  },

  getByProjectId(projectId: string): Scene[] {
    return this.getAll()
      .filter((s) => s.project_id === projectId)
      .sort((a, b) => a.order_index - b.order_index);
  },

  getById(id: string): Scene | null {
    const scenes = this.getAll();
    return scenes.find((s) => s.id === id) || null;
  },

  create(projectId: string, data: Partial<Scene>): Scene {
    const scenes = this.getAll();
    const now = new Date().toISOString();
    const scene: Scene = {
      id: generateId(),
      project_id: projectId,
      order_index: data.order_index ?? scenes.length + 1,
      description: data.description || "",
      description_confirmed: false,
      image_status: "pending",
      image_confirmed: false,
      video_status: "pending",
      video_confirmed: false,
      created_at: now,
      duration_seconds: data.duration_seconds ?? null,
      location: data.location ?? null,
      time_weather: data.time_weather ?? null,
      image_prompt: data.image_prompt ?? null,
      shot_type: data.shot_type ?? null,
      shot_type_name: data.shot_type_name ?? null,
      camera_position: data.camera_position ?? null,
      camera_movement: data.camera_movement ?? null,
      camera_movement_name: data.camera_movement_name ?? null,
      movement_details: data.movement_details ?? null,
      camera_angle: data.camera_angle ?? null,
      camera_angle_name: data.camera_angle_name ?? null,
      focal_length: data.focal_length ?? null,
      depth_of_field: data.depth_of_field ?? null,
      depth_of_field_name: data.depth_of_field_name ?? null,
      lighting_type: data.lighting_type ?? null,
      lighting_name: data.lighting_name ?? null,
      light_source: data.light_source ?? null,
      light_position: data.light_position ?? null,
      light_quality: data.light_quality ?? null,
      color_tone: data.color_tone ?? null,
      composition: data.composition ?? null,
      composition_name: data.composition_name ?? null,
      subject_position: data.subject_position ?? null,
      foreground: data.foreground ?? null,
      background: data.background ?? null,
      performance_start: data.performance_start ?? null,
      performance_action: data.performance_action ?? null,
      performance_end: data.performance_end ?? null,
      emotion_curve: data.emotion_curve ?? null,
      facial_expression: data.facial_expression ?? null,
      eye_direction: data.eye_direction ?? null,
      body_language: data.body_language ?? null,
      interaction_with_environment:
        data.interaction_with_environment ?? null,
      dialogue: data.dialogue ?? null,
      dialogue_timing: data.dialogue_timing ?? null,
      dialogue_tone: data.dialogue_tone ?? null,
      voice_type: data.voice_type ?? null,
      ambient_sound: data.ambient_sound ?? null,
      action_sound: data.action_sound ?? null,
      special_sound: data.special_sound ?? null,
      music: data.music ?? null,
      music_mood: data.music_mood ?? null,
      sound_timing: data.sound_timing ?? null,
      vfx: data.vfx ?? null,
      color_grading: data.color_grading ?? null,
      speed_effect: data.speed_effect ?? null,
      transition: data.transition ?? null,
      creative_intent: data.creative_intent ?? null,
      narrative_function: data.narrative_function ?? null,
      film_reference: data.film_reference ?? null,
      director_notes: data.director_notes ?? null,
      prompt_text: data.prompt_text ?? null,
      performance: data.performance ?? null,
      performance_rhythm: data.performance_rhythm ?? null,
    };
    scenes.push(scene);
    writeJsonFile(FILES.scenes, scenes);
    return scene;
  },

  createBatch(projectId: string, dataList: Partial<Scene>[]): Scene[] {
    return dataList.map((data) => this.create(projectId, data));
  },

  update(id: string, updates: Partial<Scene>): Scene | null {
    const scenes = this.getAll();
    const index = scenes.findIndex((s) => s.id === id);
    if (index === -1) return null;

    scenes[index] = { ...scenes[index], ...updates };
    writeJsonFile(FILES.scenes, scenes);
    return scenes[index];
  },

  delete(id: string): boolean {
    const scenes = this.getAll();
    const index = scenes.findIndex((s) => s.id === id);
    if (index === -1) return false;

    // 删除关联的图片和视频
    imageStore.deleteBySceneId(id);
    videoStore.deleteBySceneId(id);

    scenes.splice(index, 1);
    writeJsonFile(FILES.scenes, scenes);
    return true;
  },

  deleteByProjectId(projectId: string): void {
    const scenes = this.getByProjectId(projectId);
    scenes.forEach((s) => this.delete(s.id));
  },
};

// ============================================
// Images (图片)
// ============================================
export const imageStore = {
  getAll(): Image[] {
    return readJsonFile<Image>(FILES.images);
  },

  getBySceneId(sceneId: string): Image[] {
    return this.getAll()
      .filter((img) => img.scene_id === sceneId)
      .sort((a, b) => b.version - a.version);
  },

  create(sceneId: string, data: {
    storagePath: string;
    url: string;
    width?: number | null;
    height?: number | null;
  }): Image {
    const images = this.getAll();
    const now = new Date().toISOString();
    const existingImages = this.getBySceneId(sceneId);
    const maxVersion = existingImages.reduce(
      (max, img) => Math.max(max, img.version),
      0
    );

    const image: Image = {
      id: generateId(),
      scene_id: sceneId,
      storage_path: data.storagePath,
      url: data.url,
      width: data.width ?? null,
      height: data.height ?? null,
      version: maxVersion + 1,
      created_at: now,
    };
    images.push(image);
    writeJsonFile(FILES.images, images);
    return image;
  },

  deleteBySceneId(sceneId: string): void {
    const images = this.getAll().filter((img) => img.scene_id !== sceneId);
    writeJsonFile(FILES.images, images);
  },
};

// ============================================
// Videos (视频)
// ============================================
export const videoStore = {
  getAll(): Video[] {
    return readJsonFile<Video>(FILES.videos);
  },

  getBySceneId(sceneId: string): Video[] {
    return this.getAll()
      .filter((vid) => vid.scene_id === sceneId)
      .sort((a, b) => b.version - a.version);
  },

  create(sceneId: string, data: {
    storagePath: string;
    url: string;
    taskId?: string | null;
    duration?: number | null;
  }): Video {
    const videos = this.getAll();
    const now = new Date().toISOString();
    const existingVideos = this.getBySceneId(sceneId);
    const maxVersion = existingVideos.reduce(
      (max, vid) => Math.max(max, vid.version),
      0
    );

    const video: Video = {
      id: generateId(),
      scene_id: sceneId,
      storage_path: data.storagePath,
      url: data.url,
      duration: data.duration ?? null,
      task_id: data.taskId ?? null,
      version: maxVersion + 1,
      created_at: now,
    };
    videos.push(video);
    writeJsonFile(FILES.videos, videos);
    return video;
  },

  update(id: string, updates: Partial<Video>): Video | null {
    const videos = this.getAll();
    const index = videos.findIndex((v) => v.id === id);
    if (index === -1) return null;

    videos[index] = { ...videos[index], ...updates };
    writeJsonFile(FILES.videos, videos);
    return videos[index];
  },

  deleteBySceneId(sceneId: string): void {
    const videos = this.getAll().filter((vid) => vid.scene_id !== sceneId);
    writeJsonFile(FILES.videos, videos);
  },
};

// ============================================
// Stories (故事)
// ============================================
export const storyStore = {
  getAll(): Story[] {
    return readJsonFile<Story>(FILES.stories);
  },

  getById(id: string): Story | null {
    const stories = this.getAll();
    return stories.find((s) => s.id === id) || null;
  },

  getByProjectId(projectId: string): Story | null {
    const stories = this.getAll();
    return stories.find((s) => s.projectId === projectId) || null;
  },

  create(projectId: string, data: Partial<Story> = {}): Story {
    const stories = this.getAll();
    const now = new Date().toISOString();

    const story: Story = {
      id: generateId(),
      projectId,
      title: data.title || "",
      logline: data.logline || "",
      synopsis: data.synopsis || "",
      structure: data.structure || "three-act",
      theme: data.theme || "",
      tone: data.tone || "",
      genre: data.genre || "",
      targetDuration: data.targetDuration || 60,
      acts: [],
      characters: [],
      locations: [],
      props: [],
      createdAt: now,
      updatedAt: now,
    };

    stories.push(story);
    writeJsonFile(FILES.stories, stories);
    return story;
  },

  update(id: string, updates: Partial<Story>): Story | null {
    const stories = this.getAll();
    const index = stories.findIndex((s) => s.id === id);
    if (index === -1) return null;

    stories[index] = {
      ...stories[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    writeJsonFile(FILES.stories, stories);
    return stories[index];
  },

  delete(id: string): boolean {
    const stories = this.getAll();
    const index = stories.findIndex((s) => s.id === id);
    if (index === -1) return false;

    actStore.deleteByStoryId(id);
    stories.splice(index, 1);
    writeJsonFile(FILES.stories, stories);
    return true;
  },

  deleteByProjectId(projectId: string): boolean {
    const stories = this.getAll();
    const toDelete = stories.filter((s) => s.projectId === projectId);
    if (toDelete.length === 0) return false;
    toDelete.forEach((s) => this.delete(s.id));
    return true;
  },
};

// ============================================
// Acts (幕)
// ============================================
export const actStore = {
  getAll(): Act[] {
    return readJsonFile<Act>(FILES.acts);
  },

  getByStoryId(storyId: string): Act[] {
    return this.getAll()
      .filter((a) => a.storyId === storyId)
      .sort((a, b) => a.index - b.index);
  },

  getById(id: string): Act | null {
    const acts = this.getAll();
    return acts.find((a) => a.id === id) || null;
  },

  create(storyId: string, data: Partial<Act> = {}): Act {
    const acts = this.getAll();
    const storyActs = this.getByStoryId(storyId);

    const act: Act = {
      id: generateId(),
      storyId,
      index: data.index ?? storyActs.length,
      title: data.title || `第${storyActs.length + 1}幕`,
      description: data.description || "",
      goal: data.goal || "",
      conflict: data.conflict || "",
      resolution: data.resolution || "",
      scenes: [],
    };

    acts.push(act);
    writeJsonFile(FILES.acts, acts);
    return act;
  },

  update(id: string, updates: Partial<Act>): Act | null {
    const acts = this.getAll();
    const index = acts.findIndex((a) => a.id === id);
    if (index === -1) return null;

    acts[index] = { ...acts[index], ...updates };
    writeJsonFile(FILES.acts, acts);
    return acts[index];
  },

  delete(id: string): boolean {
    const acts = this.getAll();
    const index = acts.findIndex((a) => a.id === id);
    if (index === -1) return false;

    storySceneStore.deleteByActId(id);
    acts.splice(index, 1);
    writeJsonFile(FILES.acts, acts);
    return true;
  },

  deleteByStoryId(storyId: string): void {
    const acts = this.getByStoryId(storyId);
    acts.forEach((a) => this.delete(a.id));
  },

  reorder(storyId: string, actIds: string[]): boolean {
    const acts = this.getAll();
    let updated = false;

    actIds.forEach((id, index) => {
      const actIndex = acts.findIndex(
        (a) => a.id === id && a.storyId === storyId
      );
      if (actIndex !== -1) {
        acts[actIndex].index = index;
        updated = true;
      }
    });

    if (updated) {
      writeJsonFile(FILES.acts, acts);
    }
    return updated;
  },
};

// ============================================
// StoryScenes (故事场景)
// ============================================
export const storySceneStore = {
  getAll(): StoryScene[] {
    return readJsonFile<StoryScene>(FILES.storyScenes);
  },

  getByActId(actId: string): StoryScene[] {
    return this.getAll()
      .filter((s) => s.actId === actId)
      .sort((a, b) => a.index - b.index);
  },

  getById(id: string): StoryScene | null {
    const scenes = this.getAll();
    return scenes.find((s) => s.id === id) || null;
  },

  create(actId: string, data: Partial<StoryScene> = {}): StoryScene {
    const scenes = this.getAll();
    const actScenes = this.getByActId(actId);

    const scene: StoryScene = {
      id: generateId(),
      actId,
      index: data.index ?? actScenes.length,
      title: data.title || `场景${actScenes.length + 1}`,
      description: data.description || "",
      locationId: data.locationId,
      characterIds: data.characterIds || [],
      propIds: data.propIds || [],
      timeOfDay: data.timeOfDay || "",
      weather: data.weather || "",
      mood: data.mood || "",
      dialogue: data.dialogue,
      notes: data.notes || "",
    };

    scenes.push(scene);
    writeJsonFile(FILES.storyScenes, scenes);
    return scene;
  },

  update(id: string, updates: Partial<StoryScene>): StoryScene | null {
    const scenes = this.getAll();
    const index = scenes.findIndex((s) => s.id === id);
    if (index === -1) return null;

    scenes[index] = { ...scenes[index], ...updates };
    writeJsonFile(FILES.storyScenes, scenes);
    return scenes[index];
  },

  delete(id: string): boolean {
    const scenes = this.getAll();
    const index = scenes.findIndex((s) => s.id === id);
    if (index === -1) return false;

    scenes.splice(index, 1);
    writeJsonFile(FILES.storyScenes, scenes);
    return true;
  },

  deleteByActId(actId: string): void {
    const scenes = this.getAll().filter((s) => s.actId !== actId);
    writeJsonFile(FILES.storyScenes, scenes);
  },
};

// ============================================
// Characters (角色)
// ============================================
export const characterStore = {
  getAll(): Character[] {
    return readJsonFile<Character>(FILES.characters);
  },

  getByProjectId(projectId: string): Character[] {
    return this.getAll().filter((c) => c.projectId === projectId);
  },

  getById(id: string): Character | null {
    const characters = this.getAll();
    return characters.find((c) => c.id === id) || null;
  },

  create(projectId: string, data: Partial<Character> = {}): Character {
    const characters = this.getAll();
    const now = new Date().toISOString();

    const character: Character = {
      id: generateId(),
      projectId,
      name: data.name || "",
      role: data.role || "supporting",
      age: data.age || "",
      gender: data.gender || "",
      appearance: data.appearance || "",
      personality: data.personality || "",
      background: data.background || "",
      motivation: data.motivation || "",
      arc: data.arc || "",
      referenceImages: data.referenceImages || [],
      tags: data.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    characters.push(character);
    writeJsonFile(FILES.characters, characters);
    return character;
  },

  createBatch(projectId: string, dataList: Partial<Character>[]): Character[] {
    return dataList.map((data) => this.create(projectId, data));
  },

  update(id: string, updates: Partial<Character>): Character | null {
    const characters = this.getAll();
    const index = characters.findIndex((c) => c.id === id);
    if (index === -1) return null;

    characters[index] = {
      ...characters[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    writeJsonFile(FILES.characters, characters);
    return characters[index];
  },

  delete(id: string): boolean {
    const characters = this.getAll();
    const index = characters.findIndex((c) => c.id === id);
    if (index === -1) return false;

    characters.splice(index, 1);
    writeJsonFile(FILES.characters, characters);
    return true;
  },

  deleteByProjectId(projectId: string): void {
    const characters = this.getAll().filter((c) => c.projectId !== projectId);
    writeJsonFile(FILES.characters, characters);
  },
};

// ============================================
// Locations (地点)
// ============================================
export const locationStore = {
  getAll(): Location[] {
    return readJsonFile<Location>(FILES.locations);
  },

  getByProjectId(projectId: string): Location[] {
    return this.getAll().filter((l) => l.projectId === projectId);
  },

  getById(id: string): Location | null {
    const locations = this.getAll();
    return locations.find((l) => l.id === id) || null;
  },

  create(projectId: string, data: Partial<Location> = {}): Location {
    const locations = this.getAll();
    const now = new Date().toISOString();

    const location: Location = {
      id: generateId(),
      projectId,
      name: data.name || "",
      description: data.description || "",
      type: data.type || "interior",
      atmosphere: data.atmosphere || "",
      keyFeatures: data.keyFeatures || [],
      referenceImages: data.referenceImages || [],
      tags: data.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    locations.push(location);
    writeJsonFile(FILES.locations, locations);
    return location;
  },

  createBatch(projectId: string, dataList: Partial<Location>[]): Location[] {
    return dataList.map((data) => this.create(projectId, data));
  },

  update(id: string, updates: Partial<Location>): Location | null {
    const locations = this.getAll();
    const index = locations.findIndex((l) => l.id === id);
    if (index === -1) return null;

    locations[index] = {
      ...locations[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    writeJsonFile(FILES.locations, locations);
    return locations[index];
  },

  delete(id: string): boolean {
    const locations = this.getAll();
    const index = locations.findIndex((l) => l.id === id);
    if (index === -1) return false;

    locations.splice(index, 1);
    writeJsonFile(FILES.locations, locations);
    return true;
  },

  deleteByProjectId(projectId: string): void {
    const locations = this.getAll().filter((l) => l.projectId !== projectId);
    writeJsonFile(FILES.locations, locations);
  },
};

// ============================================
// Props (道具)
// ============================================
export const propStore = {
  getAll(): Prop[] {
    return readJsonFile<Prop>(FILES.props);
  },

  getByProjectId(projectId: string): Prop[] {
    return this.getAll().filter((p) => p.projectId === projectId);
  },

  getById(id: string): Prop | null {
    const props = this.getAll();
    return props.find((p) => p.id === id) || null;
  },

  create(projectId: string, data: Partial<Prop> = {}): Prop {
    const props = this.getAll();
    const now = new Date().toISOString();

    const prop: Prop = {
      id: generateId(),
      projectId,
      name: data.name || "",
      description: data.description || "",
      importance: data.importance || "supporting",
      referenceImages: data.referenceImages || [],
      tags: data.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    props.push(prop);
    writeJsonFile(FILES.props, props);
    return prop;
  },

  update(id: string, updates: Partial<Prop>): Prop | null {
    const props = this.getAll();
    const index = props.findIndex((p) => p.id === id);
    if (index === -1) return null;

    props[index] = {
      ...props[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    writeJsonFile(FILES.props, props);
    return props[index];
  },

  delete(id: string): boolean {
    const props = this.getAll();
    const index = props.findIndex((p) => p.id === id);
    if (index === -1) return false;

    props.splice(index, 1);
    writeJsonFile(FILES.props, props);
    return true;
  },

  deleteByProjectId(projectId: string): void {
    const props = this.getAll().filter((p) => p.projectId !== projectId);
    writeJsonFile(FILES.props, props);
  },
};

// ============================================
// Storyboards (分镜版本)
// ============================================
export const storyboardStore = {
  getAll(): Storyboard[] {
    return readJsonFile<Storyboard>(FILES.storyboards);
  },

  getById(id: string): Storyboard | null {
    return this.getAll().find((sb) => sb.id === id) || null;
  },

  getByProjectId(projectId: string): Storyboard[] {
    return this.getAll()
      .filter((sb) => sb.projectId === projectId)
      .sort((a, b) => b.version - a.version);
  },

  getActiveByProjectId(projectId: string): Storyboard | null {
    return this.getAll().find((sb) => sb.projectId === projectId && sb.isActive) || null;
  },

  create(projectId: string, data: Partial<Storyboard> = {}): Storyboard {
    const storyboards = this.getAll();
    const now = new Date().toISOString();

    // Deactivate existing storyboards for this project
    storyboards.forEach((sb) => {
      if (sb.projectId === projectId) sb.isActive = false;
    });

    const projectBoards = storyboards.filter((sb) => sb.projectId === projectId);
    const nextVersion =
      projectBoards.length > 0
        ? Math.max(...projectBoards.map((sb) => sb.version)) + 1
        : 1;

    const storyboard: Storyboard = {
      id: generateId(),
      projectId,
      storyId: data.storyId,
      name: data.name || `版本 ${nextVersion}`,
      version: nextVersion,
      isActive: true,
      description: data.description || "",
      shotCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    storyboards.push(storyboard);
    writeJsonFile(FILES.storyboards, storyboards);
    return storyboard;
  },

  update(id: string, updates: Partial<Storyboard>): Storyboard | null {
    const storyboards = this.getAll();
    const index = storyboards.findIndex((sb) => sb.id === id);
    if (index === -1) return null;

    storyboards[index] = { ...storyboards[index], ...updates, updatedAt: new Date().toISOString() };
    writeJsonFile(FILES.storyboards, storyboards);
    return storyboards[index];
  },

  setActive(id: string): Storyboard | null {
    const storyboards = this.getAll();
    const target = storyboards.find((sb) => sb.id === id);
    if (!target) return null;

    storyboards.forEach((sb) => {
      if (sb.projectId === target.projectId) sb.isActive = false;
    });
    target.isActive = true;
    target.updatedAt = new Date().toISOString();

    writeJsonFile(FILES.storyboards, storyboards);
    return target;
  },

  delete(id: string): boolean {
    const storyboards = this.getAll();
    const filtered = storyboards.filter((sb) => sb.id !== id);
    if (filtered.length === storyboards.length) return false;
    writeJsonFile(FILES.storyboards, filtered);
    shotStore.deleteByStoryboardId(id);
    return true;
  },

  deleteByProjectId(projectId: string): void {
    const toDelete = this.getAll().filter((sb) => sb.projectId === projectId);
    toDelete.forEach((sb) => this.delete(sb.id));
  },

  duplicate(storyboardId: string, newName?: string): Storyboard | null {
    const source = this.getById(storyboardId);
    if (!source) return null;

    const newBoard = this.create(source.projectId, {
      name: newName || `${source.name} (复制)`,
      description: source.description,
      storyId: source.storyId,
    });

    // Copy shots
    const sourceShots = shotStore.getByStoryboardId(storyboardId);
    sourceShots.forEach((shot) => {
      shotStore.create(newBoard.id, {
        ...shot,
        imageUrl: undefined,
        imageStatus: "pending",
        videoUrl: undefined,
        videoStatus: "pending",
        imageVersions: [],
      });
    });

    return newBoard;
  },
};

// ============================================
// Shots (分镜帧)
// ============================================
export const shotStore = {
  getAll(): Shot[] {
    return readJsonFile<Shot>(FILES.shots);
  },

  getById(id: string): Shot | null {
    return this.getAll().find((s) => s.id === id) || null;
  },

  getByStoryboardId(storyboardId: string): Shot[] {
    return this.getAll()
      .filter((s) => s.storyboardId === storyboardId)
      .sort((a, b) => a.index - b.index);
  },

  create(storyboardId: string, data: Partial<Shot> = {}): Shot {
    const shots = this.getAll();
    const storyboardShots = shots.filter((s) => s.storyboardId === storyboardId);
    const now = new Date().toISOString();

    const shot: Shot = {
      id: generateId(),
      storyboardId,
      index: data.index ?? storyboardShots.length,
      title: data.title || `分镜 ${storyboardShots.length + 1}`,
      description: data.description || "",
      duration: data.duration ?? 6,
      storySceneId: data.storySceneId,
      actId: data.actId,
      characterIds: data.characterIds || [],
      locationId: data.locationId,
      propIds: data.propIds || [],
      imagePrompt: data.imagePrompt,
      imageUrl: data.imageUrl,
      imageStatus: (data.imageStatus as ShotImageStatus) || "pending",
      imageConfirmed: data.imageConfirmed ?? false,
      imageVersions: data.imageVersions || [],
      videoPrompt: data.videoPrompt,
      videoUrl: data.videoUrl,
      videoStatus: (data.videoStatus as ShotVideoStatus) || "pending",
      videoConfirmed: data.videoConfirmed ?? false,
      videoTaskId: data.videoTaskId,
      shotType: data.shotType || "MS",
      shotTypeName: data.shotTypeName || "中景",
      cameraPosition: data.cameraPosition,
      cameraMovement: data.cameraMovement,
      cameraMovementName: data.cameraMovementName,
      movementDetails: data.movementDetails,
      cameraAngle: data.cameraAngle,
      cameraAngleName: data.cameraAngleName,
      focalLength: data.focalLength,
      depthOfField: data.depthOfField,
      depthOfFieldName: data.depthOfFieldName,
      lightingType: data.lightingType,
      lightingName: data.lightingName,
      lightSource: data.lightSource,
      lightPosition: data.lightPosition,
      lightQuality: data.lightQuality,
      colorTone: data.colorTone,
      composition: data.composition,
      compositionName: data.compositionName,
      subjectPosition: data.subjectPosition,
      foreground: data.foreground,
      background: data.background,
      performanceStart: data.performanceStart,
      performanceAction: data.performanceAction,
      performanceEnd: data.performanceEnd,
      emotionCurve: data.emotionCurve,
      dialogue: data.dialogue,
      dialogueTiming: data.dialogueTiming,
      ambientSound: data.ambientSound,
      actionSound: data.actionSound,
      music: data.music,
      creativeIntent: data.creativeIntent,
      filmReference: data.filmReference,
      characterConsistency: data.characterConsistency,
      createdAt: now,
      updatedAt: now,
    };

    shots.push(shot);
    writeJsonFile(FILES.shots, shots);

    // Update storyboard shot count
    const storyboards = readJsonFile<Storyboard>(FILES.storyboards);
    const sbIndex = storyboards.findIndex((sb) => sb.id === storyboardId);
    if (sbIndex !== -1) {
      storyboards[sbIndex].shotCount = shots.filter((s) => s.storyboardId === storyboardId).length;
      storyboards[sbIndex].updatedAt = now;
      writeJsonFile(FILES.storyboards, storyboards);
    }

    return shot;
  },

  update(id: string, updates: Partial<Shot>): Shot | null {
    const shots = this.getAll();
    const index = shots.findIndex((s) => s.id === id);
    if (index === -1) return null;

    shots[index] = { ...shots[index], ...updates, updatedAt: new Date().toISOString() };
    writeJsonFile(FILES.shots, shots);
    return shots[index];
  },

  delete(id: string): boolean {
    const shots = this.getAll();
    const shot = shots.find((s) => s.id === id);
    if (!shot) return false;

    const filtered = shots.filter((s) => s.id !== id);
    // Reorder remaining shots in same storyboard
    filtered
      .filter((s) => s.storyboardId === shot.storyboardId)
      .sort((a, b) => a.index - b.index)
      .forEach((s, idx) => { s.index = idx; });
    writeJsonFile(FILES.shots, filtered);

    // Update storyboard shot count
    const storyboards = readJsonFile<Storyboard>(FILES.storyboards);
    const sbIndex = storyboards.findIndex((sb) => sb.id === shot.storyboardId);
    if (sbIndex !== -1) {
      storyboards[sbIndex].shotCount = filtered.filter((s) => s.storyboardId === shot.storyboardId).length;
      storyboards[sbIndex].updatedAt = new Date().toISOString();
      writeJsonFile(FILES.storyboards, storyboards);
    }
    return true;
  },

  deleteByStoryboardId(storyboardId: string): void {
    const shots = this.getAll().filter((s) => s.storyboardId !== storyboardId);
    writeJsonFile(FILES.shots, shots);
  },

  reorder(storyboardId: string, shotIds: string[]): boolean {
    const shots = this.getAll();
    let updated = false;
    shotIds.forEach((id, index) => {
      const i = shots.findIndex((s) => s.id === id && s.storyboardId === storyboardId);
      if (i !== -1) {
        shots[i].index = index;
        shots[i].updatedAt = new Date().toISOString();
        updated = true;
      }
    });
    if (updated) writeJsonFile(FILES.shots, shots);
    return updated;
  },

  batchDelete(shotIds: string[]): number {
    const shots = this.getAll();
    const filtered = shots.filter((s) => !shotIds.includes(s.id));
    const count = shots.length - filtered.length;
    if (count > 0) writeJsonFile(FILES.shots, filtered);
    return count;
  },
};

// ============================================
// Assets (素材库)
// ============================================
export const assetStore = {
  getAll(): Asset[] {
    return readJsonFile<Asset>(FILES.assets);
  },

  getById(id: string): Asset | null {
    return this.getAll().find((a) => a.id === id) || null;
  },

  getByProjectId(projectId: string, filter?: AssetFilter): Asset[] {
    let assets = this.getAll().filter((a) => a.projectId === projectId);

    if (filter?.category) {
      assets = assets.filter((a) => a.category === filter.category);
    }
    if (filter?.mediaType) {
      assets = assets.filter((a) => a.mediaType === filter.mediaType);
    }
    if (filter?.source) {
      assets = assets.filter((a) => a.source === filter.source);
    }
    if (filter?.linkedEntityId) {
      assets = assets.filter((a) => a.linkedEntityId === filter.linkedEntityId);
    }
    if (filter?.tags && filter.tags.length > 0) {
      assets = assets.filter((a) => filter.tags!.some((tag) => a.tags.includes(tag)));
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      assets = assets.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return assets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getByCategory(projectId: string, category: AssetCategory): Asset[] {
    return this.getByProjectId(projectId, { category });
  },

  getByLinkedEntity(entityId: string): Asset[] {
    return this.getAll().filter((a) => a.linkedEntityId === entityId);
  },

  create(data: Omit<Asset, "id" | "createdAt" | "updatedAt">): Asset {
    const assets = this.getAll();
    const now = new Date().toISOString();

    const asset: Asset = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    assets.push(asset);
    writeJsonFile(FILES.assets, assets);
    return asset;
  },

  update(id: string, updates: Partial<Asset>): Asset | null {
    const assets = this.getAll();
    const index = assets.findIndex((a) => a.id === id);
    if (index === -1) return null;

    assets[index] = { ...assets[index], ...updates, updatedAt: new Date().toISOString() };
    writeJsonFile(FILES.assets, assets);
    return assets[index];
  },

  delete(id: string): boolean {
    const assets = this.getAll();
    const asset = assets.find((a) => a.id === id);
    if (!asset) return false;

    // Delete physical file
    if (asset.storagePath) {
      const filePath = path.join(UPLOADS_DIR, asset.storagePath);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch { /* ignore */ }
      }
    }

    const filtered = assets.filter((a) => a.id !== id);
    writeJsonFile(FILES.assets, filtered);
    return true;
  },

  deleteByProjectId(projectId: string): void {
    const toDelete = this.getAll().filter((a) => a.projectId === projectId);
    toDelete.forEach((a) => this.delete(a.id));
  },

  deleteByLinkedEntity(entityId: string): void {
    const toDelete = this.getAll().filter((a) => a.linkedEntityId === entityId);
    toDelete.forEach((a) => this.delete(a.id));
  },

  // Save a base64 image to disk and create an asset record
  saveGeneratedImage(params: {
    projectId: string;
    category: AssetCategory;
    name: string;
    base64Data: string;
    mimeType: string;
    linkedEntityId?: string;
    linkedEntityType?: Asset["linkedEntityType"];
    generationPrompt?: string;
    generationModel?: string;
    tags?: string[];
  }): Asset {
    ensureDataDir();
    const ext = params.mimeType.split("/")[1] || "jpg";
    const filename = `${generateId()}.${ext}`;
    const subDir = `generated/${params.projectId}/${params.category}`;
    const dirPath = path.join(UPLOADS_DIR, subDir);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const filePath = path.join(dirPath, filename);
    const buffer = Buffer.from(params.base64Data, "base64");
    fs.writeFileSync(filePath, buffer);

    const storagePath = `${subDir}/${filename}`;
    const url = `/uploads/${storagePath}`;

    return this.create({
      projectId: params.projectId,
      category: params.category,
      mediaType: "image",
      source: "ai_generated",
      filename,
      storagePath,
      url,
      mimeType: params.mimeType,
      sizeBytes: buffer.length,
      name: params.name,
      description: "",
      tags: params.tags || [],
      linkedEntityId: params.linkedEntityId,
      linkedEntityType: params.linkedEntityType,
      generationPrompt: params.generationPrompt,
      generationModel: params.generationModel,
      version: 1,
    });
  },

  // Save an uploaded file to disk and create an asset record
  saveUploadedFile(params: {
    projectId: string;
    category: AssetCategory;
    name: string;
    fileBuffer: Buffer;
    filename: string;
    mimeType: string;
    linkedEntityId?: string;
    linkedEntityType?: Asset["linkedEntityType"];
    tags?: string[];
    description?: string;
  }): Asset {
    ensureDataDir();
    const ext = path.extname(params.filename) || ".bin";
    const safeFilename = `${generateId()}${ext}`;
    const subDir = `uploads/${params.projectId}/${params.category}`;
    const dirPath = path.join(UPLOADS_DIR, subDir);

    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }

    const filePath = path.join(dirPath, safeFilename);
    fs.writeFileSync(filePath, params.fileBuffer);

    const mediaType = params.mimeType.startsWith("video/") ? "video" : "image";
    const storagePath = `${subDir}/${safeFilename}`;
    const url = `/uploads/${storagePath}`;

    return this.create({
      projectId: params.projectId,
      category: params.category,
      mediaType,
      source: "uploaded",
      filename: safeFilename,
      storagePath,
      url,
      mimeType: params.mimeType,
      sizeBytes: params.fileBuffer.length,
      name: params.name,
      description: params.description || "",
      tags: params.tags || [],
      linkedEntityId: params.linkedEntityId,
      linkedEntityType: params.linkedEntityType,
      version: 1,
    });
  },
};

// ============================================
// Export unified store object
// ============================================
export const dataStore = {
  project: projectStore,
  scene: sceneStore,
  image: imageStore,
  video: videoStore,
  story: storyStore,
  act: actStore,
  storyScene: storySceneStore,
  character: characterStore,
  location: locationStore,
  prop: propStore,
  storyboard: storyboardStore,
  shot: shotStore,
  asset: assetStore,

  // Utility functions
  exportAll(): Record<string, unknown[]> {
    return {
      projects: this.project.getAll(),
      scenes: this.scene.getAll(),
      images: this.image.getAll(),
      videos: this.video.getAll(),
      stories: this.story.getAll(),
      acts: this.act.getAll(),
      storyScenes: this.storyScene.getAll(),
      characters: this.character.getAll(),
      locations: this.location.getAll(),
      props: this.prop.getAll(),
      storyboards: this.storyboard.getAll(),
      shots: this.shot.getAll(),
      assets: this.asset.getAll(),
    };
  },

  getProjectFullData(projectId: string) {
    const project = this.project.getById(projectId);
    if (!project) return null;

    return {
      project,
      scenes: this.scene.getByProjectId(projectId),
      story: this.story.getByProjectId(projectId),
      acts: this.story.getByProjectId(projectId)
        ? this.act.getByStoryId(this.story.getByProjectId(projectId)!.id)
        : [],
      characters: this.character.getByProjectId(projectId),
      locations: this.location.getByProjectId(projectId),
      props: this.prop.getByProjectId(projectId),
      storyboard: this.storyboard.getActiveByProjectId(projectId),
    };
  },
};
