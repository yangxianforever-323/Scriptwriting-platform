import { NextResponse } from "next/server";
import { propStore } from "@/lib/data-store";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; propId: string }> }
) {
  try {
    const { propId } = await params;
    const body = await request.json();
    const updated = propStore.update(propId, body);
    if (!updated) return NextResponse.json({ error: "Prop not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update prop" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; propId: string }> }
) {
  const { propId } = await params;
  propStore.delete(propId);
  return NextResponse.json({ success: true });
}
