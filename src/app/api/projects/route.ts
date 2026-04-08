/**
 * Projects API routes.
 * GET /api/projects - Get projects
 * POST /api/projects - Create a new project
 */

import { NextResponse } from "next/server";
import { getProjects, createProject } from "@/lib/db/projects";

/**
 * GET /api/projects - Get projects with pagination
 * Query params: page (default 1), limit (default 20)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const { projects, total } = await getProjects(null, { page, limit });

    return NextResponse.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects - Create a new project
 * Body: { name: string, type?: "novel" | "script" | "idea", story?: string, style?: string, shotCount?: 9 | 16 | 25 }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, story, style, shotCount } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "项目名称不能为空" },
        { status: 400 }
      );
    }

    const validShotCounts = [9, 16, 25];
    const finalShotCount = validShotCounts.includes(shotCount) ? shotCount : 9;

    const project = await createProject(null, name.trim(), story, style, finalShotCount);

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "创建项目失败" },
      { status: 500 }
    );
  }
}
