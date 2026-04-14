import { NextResponse } from "next/server";
import { locationStore } from "@/lib/data-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const locations = locationStore.getByProjectId(projectId);
  return NextResponse.json(locations);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const location = locationStore.create(projectId, body);
    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create location" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  locationStore.deleteByProjectId(projectId);
  return NextResponse.json({ success: true });
}
