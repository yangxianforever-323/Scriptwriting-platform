import { NextResponse } from "next/server";
import { updateSceneDescription, SceneError } from "@/lib/db/scenes";
import { localDb } from "@/lib/db/local-db";

interface Params {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { description } = body;

    if (!description || typeof description !== "string") {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    const updatedScene = await updateSceneDescription(id, description);

    return NextResponse.json({ scene: updatedScene });
  } catch (error) {
    if (error instanceof SceneError && error.code === "not_found") {
      return NextResponse.json({ error: "Scene not found" }, { status: 404 });
    }
    console.error("Update scene error:", error);
    return NextResponse.json(
      { error: "Failed to update scene" },
      { status: 500 }
    );
  }
}
