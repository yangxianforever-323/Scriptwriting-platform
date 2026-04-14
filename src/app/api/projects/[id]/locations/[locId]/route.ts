import { NextResponse } from "next/server";
import { locationStore } from "@/lib/data-store";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; locId: string }> }
) {
  try {
    const { locId } = await params;
    const body = await request.json();
    const updated = locationStore.update(locId, body);
    if (!updated) return NextResponse.json({ error: "Location not found" }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update location" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; locId: string }> }
) {
  const { locId } = await params;
  locationStore.delete(locId);
  return NextResponse.json({ success: true });
}
