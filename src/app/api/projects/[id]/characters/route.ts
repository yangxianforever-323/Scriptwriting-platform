import { NextResponse } from "next/server";
import { characterStore } from "@/lib/data-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const characters = characterStore.getByProjectId(projectId);
  return NextResponse.json(characters);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();
    const character = characterStore.create(projectId, body);
    return NextResponse.json(character, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create character" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  characterStore.deleteByProjectId(projectId);
  return NextResponse.json({ success: true });
}
