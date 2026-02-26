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
 * Body: { title: string, story?: string, style?: string, shotCount?: 9 | 16 | 25 }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, story, style, shotCount } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const validShotCounts = [9, 16, 25];
    const finalShotCount = validShotCounts.includes(shotCount) ? shotCount : 9;

    const project = await createProject(null, title.trim(), story, style, finalShotCount);

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
