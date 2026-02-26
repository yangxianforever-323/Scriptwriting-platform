/**
 * Scene description confirmation API.
 * POST /api/scenes/:id/confirm-description - Confirm a scene's description
 */

import { NextResponse } from "next/server";
import {
  getSceneById,
  confirmSceneDescription,
  SceneError,
} from "@/lib/db/scenes";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    await getSceneById(id);
    const updatedScene = await confirmSceneDescription(id);
    return NextResponse.json({ scene: updatedScene });
  } catch (error) {
    if (error instanceof SceneError) {
      if (error.code === "not_found") {
        return NextResponse.json({ error: "Scene not found" }, { status: 404 });
      }
    }
    console.error("Error confirming scene description:", error);
    return NextResponse.json(
      { error: "Failed to confirm scene description" },
      { status: 500 }
    );
  }
}
