/**
 * GET    /api/projects/[id]/assets/[assetId]  - Get a single asset
 * PATCH  /api/projects/[id]/assets/[assetId]  - Update asset metadata
 * DELETE /api/projects/[id]/assets/[assetId]  - Delete asset and its file
 */

import { NextResponse } from "next/server";
import { assetStore } from "@/lib/data-store";

interface RouteParams {
  params: Promise<{ id: string; assetId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { assetId } = await params;
    const asset = assetStore.getById(assetId);
    if (!asset) {
      return NextResponse.json({ error: "素材不存在" }, { status: 404 });
    }
    return NextResponse.json({ asset });
  } catch (error) {
    console.error("Error fetching asset:", error);
    return NextResponse.json({ error: "获取素材失败" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { assetId } = await params;
    const body = await request.json();
    const { name, description, tags, linkedEntityId, linkedEntityType } = body;

    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (tags !== undefined) updates.tags = tags;
    if (linkedEntityId !== undefined) updates.linkedEntityId = linkedEntityId;
    if (linkedEntityType !== undefined) updates.linkedEntityType = linkedEntityType;

    const asset = assetStore.update(assetId, updates);
    if (!asset) {
      return NextResponse.json({ error: "素材不存在" }, { status: 404 });
    }
    return NextResponse.json({ asset });
  } catch (error) {
    console.error("Error updating asset:", error);
    return NextResponse.json({ error: "更新素材失败" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { assetId } = await params;
    const deleted = assetStore.delete(assetId);
    if (!deleted) {
      return NextResponse.json({ error: "素材不存在" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting asset:", error);
    return NextResponse.json({ error: "删除素材失败" }, { status: 500 });
  }
}
