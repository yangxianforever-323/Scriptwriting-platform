import { NextResponse } from "next/server";
import { shotDb, storyboardDb } from "@/lib/db/storyboard";
import { characterDb, locationDb, propDb } from "@/lib/db/story";
import { auditAllScenes, isAuditorConfigured, AuditorError } from "@/lib/agents/auditor";
import { shotsToSceneDescriptions } from "@/lib/shot-audit-adapter";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!isAuditorConfigured()) {
      return NextResponse.json(
        { error: "AI audit service is not configured. Please set VOLC_API_KEY." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { storyboardId, strictMode = false } = body;

    if (!storyboardId || typeof storyboardId !== "string") {
      return NextResponse.json(
        { error: "Storyboard ID is required" },
        { status: 400 }
      );
    }

    const storyboard = storyboardDb.getById(storyboardId);
    if (!storyboard) {
      return NextResponse.json({ error: "Storyboard not found" }, { status: 404 });
    }

    const shots = shotDb.getByStoryboardId(storyboardId);
    if (shots.length === 0) {
      return NextResponse.json(
        { error: "No shots found. Generate storyboard first." },
        { status: 400 }
      );
    }

    const projectId = storyboard.projectId;
    const characters = characterDb.getByProjectId(projectId);
    const locations = locationDb.getByProjectId(projectId);
    const props = propDb.getByProjectId(projectId);

    const scenes = shotsToSceneDescriptions(shots, characters, locations, props);

    const auditCharacters = characters.map(c => ({
      name: c.name,
      role: c.role,
      location: locations.find(l => l.id === shots.find(s => s.characterIds?.includes(c.id))?.locationId)?.name,
      emotion: undefined,
      status: undefined,
    }));

    const auditLocations = locations.map(l => ({
      name: l.name,
      visited: shots.some(s => s.locationId === l.id),
    }));

    const report = await auditAllScenes(scenes, {
      strictMode,
      characters: auditCharacters,
      locations: auditLocations,
    });

    return NextResponse.json({
      success: true,
      report,
      message: `Audit complete: ${report.passedScenes}/${report.totalScenes} passed, ${report.errorScenes} errors, ${report.warningScenes} warnings`,
    });
  } catch (error) {
    console.error("Error auditing storyboard:", error);

    if (error instanceof AuditorError) {
      return NextResponse.json(
        { error: `Audit service error: ${error.message}` },
        { status: error.statusCode || 502 }
      );
    }

    return NextResponse.json(
      { error: "Failed to audit storyboard" },
      { status: 500 }
    );
  }
}
