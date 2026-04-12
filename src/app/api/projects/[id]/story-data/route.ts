/**
 * Story Data API
 * POST /api/projects/[id]/story-data - Save story data (characters, acts, locations)
 * GET /api/projects/[id]/story-data - Load story data
 */

import { NextResponse } from "next/server";
import {
  dataStore,
  characterStore,
  locationStore,
  actStore,
  storyStore,
  projectStore,
} from "@/lib/data-store";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const fullData = dataStore.getProjectFullData(projectId);
    if (!fullData) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(fullData);
  } catch (error) {
    console.error("Error loading story data:", error);
    return NextResponse.json(
      { error: "Failed to load story data" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();

    // Save characters if provided
    if (body.characters && Array.isArray(body.characters)) {
      // Delete existing characters and recreate
      characterStore.deleteByProjectId(projectId);
      characterStore.createBatch(projectId, body.characters);
    }

    // Save locations if provided
    if (body.locations && Array.isArray(body.locations)) {
      locationStore.deleteByProjectId(projectId);
      locationStore.createBatch(projectId, body.locations);
    }

    // Save acts if provided (from novel analysis)
    if (body.acts && Array.isArray(body.acts)) {
      let story = storyStore.getByProjectId(projectId);
      if (!story) {
        story = storyStore.create(projectId, {
          title: body.title || "",
          logline: body.logline || "",
          synopsis: body.synopsis || "",
          genre: body.genre || "",
          targetDuration: body.targetDuration || 60,
        });
      } else {
        storyStore.update(story.id, {
          logline: body.logline || story.logline,
          synopsis: body.synopsis || story.synopsis,
          genre: body.genre || story.genre,
          targetDuration: body.targetDuration || story.targetDuration,
        });
      }

      // Delete existing acts and recreate
      actStore.deleteByStoryId(story.id);
      body.acts.forEach((act: any, index: number) => {
        actStore.create(story.id, {
          index,
          title: act.title,
          description: act.description,
        });

        // Create scenes within each act if provided
        if (act.scenes && Array.isArray(act.scenes)) {
          const createdActs = actStore.getByStoryId(story.id);
          const createdAct = createdActs[index];
          if (createdAct) {
            act.scenes.forEach((scene: any, sceneIndex: number) => {
              // This would use storySceneStore for story-level scenes
              // For now, we just log the structure
              console.log(`Creating scene ${sceneIndex} in act ${index}`);
            });
          }
        }
      });
    }

    // Update project stage progress
    if (body.stage) {
      projectStore.updateStageProgress(
        projectId,
        body.stage,
        body.status || "completed",
        body.data
      );
    }

    // Return updated data
    const fullData = dataStore.getProjectFullData(projectId);

    return NextResponse.json({
      success: true,
      message: "Story data saved successfully",
      data: fullData,
    });
  } catch (error) {
    console.error("Error saving story data:", error);
    return NextResponse.json(
      { error: "Failed to save story data" },
      { status: 500 }
    );
  }
}
