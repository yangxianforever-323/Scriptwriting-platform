import { NextResponse } from "next/server";
import { shotStore, storyboardStore } from "@/lib/data-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const activeBoard = storyboardStore.getActiveByProjectId(projectId);
  if (!activeBoard) return NextResponse.json([]);
  return NextResponse.json(shotStore.getByStoryboardId(activeBoard.id));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const { storyboardId, ...data } = body;

    // Use provided storyboardId or fallback to active board
    const boardId = storyboardId || storyboardStore.getActiveByProjectId(projectId)?.id;
    if (!boardId) return NextResponse.json({ error: "No storyboard found" }, { status: 404 });

    const shot = shotStore.create(boardId, data);
    return NextResponse.json(shot, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create shot" }, { status: 500 });
  }
}
