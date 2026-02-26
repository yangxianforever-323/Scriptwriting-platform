/**
 * Scene generation API routes.
 * POST /api/generate/scenes - Generate scenes from a project's story
 */

export const maxDuration = 300; // 5 minutes for detailed scene generation
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getProjectById, updateProjectStage } from "@/lib/db/projects";
import {
  createScenes,
  deleteScenesByProjectId,
} from "@/lib/db/scenes";
import {
  storyToScenes,
  isDeepSeekConfigured,
  DeepSeekApiError,
} from "@/lib/ai/deepseek";
import { ShotLanguageEngine } from "@/lib/shot-language";
import type { ShotConfiguration } from "@/lib/shot-language/types";
import type { SceneDescription } from "@/types/ai";

interface SceneWithShotLanguage extends SceneDescription {
  shotConfig?: Partial<ShotConfiguration>;
  imagePrompt?: string;
  videoPrompt?: string;
}

export async function POST(request: Request) {
  try {
    if (!isDeepSeekConfigured()) {
      return NextResponse.json(
        { error: "AI service is not configured. Please set VOLC_API_KEY." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { projectId, enableShotLanguage = true, shotCount } = body;

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const project = await getProjectById(projectId, null);

    if (!project.story) {
      return NextResponse.json(
        { error: "Project has no story content. Please add a story first." },
        { status: 400 }
      );
    }

    const targetShotCount = shotCount || project.shot_count || 9;
    const validShotCounts = [9, 16, 25];
    const finalShotCount = validShotCounts.includes(targetShotCount) ? targetShotCount : 9;

    const sceneDescriptions = await storyToScenes(
      project.story,
      project.style ?? undefined,
      finalShotCount
    );

    if (sceneDescriptions.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate scenes. Please try again." },
        { status: 500 }
      );
    }

    await deleteScenesByProjectId(projectId);

    let scenesWithShotLanguage: SceneWithShotLanguage[] = sceneDescriptions;

    if (enableShotLanguage) {
      scenesWithShotLanguage = sceneDescriptions.map((scene) => {
        const result = ShotLanguageEngine.generateShotFromDescription(
          scene.description,
          {
            style: project.style || "cinematic",
          }
        );

        return {
          order_index: scene.order_index,
          description: scene.description,
          shotConfig: result.config,
          imagePrompt: result.prompts.imagePrompt,
          videoPrompt: result.prompts.videoPrompt,
        };
      });
    }

    const newScenes = await createScenes(
      projectId,
      scenesWithShotLanguage.map((s) => ({
        order_index: s.order_index,
        description: s.description,
        // 1. Image generation (for NanoBananaPro)
        image_prompt: s.image_prompt,
        // 2. Video generation script (for 4-10s video)
        duration_seconds: s.duration_seconds,
        location: s.location,
        time_weather: s.time_weather,
        // Shot design
        shot_type: s.shot_type,
        shot_type_name: s.shot_type_name,
        camera_position: s.camera_position,
        camera_movement: s.camera_movement,
        camera_movement_name: s.camera_movement_name,
        movement_details: s.movement_details,
        camera_angle: s.camera_angle,
        camera_angle_name: s.camera_angle_name,
        focal_length: s.focal_length,
        depth_of_field: s.depth_of_field,
        depth_of_field_name: s.depth_of_field_name,
        // Lighting
        lighting_type: s.lighting_type,
        lighting_name: s.lighting_name,
        light_source: s.light_source,
        light_position: s.light_position,
        light_quality: s.light_quality,
        color_tone: s.color_tone,
        // Composition
        composition: s.composition,
        composition_name: s.composition_name,
        subject_position: s.subject_position,
        foreground: s.foreground,
        background: s.background,
        // Performance (keyframes - full video content)
        performance_start: s.performance_start,
        performance_action: s.performance_action,
        performance_end: s.performance_end,
        emotion_curve: s.emotion_curve,
        facial_expression: s.facial_expression,
        eye_direction: s.eye_direction,
        body_language: s.body_language,
        interaction_with_environment: s.interaction_with_environment,
        performance_rhythm: s.performance_rhythm,
        // Dialogue
        dialogue: s.dialogue,
        dialogue_timing: s.dialogue_timing,
        dialogue_tone: s.dialogue_tone,
        voice_type: s.voice_type,
        // Sound
        ambient_sound: s.ambient_sound,
        ambient_sound_timing: s.ambient_sound_timing,
        action_sound: s.action_sound,
        action_sound_timing: s.action_sound_timing,
        special_sound: s.special_sound,
        special_sound_timing: s.special_sound_timing,
        music: s.music,
        music_timing: s.music_timing,
        // VFX
        vfx: s.vfx,
        color_grading: s.color_grading,
        speed_effect: s.speed_effect,
        transition: s.transition,
        // Creative
        creative_intent: s.creative_intent,
        narrative_function: s.narrative_function,
        film_reference: s.film_reference,
        director_notes: s.director_notes,
        // Legacy
        prompt_text: s.prompt_text,
      }))
    );

    const enhancedScenes = newScenes.map((scene, index) => ({
      ...scene,
      shotConfig: scenesWithShotLanguage[index]?.shotConfig,
      imagePrompt: scenesWithShotLanguage[index]?.imagePrompt,
      videoPrompt: scenesWithShotLanguage[index]?.videoPrompt,
    }));

    await updateProjectStage(projectId, null, "scenes");

    return NextResponse.json({
      success: true,
      scenes: enhancedScenes,
      shotLanguageEnabled: enableShotLanguage,
      shotCount: finalShotCount,
      message: `Successfully generated ${newScenes.length} scenes with professional shot language`,
    });
  } catch (error) {
    console.error("Error generating scenes:", error);

    if (error instanceof DeepSeekApiError) {
      return NextResponse.json(
        { error: `AI service error: ${error.message}` },
        { status: 502 }
      );
    }

    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: "Failed to generate scenes" },
      { status: 500 }
    );
  }
}
