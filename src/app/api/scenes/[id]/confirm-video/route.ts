/**
 * Scene image confirmation API.
 * POST /api/scenes/:id/confirm-image - Confirm a scene's image
 */

import { NextResponse } from "next/server";
import {
  getSceneById,
  confirmSceneImage,
  SceneError,
} from "@/lib/db/scenes";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const scene = await getSceneById(id);

    if (scene.image_status !== "completed") {
      return NextResponse.json(
        { error: "Image must be completed before confirming" },
        { status: 400 }
      );
    }

    const updatedScene = await confirmSceneImage(id);
    return NextResponse.json({ scene: updatedScene });
  } catch (error) {
    if (error instanceof SceneError) {
      if (error.code === "not_found") {
        return NextResponse.json({ error: "Scene not found" }, { status: 404 });
      }
    }
    console.error("Error confirming scene image:", error);
    return NextResponse.json(
      { error: "Failed to confirm scene image" },
      { status: 500 }
    );
  }
}
