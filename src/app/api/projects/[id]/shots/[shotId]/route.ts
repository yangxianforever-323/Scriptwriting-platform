import { NextResponse } from "next/server";
import { shotStore } from "@/lib/data-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; shotId: string }> }
) {
  const { shotId } = await params;
  const shot = shotStore.getById(shotId);
  if (!shot) return NextResponse.json({ error: "Shot not found" }, { status: 404 });
  return NextResponse.json(shot);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; shotId: string }> }
) {
  try {
    const { shotId } = await params;
    const body = await request.json();
    const updated = shotStore.update(shotId, body);
    if (!updated) return NextResponse.json({ error: "Shot not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update shot" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; shotId: string }> }
) {
  const { shotId } = await params;
  shotStore.delete(shotId);
  return NextResponse.json({ success: true });
}
