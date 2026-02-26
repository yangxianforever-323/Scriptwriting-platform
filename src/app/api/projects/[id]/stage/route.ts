/**
 * Project stage management API routes.
 * POST /api/projects/[id]/stage - Update stage progress
 */

import { NextResponse } from "next/server";
import { getProjectById } from "@/lib/db/projects";
import { localDb } from "@/lib/db/local-db";
import type { stage_status } from "@/types/database";

interface StageUpdateRequest {
  stage: string;
  status: stage_status;
  data?: Record<string, unknown>;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: StageUpdateRequest = await request.json();
    const { stage, status, data } = body;

    // Verify project exists
    const project = await getProjectById(id, null);
    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Update stage progress
    const updatedProject = localDb.updateStageProgress(
      id,
      null,
      stage,
      status,
      data
    );

    if (!updatedProject) {
      return NextResponse.json(
        { error: "Failed to update stage" },
        { status: 500 }
      );
    }

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error("Error updating stage:", error);
    return NextResponse.json(
      { error: "Failed to update stage" },
      { status: 500 }
    );
  }
}
