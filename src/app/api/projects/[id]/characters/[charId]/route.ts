import { NextResponse } from "next/server";
import { characterStore } from "@/lib/data-store";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; charId: string }> }
) {
  try {
    const { charId } = await params;
    const body = await request.json();
    const updated = characterStore.update(charId, body);
    if (!updated) return NextResponse.json({ error: "Character not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update character" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; charId: string }> }
) {
  const { charId } = await params;
  characterStore.delete(charId);
  return NextResponse.json({ success: true });
}
