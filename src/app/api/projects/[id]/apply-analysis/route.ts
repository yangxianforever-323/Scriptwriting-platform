/**
 * POST /api/projects/[id]/apply-analysis
 * Applies the novel analysis to story - creates characters, locations, acts, scenes, props
 */

import { NextResponse } from "next/server";
import { storyDb, actDb, storySceneDb, characterDb, locationDb, propDb } from "@/lib/db/story";

interface AnalysisCharacter {
  name: string;
  description: string;
  role: string;
  appearance: string;
  personality?: string;
  background?: string;
}

interface AnalysisLocation {
  name: string;
  description: string;
  atmosphere?: string;
}

interface AnalysisScene {
  title: string;
  description: string;
  location: string;
  characters: string[];
  timeOfDay?: string;
  mood?: string;
}

interface AnalysisAct {
  title: string;
  description: string;
  scenes: AnalysisScene[];
}

interface AnalysisProp {
  name: string;
  description: string;
  importance?: string;
}

interface AnalysisResult {
  title: string;
  logline: string;
  synopsis: string;
  genre: string;
  targetDuration: number;
  characters: AnalysisCharacter[];
  locations: AnalysisLocation[];
  acts: AnalysisAct[];
  props?: AnalysisProp[];
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const analysis: AnalysisResult = await request.json();

  let story = storyDb.getByProjectId(projectId);
  if (!story) {
    story = storyDb.create(projectId, {
      title: analysis.title || "",
      logline: analysis.logline || "",
      synopsis: analysis.synopsis || "",
      genre: analysis.genre || "",
      targetDuration: analysis.targetDuration || 60,
    });
  }

  const createdCharacters: { id: string; name: string }[] = [];
  const createdLocations: { id: string; name: string }[] = [];
  const createdActs: { id: string; title: string }[] = [];
  const createdProps: { id: string; name: string }[] = [];

  try {
    for (const char of analysis.characters || []) {
      const newChar = characterDb.create(projectId, {
        name: char.name,
        description: char.description,
        appearance: char.appearance || "",
        personality: char.personality || "",
        background: char.background || "",
        role: mapCharacterRole(char.role),
      });
      createdCharacters.push({ id: newChar.id, name: newChar.name });
    }

    for (const loc of analysis.locations || []) {
      const newLoc = locationDb.create(projectId, {
        name: loc.name,
        description: loc.description,
        atmosphere: loc.atmosphere || "",
      });
      createdLocations.push({ id: newLoc.id, name: newLoc.name });
    }

    if (analysis.props && analysis.props.length > 0) {
      for (const prop of analysis.props) {
        const newProp = propDb.create(projectId, {
          name: prop.name,
          description: prop.description,
          importance: mapPropImportance(prop.importance),
        });
        createdProps.push({ id: newProp.id, name: newProp.name });
      }
    }

    for (const actData of analysis.acts || []) {
      const newAct = actDb.create(story.id, {
        title: actData.title,
        description: actData.description,
      });
      createdActs.push({ id: newAct.id, title: newAct.title });

      for (const sceneData of actData.scenes || []) {
        const location = createdLocations.find(
          (l) => l.name === sceneData.location
        );

        const characterIds = createdCharacters
          .filter((c) => sceneData.characters?.includes(c.name))
          .map((c) => c.id);

        storySceneDb.create(newAct.id, {
          title: sceneData.title,
          description: sceneData.description,
          locationId: location?.id,
          characterIds: characterIds,
          timeOfDay: sceneData.timeOfDay || "",
          mood: sceneData.mood || "",
        });
      }
    }

    storyDb.update(story.id, {
      title: analysis.title || story.title,
      logline: analysis.logline || story.logline,
      synopsis: analysis.synopsis || story.synopsis,
      genre: analysis.genre || story.genre,
      targetDuration: analysis.targetDuration || story.targetDuration,
    });

    return NextResponse.json({
      success: true,
      storyId: story.id,
      charactersCreated: createdCharacters.length,
      locationsCreated: createdLocations.length,
      actsCreated: createdActs.length,
      propsCreated: createdProps.length,
    });
  } catch (error) {
    console.error("Error applying analysis:", error);
    return NextResponse.json(
      { error: "Failed to apply analysis" },
      { status: 500 }
    );
  }
}

function mapCharacterRole(role: string): "protagonist" | "antagonist" | "supporting" | "minor" {
  const roleMap: Record<string, "protagonist" | "antagonist" | "supporting" | "minor"> = {
    protagonist: "protagonist",
    main: "protagonist",
    主角: "protagonist",
    antagonist: "antagonist",
    villain: "antagonist",
    反派: "antagonist",
    supporting: "supporting",
    配角: "supporting",
    minor: "minor",
    次要: "minor",
  };
  return roleMap[role.toLowerCase()] || "supporting";
}

function mapPropImportance(importance?: string): "key" | "supporting" | "background" {
  const importanceMap: Record<string, "key" | "supporting" | "background"> = {
    key: "key",
    关键: "key",
    重要: "key",
    supporting: "supporting",
    辅助: "supporting",
    background: "background",
    背景: "background",
  };
  return importanceMap[importance?.toLowerCase() || ""] || "supporting";
}
