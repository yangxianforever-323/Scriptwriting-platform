/**
 * Single scene image generation API.
 * POST /api/generate/image/[sceneId] - Generate image for a single scene
 */

import { NextResponse } from "next/server";
import { getSceneById, updateSceneImageStatus, SceneError } from "@/lib/db/scenes";
import { getProjectById, ProjectError } from "@/lib/db/projects";
import {
  generateImage,
  isVolcImageConfigured,
  VolcImageApiError,
} from "@/lib/ai/volc-image";
import {
  uploadAndCreateImage,
  deleteOldSceneImages,
} from "@/lib/db/media";

interface RouteParams {
  params: Promise<{ sceneId: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { sceneId } = await params;

    if (!isVolcImageConfigured()) {
      return NextResponse.json(
        { error: "Image generation service is not configured. Please set VOLC_API_KEY." },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { projectId } = body;

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const project = await getProjectById(projectId, null);
    const scene = await getSceneById(sceneId);

    if (scene.project_id !== projectId) {
      return NextResponse.json(
        { error: "Scene does not belong to this project" },
        { status: 400 }
      );
    }

    if (!scene.description_confirmed) {
      return NextResponse.json(
        { error: "Scene description must be confirmed before generating image" },
        { status: 400 }
      );
    }

    await updateSceneImageStatus(sceneId, "processing");

    try {
      const imageBase64 = await generateImage(
        scene.description,
        project.style ?? undefined,
        { size: "2K" }
      );

      await deleteOldSceneImages(sceneId);

      const timestamp = Date.now();
      const fileName = `scene-${scene.order_index}-${timestamp}.png`;

      const image = await uploadAndCreateImage(
        "guest-user",
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

      const updatedScene = await updateSceneImageStatus(sceneId, "completed");

      return NextResponse.json({
        success: true,
        image,
        scene: updatedScene,
        message: "Image generated successfully",
      });
    } catch (generationError) {
      await updateSceneImageStatus(sceneId, "failed");
      throw generationError;
    }
  } catch (error) {
    console.error("Error generating image:", error);

    if (error instanceof VolcImageApiError) {
      return NextResponse.json(
        { error: `Image generation error: ${error.message}` },
        { status: 502 }
      );
    }

    if (error instanceof SceneError || error instanceof ProjectError) {
      if (error.code === "not_found") {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
    }

    return NextResponse.json(
      { error: "Failed to generate image" },
      { status: 500 }
    );
  }
}
