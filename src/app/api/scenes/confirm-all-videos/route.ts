/**
 * Confirm all scene videos API.
 * POST /api/scenes/confirm-all-videos - Confirm all scene videos for a project
 */

import { NextResponse } from "next/server";
import { confirmAllVideos, SceneError } from "@/lib/db/scenes";
import { updateProjectStage, ProjectError } from "@/lib/db/projects";

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

    const count = await confirmAllVideos(projectId);

    await updateProjectStage(projectId, null, "completed");

    return NextResponse.json({ count, stage: "completed" });
  } catch (error) {
    if (error instanceof SceneError) {
      if (error.code === "not_found") {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
    }
    if (error instanceof ProjectError) {
      if (error.code === "not_found") {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
    }
    console.error("Error confirming all videos:", error);
    return NextResponse.json(
      { error: "Failed to confirm all videos" },
      { status: 500 }
    );
  }
}
