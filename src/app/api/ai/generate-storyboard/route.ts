/**
 * POST /api/ai/generate-storyboard
 * Auto-generate storyboard shots from story scenes
 */

import { NextResponse } from "next/server";
import { actDb, storySceneDb, characterDb, locationDb, propDb } from "@/lib/db/story";
import { shotDb, storyboardDb } from "@/lib/db/storyboard";

interface GenerateRequest {
  storyId: string;
  storyboardId: string;
  style?: string;
  options?: {
    shotsPerScene?: number;
    includeDialogue?: boolean;
    includeCameraMovement?: boolean;
  };
}

export async function POST(request: Request) {
  try {
    const { storyId, storyboardId, style, options = {} }: GenerateRequest = await request.json();

    const acts = actDb.getByStoryId(storyId);
    const characters = characterDb.getByProjectId(storyboardDb.getById(storyboardId)?.projectId || "");
    const locations = locationDb.getByProjectId(storyboardDb.getById(storyboardId)?.projectId || "");
    const props = propDb.getByProjectId(storyboardDb.getById(storyboardId)?.projectId || "");

    if (acts.length === 0) {
      return NextResponse.json({ error: "No acts found for this story" }, { status: 400 });
    }

    const shotsPerScene = options.shotsPerScene || 2;
    const generatedShots: any[] = [];

    for (const act of acts) {
      const scenes = storySceneDb.getByActId(act.id);
      
      for (const scene of scenes) {
        const sceneCharacters = characters.filter(c => scene.characterIds?.includes(c.id));
        const location = locations.find(l => l.id === scene.locationId);
        const sceneProps = props.filter(p => scene.propIds?.includes(p.id));
        
        const shots = generateShotsForScene(
          scene,
          sceneCharacters,
          location,
          sceneProps,
          act,
          shotsPerScene,
          style,
          options
        );
        
        shots.forEach((shot, index) => {
          const createdShot = shotDb.create(storyboardId, {
            ...shot,
            index: generatedShots.length + index,
            storySceneId: scene.id,
            actId: act.id,
          });
          generatedShots.push(createdShot);
        });
      }
    }

    storyboardDb.update(storyboardId, {
      shotCount: generatedShots.length,
    });

    return NextResponse.json({
      success: true,
      shotsGenerated: generatedShots.length,
      shots: generatedShots,
    });
  } catch (error) {
    console.error("Error generating storyboard:", error);
    return NextResponse.json({ error: "Failed to generate storyboard" }, { status: 500 });
  }
}

function generateShotsForScene(
  scene: any,
  characters: any[],
  location: any,
  sceneProps: any[],
  act: any,
  shotsPerScene: number,
  style?: string,
  options?: any
): Partial<any>[] {
  const shots: Partial<any>[] = [];
  const characterNames = characters.map(c => c.name).join("、");
  const locationDesc = location ? `${location.name} - ${location.description}` : scene.description;
  const propNames = sceneProps.map(p => p.name).join("、");
  const propIds = sceneProps.map(p => p.id);

  if (shotsPerScene >= 1) {
    shots.push({
      title: `${scene.title} - 建立镜头`,
      description: `建立场景：${locationDesc}`,
      duration: 4,
      shotType: "LS",
      shotTypeName: "远景",
      cameraMovement: "static",
      cameraMovementName: "固定镜头",
      cameraAngle: "eye_level",
      cameraAngleName: "平视",
      characterIds: [],
      propIds: [],
      imagePrompt: generateImagePrompt({
        scene: scene.description,
        location,
        characters: [],
        props: [],
        shotType: "远景",
        style,
        mood: scene.mood,
        timeOfDay: scene.timeOfDay,
      }),
      creativeIntent: `建立${location?.name || "场景"}的环境氛围`,
    });
  }

  if (shotsPerScene >= 2 && characters.length > 0) {
    shots.push({
      title: `${scene.title} - 角色镜头`,
      description: `${characterNames}在场景中`,
      duration: 6,
      shotType: "MS",
      shotTypeName: "中景",
      cameraMovement: "slow_push",
      cameraMovementName: "缓慢推进",
      cameraAngle: "eye_level",
      cameraAngleName: "平视",
      characterIds: characters.map(c => c.id),
      propIds: propIds,
      imagePrompt: generateImagePrompt({
        scene: scene.description,
        location,
        characters,
        props: sceneProps,
        shotType: "中景",
        style,
        mood: scene.mood,
        timeOfDay: scene.timeOfDay,
      }),
      dialogue: options?.includeDialogue ? scene.dialogue : undefined,
      creativeIntent: `展示${characterNames}的互动`,
    });
  }

  if (shotsPerScene >= 3 && characters.length > 0) {
    shots.push({
      title: `${scene.title} - 特写镜头`,
      description: `角色表情特写`,
      duration: 3,
      shotType: "CU",
      shotTypeName: "特写",
      cameraMovement: "static",
      cameraMovementName: "固定镜头",
      cameraAngle: "eye_level",
      cameraAngleName: "平视",
      characterIds: [characters[0]?.id],
      propIds: propIds.length > 0 ? [propIds[0]] : [],
      imagePrompt: generateImagePrompt({
        scene: scene.description,
        location,
        characters: [characters[0]],
        props: sceneProps.length > 0 ? [sceneProps[0]] : [],
        shotType: "特写",
        style,
        mood: scene.mood,
        focusOnCharacter: true,
      }),
      creativeIntent: `捕捉${characters[0]?.name}的情感表达`,
    });
  }

  return shots;
}

function generateImagePrompt(params: {
  scene: string;
  location?: any;
  characters: any[];
  props?: any[];
  shotType: string;
  style?: string;
  mood?: string;
  timeOfDay?: string;
  focusOnCharacter?: boolean;
}): string {
  const parts: string[] = [];

  if (params.style) {
    parts.push(params.style);
  }

  parts.push(params.shotType);

  if (params.location) {
    parts.push(params.location.name);
    if (params.location.atmosphere) {
      parts.push(params.location.atmosphere);
    }
  }

  if (params.characters.length > 0) {
    if (params.focusOnCharacter && params.characters[0]) {
      const char = params.characters[0];
      parts.push(char.name);
      if (char.appearance) {
        parts.push(char.appearance);
      }
    } else {
      params.characters.forEach(char => {
        parts.push(char.name);
        if (char.appearance) {
          parts.push(char.appearance);
        }
      });
    }
  }

  if (params.props && params.props.length > 0) {
    params.props.forEach(prop => {
      parts.push(prop.name);
      if (prop.description) {
        parts.push(prop.description);
      }
    });
  }

  if (params.timeOfDay) {
    parts.push(params.timeOfDay);
  }

  if (params.mood) {
    parts.push(params.mood);
  }

  parts.push(params.scene);

  return parts.filter(Boolean).join(", ");
}
