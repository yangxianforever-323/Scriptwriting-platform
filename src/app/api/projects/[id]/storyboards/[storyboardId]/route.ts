import { NextResponse } from "next/server";
import { storyboardStore } from "@/lib/data-store";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; storyboardId: string }> }
) {
  const { storyboardId } = await params;
  storyboardStore.delete(storyboardId);
  return NextResponse.json({ success: true });
}
