import { NextResponse } from "next/server";
import { storySceneStore } from "@/lib/data-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; actId: string }> }
) {
  const { actId } = await params;
  const scenes = storySceneStore.getByActId(actId);
  return NextResponse.json(scenes);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; actId: string }> }
) {
  try {
    const { actId } = await params;
    const body = await request.json();
    const scene = storySceneStore.create(actId, body);
    return NextResponse.json(scene, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create scene" }, { status: 500 });
  }
}
