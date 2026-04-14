import { NextResponse } from "next/server";
import { actStore, storySceneStore } from "@/lib/data-store";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; actId: string }> }
) {
  try {
    const { actId } = await params;
    const body = await request.json();
    const updated = actStore.update(actId, body);
    if (!updated) return NextResponse.json({ error: "Act not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update act" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; actId: string }> }
) {
  const { actId } = await params;
  actStore.delete(actId);
  return NextResponse.json({ success: true });
}
