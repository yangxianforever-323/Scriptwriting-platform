import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import { auditAllScenes, isAuditorConfigured, AuditorError } from "@/lib/agents/auditor";
import type { SceneDescription } from "@/types/ai";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!isAuditorConfigured()) {
      return NextResponse.json(
        { error: "AI audit service is not configured. Please set VOLC_API_KEY." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { projectId, enableAI = true, strictMode = false } = body;

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const project = dataStore.project.getById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const dbScenes = dataStore.scene.getByProjectId(projectId);
    if (dbScenes.length === 0) {
      return NextResponse.json(
        { error: "No scenes found. Generate scenes first." },
        { status: 400 }
      );
    }

    const planningData = (project.stage_progress as any)?.planning?.data || {};
    const scenes: SceneDescription[] = dbScenes.map((s) => ({
      order_index: s.order_index,
      description: s.description || "",
      duration_seconds: s.duration_seconds ?? undefined,
      location: s.location ?? undefined,
      time_weather: s.time_weather ?? undefined,
      image_prompt: s.image_prompt ?? undefined,
      shot_type: s.shot_type ?? undefined,
      shot_type_name: s.shot_type_name ?? undefined,
      camera_movement: s.camera_movement ?? undefined,
      camera_movement_name: s.camera_movement_name ?? undefined,
      camera_angle: s.camera_angle ?? undefined,
      lighting_type: s.lighting_type ?? undefined,
      emotion_curve: s.emotion_curve ?? undefined,
      dialogue: s.dialogue ?? undefined,
      dialogue_timing: s.dialogue_timing ?? undefined,
      creative_intent: s.creative_intent ?? undefined,
      director_notes: s.director_notes ?? undefined,
      film_reference: s.film_reference ?? undefined,
      performance_start: s.performance_start ?? undefined,
      performance_action: s.performance_action ?? undefined,
      sound_timing: s.sound_timing ?? undefined,
    }));

    const report = await auditAllScenes(scenes, {
      strictMode,
      characters: planningData.characters || [],
      locations: planningData.locations || [],
      authorIntent: planningData.authorIntent,
    });

    return NextResponse.json({
      success: true,
      report,
      message: `Audit complete: ${report.passedScenes}/${report.totalScenes} passed, ${report.errorScenes} errors, ${report.warningScenes} warnings`,
    });
  } catch (error) {
    console.error("Error auditing scenes:", error);

    if (error instanceof AuditorError) {
      return NextResponse.json(
        { error: `Audit service error: ${error.message}` },
        { status: error.statusCode || 502 }
      );
    }

    return NextResponse.json(
      { error: "Failed to audit scenes" },
      { status: 500 }
    );
  }
}
