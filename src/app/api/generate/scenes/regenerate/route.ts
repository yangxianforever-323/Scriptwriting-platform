/**
 * Scene regeneration API route.
 * POST /api/generate/scenes/regenerate - Regenerate scenes with optional shot count
 */

export const maxDuration = 300; // 5 minutes for detailed scene generation
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getProjectById, updateProject, updateProjectStage } from "@/lib/db/projects";
import {
  createScenes,
  deleteScenesByProjectId,
  getScenesByProjectId,
} from "@/lib/db/scenes";
import {
  regenerateScenes,
  isDeepSeekConfigured,
  DeepSeekApiError,
} from "@/lib/ai/deepseek";

export async function POST(request: Request) {
  try {
    if (!isDeepSeekConfigured()) {
      return NextResponse.json(
        { error: "AI service is not configured. Please set VOLC_API_KEY." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { projectId, shotCount, feedback } = body;

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const validShotCounts = [9, 16, 25];
    const finalShotCount = validShotCounts.includes(shotCount) ? shotCount : 9;

    const project = await getProjectById(projectId, null);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.story) {
      return NextResponse.json(
        { error: "Project has no story content. Please add a story first." },
        { status: 400 }
      );
    }

    const existingScenes = await getScenesByProjectId(projectId);
    const previousSceneDescriptions = existingScenes.map((scene) => ({
      order_index: scene.order_index,
      description: scene.description,
    }));

    const sceneDescriptions = await regenerateScenes(
      project.story,
      project.style ?? undefined,
      finalShotCount,
      previousSceneDescriptions.length > 0 ? previousSceneDescriptions : undefined,
      feedback
    );

    if (sceneDescriptions.length === 0) {
      return NextResponse.json(
        { error: "Failed to regenerate scenes. Please try again." },
        { status: 500 }
      );
    }

    await deleteScenesByProjectId(projectId);

    const newScenes = await createScenes(
      projectId,
      sceneDescriptions.map((s) => ({
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
        action_sound: s.action_sound,
        special_sound: s.special_sound,
        music: s.music,
        music_mood: s.music_mood,
        sound_timing: s.sound_timing,
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

    if (finalShotCount !== project.shot_count) {
      await updateProject(projectId, null, { shot_count: finalShotCount });
    }

    await updateProjectStage(projectId, null, "scenes");

    return NextResponse.json({
      success: true,
      scenes: newScenes,
      message: `Successfully regenerated ${newScenes.length} scenes`,
    });
  } catch (error) {
    console.error("Error regenerating scenes:", error);

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
      { error: "Failed to regenerate scenes" },
      { status: 500 }
    );
  }
}
