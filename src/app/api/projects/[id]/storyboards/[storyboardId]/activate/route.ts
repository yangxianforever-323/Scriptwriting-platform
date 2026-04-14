import { NextResponse } from "next/server";
import { storyboardStore, shotStore } from "@/lib/data-store";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; storyboardId: string }> }
) {
  try {
    const { storyboardId } = await params;
    const activated = storyboardStore.setActive(storyboardId);
    if (!activated) {
      return NextResponse.json({ error: "Storyboard not found" }, { status: 404 });
    }
    const shots = shotStore.getByStoryboardId(activated.id);
    return NextResponse.json({ storyboard: activated, shots });
  } catch (error) {
    return NextResponse.json({ error: "Failed to activate storyboard" }, { status: 500 });
  }
}
