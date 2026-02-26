/**
 * Scene data access layer using local file storage.
 */

import { localDb } from "./local-db";
import { updateProjectStage } from "./projects";
import type { Scene, SceneWithMedia } from "@/types/database";

export class SceneError extends Error {
  constructor(
    message: string,
    public code: "not_found" | "unauthorized" | "database_error"
  ) {
    super(message);
    this.name = "SceneError";
  }
}

export async function createScenes(
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
): Promise<Scene[]> {
  try {
    const newScenes = localDb.createScenes(projectId, scenes);
    return newScenes as Scene[];
  } catch (error) {
    console.error("Error creating scenes:", error);
    throw new SceneError("Failed to create scenes", "database_error");
  }
}

export async function getScenesByProjectId(projectId: string): Promise<Scene[]> {
  try {
    const scenes = localDb.getScenesByProjectId(projectId);
    return scenes as Scene[];
  } catch (error) {
    console.error("Error fetching scenes:", error);
    throw new SceneError("Failed to fetch scenes", "database_error");
  }
}

export async function getScenesWithMediaByProjectId(
  projectId: string
): Promise<SceneWithMedia[]> {
  try {
    const scenes = localDb.getScenesByProjectId(projectId);
    return scenes.map((scene) => ({
      ...scene,
      images: localDb.getImagesBySceneId(scene.id),
      videos: localDb.getVideosBySceneId(scene.id),
    })) as SceneWithMedia[];
  } catch (error) {
    console.error("Error fetching scenes with media:", error);
    throw new SceneError("Failed to fetch scenes with media", "database_error");
  }
}

export async function getSceneById(sceneId: string): Promise<Scene> {
  try {
    const scenes = localDb.getScenesByProjectId("");
    const scene = scenes.find((s) => s.id === sceneId);
    if (!scene) {
      throw new SceneError("Scene not found", "not_found");
    }
    return scene as Scene;
  } catch (error) {
    if (error instanceof SceneError) throw error;
    console.error("Error fetching scene:", error);
    throw new SceneError("Failed to fetch scene", "database_error");
  }
}

export async function updateSceneDescription(
  sceneId: string,
  description: string
): Promise<Scene> {
  try {
    const scene = localDb.updateScene(sceneId, { description });
    if (!scene) {
      throw new SceneError("Scene not found", "not_found");
    }
    return scene as Scene;
  } catch (error) {
    if (error instanceof SceneError) throw error;
    console.error("Error updating scene description:", error);
    throw new SceneError("Failed to update scene description", "database_error");
  }
}

export async function confirmSceneDescription(sceneId: string): Promise<Scene> {
  try {
    const scene = localDb.updateScene(sceneId, { description_confirmed: true });
    if (!scene) {
      throw new SceneError("Scene not found", "not_found");
    }
    return scene as Scene;
  } catch (error) {
    if (error instanceof SceneError) throw error;
    console.error("Error confirming scene description:", error);
    throw new SceneError("Failed to confirm scene description", "database_error");
  }
}

export async function confirmAllDescriptions(projectId: string): Promise<number> {
  try {
    const scenes = localDb.getScenesByProjectId(projectId);
    let count = 0;
    for (const scene of scenes) {
      localDb.updateScene(scene.id, { description_confirmed: true });
      count++;
    }
    await updateProjectStage(projectId, null, "images");
    return count;
  } catch (error) {
    console.error("Error confirming all descriptions:", error);
    throw new SceneError("Failed to confirm all descriptions", "database_error");
  }
}

export async function updateSceneImageStatus(
  sceneId: string,
  status: "pending" | "processing" | "completed" | "failed"
): Promise<Scene> {
  try {
    const scene = localDb.updateScene(sceneId, { image_status: status });
    if (!scene) {
      throw new SceneError("Scene not found", "not_found");
    }
    return scene as Scene;
  } catch (error) {
    if (error instanceof SceneError) throw error;
    console.error("Error updating scene image status:", error);
    throw new SceneError("Failed to update scene image status", "database_error");
  }
}

export async function confirmSceneImage(sceneId: string): Promise<Scene> {
  try {
    const scene = localDb.updateScene(sceneId, { image_confirmed: true });
    if (!scene) {
      throw new SceneError("Scene not found", "not_found");
    }
    return scene as Scene;
  } catch (error) {
    if (error instanceof SceneError) throw error;
    console.error("Error confirming scene image:", error);
    throw new SceneError("Failed to confirm scene image", "database_error");
  }
}

export async function confirmAllImages(projectId: string): Promise<number> {
  try {
    const scenes = localDb.getScenesByProjectId(projectId);
    let count = 0;
    for (const scene of scenes) {
      if (scene.image_status === "completed") {
        localDb.updateScene(scene.id, { image_confirmed: true });
        count++;
      }
    }
    await updateProjectStage(projectId, null, "videos");
    return count;
  } catch (error) {
    console.error("Error confirming all images:", error);
    throw new SceneError("Failed to confirm all images", "database_error");
  }
}

export async function updateSceneVideoStatus(
  sceneId: string,
  status: "pending" | "processing" | "completed" | "failed"
): Promise<Scene> {
  try {
    const scene = localDb.updateScene(sceneId, { video_status: status });
    if (!scene) {
      throw new SceneError("Scene not found", "not_found");
    }
    return scene as Scene;
  } catch (error) {
    if (error instanceof SceneError) throw error;
    console.error("Error updating scene video status:", error);
    throw new SceneError("Failed to update scene video status", "database_error");
  }
}

export async function confirmSceneVideo(sceneId: string): Promise<Scene> {
  try {
    const scene = localDb.updateScene(sceneId, { video_confirmed: true });
    if (!scene) {
      throw new SceneError("Scene not found", "not_found");
    }
    return scene as Scene;
  } catch (error) {
    if (error instanceof SceneError) throw error;
    console.error("Error confirming scene video:", error);
    throw new SceneError("Failed to confirm scene video", "database_error");
  }
}

export async function confirmAllVideos(projectId: string): Promise<number> {
  try {
    const scenes = localDb.getScenesByProjectId(projectId);
    let count = 0;
    for (const scene of scenes) {
      if (scene.video_status === "completed") {
        localDb.updateScene(scene.id, { video_confirmed: true });
        count++;
      }
    }
    await updateProjectStage(projectId, null, "completed");
    return count;
  } catch (error) {
    console.error("Error confirming all videos:", error);
    throw new SceneError("Failed to confirm all videos", "database_error");
  }
}

export async function deleteScenesByProjectId(projectId: string): Promise<number> {
  try {
    const scenes = localDb.getScenesByProjectId(projectId);
    const sceneIds = scenes.map((s) => s.id);
    const count = sceneIds.length;
    
    // Delete related images and videos
    for (const sceneId of sceneIds) {
      const images = localDb.getImagesBySceneId(sceneId);
      for (const image of images) {
        // Delete image file if needed
      }
      const videos = localDb.getVideosBySceneId(sceneId);
      for (const video of videos) {
        // Delete video file if needed
      }
    }
    
    // Use localDb to delete scenes
    localDb.deleteScenesByProjectId(projectId);
    return count;
  } catch (error) {
    console.error("Error deleting scenes:", error);
    throw new SceneError("Failed to delete scenes", "database_error");
  }
}

export async function resetSceneImageStatus(sceneId: string): Promise<Scene> {
  try {
    const scene = localDb.updateScene(sceneId, {
      image_status: "pending",
      image_confirmed: false,
    });
    if (!scene) {
      throw new SceneError("Scene not found", "not_found");
    }
    return scene as Scene;
  } catch (error) {
    if (error instanceof SceneError) throw error;
    console.error("Error resetting scene image status:", error);
    throw new SceneError("Failed to reset scene image status", "database_error");
  }
}

export async function resetSceneVideoStatus(sceneId: string): Promise<Scene> {
  try {
    const scene = localDb.updateScene(sceneId, {
      video_status: "pending",
      video_confirmed: false,
    });
    if (!scene) {
      throw new SceneError("Scene not found", "not_found");
    }
    return scene as Scene;
  } catch (error) {
    if (error instanceof SceneError) throw error;
    console.error("Error resetting scene video status:", error);
    throw new SceneError("Failed to reset scene video status", "database_error");
  }
}

export async function getConfirmedDescriptionCount(projectId: string): Promise<number> {
  try {
    const scenes = localDb.getScenesByProjectId(projectId);
    return scenes.filter((s) => s.description_confirmed).length;
  } catch (error) {
    console.error("Error counting confirmed descriptions:", error);
    throw new SceneError("Failed to count confirmed descriptions", "database_error");
  }
}

export async function getCompletedImageCount(projectId: string): Promise<number> {
  try {
    const scenes = localDb.getScenesByProjectId(projectId);
    return scenes.filter((s) => s.image_status === "completed").length;
  } catch (error) {
    console.error("Error counting completed images:", error);
    throw new SceneError("Failed to count completed images", "database_error");
  }
}

export async function getCompletedVideoCount(projectId: string): Promise<number> {
  try {
    const scenes = localDb.getScenesByProjectId(projectId);
    return scenes.filter((s) => s.video_status === "completed").length;
  } catch (error) {
    console.error("Error counting completed videos:", error);
    throw new SceneError("Failed to count completed videos", "database_error");
  }
}
