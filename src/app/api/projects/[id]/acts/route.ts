import { NextResponse } from "next/server";
import { storyStore, actStore, storySceneStore } from "@/lib/data-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const story = storyStore.getByProjectId(projectId);
  if (!story) return NextResponse.json([]);

  const acts = actStore.getByStoryId(story.id);
  const actsWithScenes = acts.map((act) => ({
    ...act,
    scenes: storySceneStore.getByActId(act.id),
  }));
  return NextResponse.json(actsWithScenes);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();

    const story = storyStore.getByProjectId(projectId);
    if (!story) {
      return NextResponse.json({ error: "Story not found for project" }, { status: 404 });
    }

    // Batch import: { batch: true, acts: [...] }
    if (body.batch && Array.isArray(body.acts)) {
      actStore.deleteByStoryId(story.id);
      const createdActs = body.acts.map((actData: any, index: number) => {
        const newAct = actStore.create(story.id, {
          title: actData.title,
          description: actData.description || "",
          index,
        });
        if (Array.isArray(actData.scenes)) {
          actData.scenes.forEach((sceneData: any, sceneIndex: number) => {
            storySceneStore.create(newAct.id, {
              title: sceneData.title || `场景${sceneIndex + 1}`,
              description: sceneData.description || "",
              locationId: sceneData.location,
              timeOfDay: sceneData.timeOfDay || "",
              mood: sceneData.mood || "",
              index: sceneIndex,
            });
          });
        }
        return { ...newAct, scenes: storySceneStore.getByActId(newAct.id) };
      });
      return NextResponse.json(createdActs, { status: 201 });
    }

    // Single act creation
    const act = actStore.create(story.id, body);
    return NextResponse.json(act, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create act" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const story = storyStore.getByProjectId(projectId);
  if (story) {
    actStore.deleteByStoryId(story.id);
  }
  return NextResponse.json({ success: true });
}
