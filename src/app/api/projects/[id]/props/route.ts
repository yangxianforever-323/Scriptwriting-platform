import { NextResponse } from "next/server";
import { propStore } from "@/lib/data-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const props = propStore.getByProjectId(projectId);
  return NextResponse.json(props);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const prop = propStore.create(projectId, body);
    return NextResponse.json(prop, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create prop" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  propStore.deleteByProjectId(projectId);
  return NextResponse.json({ success: true });
}
