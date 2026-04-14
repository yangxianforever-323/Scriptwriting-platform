import { NextResponse } from "next/server";
import { storyboardStore, shotStore } from "@/lib/data-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  let activeBoard = storyboardStore.getActiveByProjectId(projectId);
  if (!activeBoard) {
    activeBoard = storyboardStore.create(projectId, {
      name: "版本 1",
      description: "默认分镜板",
    });
  }

  const shots = shotStore.getByStoryboardId(activeBoard.id);
  return NextResponse.json({ storyboard: activeBoard, shots });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();

    const board = storyboardStore.create(projectId, {
      name: body.name || "新版本",
      description: body.description || "",
    });
    return NextResponse.json(board, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create storyboard" }, { status: 500 });
  }
}
