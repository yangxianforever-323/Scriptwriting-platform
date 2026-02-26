/**
 * Scene video confirmation API.
 * POST /api/scenes/:id/confirm-video - Confirm a scene's video
 */

import { NextResponse } from "next/server";
import {
  getSceneById,
  confirmSceneVideo,
  SceneError,
} from "@/lib/db/scenes";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const scene = await getSceneById(id);

    if (scene.video_status !== "completed") {
      return NextResponse.json(
        { error: "Video must be completed before confirming" },
        { status: 400 }
      );
    }

    const updatedScene = await confirmSceneVideo(id);
    return NextResponse.json({ scene: updatedScene });
  } catch (error) {
    if (error instanceof SceneError) {
      if (error.code === "not_found") {
        return NextResponse.json({ error: "Scene not found" }, { status: 404 });
      }
    }
    console.error("Error confirming scene video:", error);
    return NextResponse.json(
      { error: "Failed to confirm scene video" },
      { status: 500 }
    );
  }
}
