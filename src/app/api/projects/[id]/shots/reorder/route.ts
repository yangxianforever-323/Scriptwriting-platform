import { NextResponse } from "next/server";
import { shotStore } from "@/lib/data-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { storyboardId, shotIds } = body;
    if (!storyboardId || !Array.isArray(shotIds)) {
      return NextResponse.json({ error: "storyboardId and shotIds required" }, { status: 400 });
    }
    shotStore.reorder(storyboardId, shotIds);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to reorder shots" }, { status: 500 });
  }
}
