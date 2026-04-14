import { NextResponse } from "next/server";
import { storySceneStore } from "@/lib/data-store";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; actId: string; sceneId: string }> }
) {
  const { sceneId } = await params;
  storySceneStore.delete(sceneId);
  return NextResponse.json({ success: true });
}
