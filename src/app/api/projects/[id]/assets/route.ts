/**
 * GET  /api/projects/[id]/assets  - List assets for a project (supports filtering)
 * POST /api/projects/[id]/assets  - Upload a new asset file
 */

import { NextResponse } from "next/server";
import { assetStore } from "@/lib/data-store";
import type { AssetCategory, AssetFilter } from "@/types/asset";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);

    const filter: AssetFilter = {};
    const category = searchParams.get("category") as AssetCategory | null;
    const mediaType = searchParams.get("mediaType");
    const source = searchParams.get("source");
    const linkedEntityId = searchParams.get("linkedEntityId");
    const search = searchParams.get("search");
    const tags = searchParams.get("tags");

    if (category) filter.category = category;
    if (mediaType === "image" || mediaType === "video") filter.mediaType = mediaType;
    if (source === "uploaded" || source === "ai_generated") filter.source = source;
    if (linkedEntityId) filter.linkedEntityId = linkedEntityId;
    if (search) filter.search = search;
    if (tags) filter.tags = tags.split(",").filter(Boolean);

    const assets = assetStore.getByProjectId(projectId, filter);

    // Group by category for convenience
    const grouped: Record<string, typeof assets> = {};
    assets.forEach((a) => {
      if (!grouped[a.category]) grouped[a.category] = [];
      grouped[a.category].push(a);
    });

    return NextResponse.json({ assets, grouped, total: assets.length });
  } catch (error) {
    console.error("Error fetching assets:", error);
    return NextResponse.json({ error: "获取素材失败" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: projectId } = await params;
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const category = formData.get("category") as AssetCategory | null;
    const name = formData.get("name") as string | null;
    const description = formData.get("description") as string || "";
    const tagsRaw = formData.get("tags") as string || "";
    const linkedEntityId = formData.get("linkedEntityId") as string || undefined;
    const linkedEntityType = formData.get("linkedEntityType") as string || undefined;

    if (!file || !category || !name) {
      return NextResponse.json(
        { error: "缺少必要参数：file、category、name" },
        { status: 400 }
      );
    }

    const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const asset = assetStore.saveUploadedFile({
      projectId,
      category,
      name,
      fileBuffer,
      filename: file.name,
      mimeType: file.type,
      description,
      tags,
      linkedEntityId: linkedEntityId || undefined,
      linkedEntityType: linkedEntityType as any || undefined,
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    console.error("Error uploading asset:", error);
    return NextResponse.json({ error: "上传素材失败" }, { status: 500 });
  }
}
