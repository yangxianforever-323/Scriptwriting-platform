/**
 * Confirm all scene images API.
 * POST /api/scenes/confirm-all-images - Confirm all scene images for a project
 */

import { NextResponse } from "next/server";
import { confirmAllImages, SceneError } from "@/lib/db/scenes";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    const count = await confirmAllImages(projectId);

    return NextResponse.json({ count });
  } catch (error) {
    if (error instanceof SceneError) {
      if (error.code === "not_found") {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
    }
    console.error("Error confirming all images:", error);
    return NextResponse.json(
      { error: "Failed to confirm all images" },
      { status: 500 }
    );
  }
}
