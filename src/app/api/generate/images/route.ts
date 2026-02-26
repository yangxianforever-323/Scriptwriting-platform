/**
 * Batch image generation API.
 * POST /api/generate/images - Generate images for all scenes in a project
 */

import { NextResponse } from "next/server";
import { getScenesByProjectId, updateSceneImageStatus } from "@/lib/db/scenes";
import { getProjectById, updateProjectStage, ProjectError } from "@/lib/db/projects";
import {
  generateImage,
  isVolcImageConfigured,
  VolcImageApiError,
} from "@/lib/ai/volc-image";
import {
  uploadAndCreateImage,
  deleteOldSceneImages,
} from "@/lib/db/media";
import { ShotLanguageEngine, type ShotConfiguration } from "@/lib/shot-language";
import type { Image } from "@/types/database";

interface GenerationResult {
  sceneId: string;
  orderIndex: number;
  success: boolean;
  image?: Image;
  error?: string;
  shotConfig?: ShotConfiguration | null;
}

async function generateSceneImage(
  userId: string,
  projectId: string,
  sceneId: string,
  orderIndex: number,
  description: string,
  style?: string,
  useShotLanguage: boolean = true
): Promise<GenerationResult> {
  try {
    await updateSceneImageStatus(sceneId, "processing");

    let prompt = description;
    let shotConfig = null;

    if (useShotLanguage) {
      const shotResult = ShotLanguageEngine.generateShotFromDescription(description, {
        style: style || "cinematic",
      });
      prompt = shotResult.prompts.imagePrompt;
      shotConfig = shotResult.config;
    }

    const imageBase64 = await generateImage(prompt, style, {
      size: "2K",
    });

    await deleteOldSceneImages(sceneId);

    const timestamp = Date.now();
    const fileName = `scene-${orderIndex}-${timestamp}.png`;

    const image = await uploadAndCreateImage(
      userId,
      projectId,
      sceneId,
      fileName,
      imageBase64,
      {
        width: 1024,
        height: 1024,
        contentType: "image/png",
      }
    );

    await updateSceneImageStatus(sceneId, "completed");

    return {
      sceneId,
      orderIndex,
      success: true,
      image,
      shotConfig,
    };
  } catch (error) {
    await updateSceneImageStatus(sceneId, "failed");

    return {
      sceneId,
      orderIndex,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function POST(request: Request) {
  try {
    if (!isVolcImageConfigured()) {
      return NextResponse.json(
        { error: "Image generation service is not configured. Please set VOLC_API_KEY." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { projectId, useShotLanguage = true } = body;

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const project = await getProjectById(projectId, null);

    const scenes = await getScenesByProjectId(projectId);

    const scenesToGenerate = scenes.filter(
      (scene) =>
        scene.description_confirmed &&
        (scene.image_status === "pending" || scene.image_status === "failed")
    );

    if (scenesToGenerate.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No scenes require image generation. All scenes either have images or descriptions are not confirmed.",
        results: [],
        completed: 0,
        failed: 0,
      });
    }

    if (project.stage === "scenes") {
      await updateProjectStage(projectId, null, "images");
    }

    const results: GenerationResult[] = [];

    for (const scene of scenesToGenerate) {
      const result = await generateSceneImage(
        "guest-user",
        projectId,
        scene.id,
        scene.order_index,
        scene.description,
        project.style ?? undefined,
        useShotLanguage
      );
      results.push(result);
    }

    const completed = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Generated images for ${completed} scenes with professional shot language. ${failed} failed.`,
      results,
      completed,
      failed,
      total: scenesToGenerate.length,
      shotLanguageEnabled: useShotLanguage,
    });
  } catch (error) {
    console.error("Error generating images:", error);

    if (error instanceof VolcImageApiError) {
      return NextResponse.json(
        { error: `Image generation error: ${error.message}` },
        { status: 502 }
      );
    }

    if (error instanceof ProjectError) {
      if (error.code === "not_found") {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
    }

    return NextResponse.json(
      { error: "Failed to generate images" },
      { status: 500 }
    );
  }
}
