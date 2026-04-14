import { NextResponse } from "next/server";
import { storyboardStore } from "@/lib/data-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const storyboards = storyboardStore.getByProjectId(projectId);
  return NextResponse.json(storyboards);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const storyboard = storyboardStore.create(projectId, {
      name: body.name,
      description: body.description,
    });
    return NextResponse.json(storyboard, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create storyboard" }, { status: 500 });
  }
}
