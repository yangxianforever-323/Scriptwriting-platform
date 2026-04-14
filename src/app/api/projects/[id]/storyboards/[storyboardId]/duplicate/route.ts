import { NextResponse } from "next/server";
import { storyboardStore } from "@/lib/data-store";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; storyboardId: string }> }
) {
  try {
    const { storyboardId } = await params;
    const duplicated = storyboardStore.duplicate(storyboardId);
    if (!duplicated) {
      return NextResponse.json({ error: "Storyboard not found" }, { status: 404 });
    }
    return NextResponse.json(duplicated, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to duplicate storyboard" }, { status: 500 });
  }
}
