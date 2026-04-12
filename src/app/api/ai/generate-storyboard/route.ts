/**
 * POST /api/ai/generate-storyboard
 * Auto-generate storyboard shots from story scenes
 * Uses ShotLanguageEngine for intelligent shot configuration
 */

import { NextResponse } from "next/server";
import { actDb, storySceneDb, characterDb, locationDb, propDb } from "@/lib/db/story";
import { shotDb, storyboardDb } from "@/lib/db/storyboard";
import { ShotLanguageEngine } from "@/lib/shot-language";
import {
  SHOT_TYPES,
  CAMERA_MOVEMENTS,
  CAMERA_ANGLES,
  COMPOSITIONS,
  LIGHTING_TYPES,
  DEPTH_OF_FIELD,
} from "@/lib/shot-language";
import type { StoryScene, Character, Location, Prop, Act } from "@/types/story";
import type { Shot } from "@/types/storyboard";

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

    const storyboard = storyboardDb.getById(storyboardId);
    if (!storyboard) {
      return NextResponse.json({ error: "Storyboard not found" }, { status: 404 });
    }

    const projectId = storyboard.projectId;
    const acts = actDb.getByStoryId(storyId);
    const characters = characterDb.getByProjectId(projectId);
    const locations = locationDb.getByProjectId(projectId);
    const props = propDb.getByProjectId(projectId);

    if (acts.length === 0) {
      return NextResponse.json({ error: "No acts found for this story" }, { status: 400 });
    }

    const shotsPerScene = options.shotsPerScene || 3;
    const generatedShots: Shot[] = [];

    for (const act of acts) {
      const scenes = storySceneDb.getByActId(act.id);

      for (const scene of scenes) {
        const sceneCharacters = characters.filter(c => scene.characterIds?.includes(c.id));
        const location = locations.find(l => l.id === scene.locationId) || null;
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

        shots.forEach((shotData, index) => {
          const createdShot = shotDb.create(storyboardId, {
            ...shotData,
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
  scene: StoryScene,
  characters: Character[],
  location: Location | null,
  sceneProps: Prop[],
  act: Act,
  shotsPerScene: number,
  style?: string,
  options?: { includeDialogue?: boolean }
): Partial<Shot>[] {
  const shots: Partial<Shot>[] = [];
  const characterNames = characters.map(c => c.name).join("、");
  const locationDesc = location ? `${location.name} - ${location.description}` : scene.description;
  const propIds = sceneProps.map(p => p.id);

  const sceneDescription = buildSceneDescription(scene, characters, location, sceneProps);

  const sequence = ShotLanguageEngine.generateSequenceFromDescription(
    sceneDescription,
    shotsPerScene,
    style
  );

  const shotTitles = generateShotTitles(scene.title, shotsPerScene, characters);

  for (let i = 0; i < sequence.length; i++) {
    const { config, prompts } = sequence[i];

    const shotType = config.shotType || "MS";
    const cameraMovement = config.cameraMovement || "static";
    const cameraAngle = config.cameraAngle || "eye_level";
    const composition = config.composition || "rule_of_thirds";
    const lighting = config.lighting || "natural";
    const depthOfField = config.depthOfField || "shallow";

    const shotDef = SHOT_TYPES[shotType];
    const movementDef = CAMERA_MOVEMENTS[cameraMovement];
    const angleDef = CAMERA_ANGLES[cameraAngle];
    const compDef = COMPOSITIONS[composition];
    const lightDef = LIGHTING_TYPES[lighting];
    const dofDef = DEPTH_OF_FIELD[depthOfField];

    const isEstablishing = shotType === "LS" || shotType === "ELS";
    const isCloseUp = shotType === "CU" || shotType === "ECU";

    const shotCharacterIds = isEstablishing
      ? []
      : isCloseUp && characters.length > 0
        ? [characters[0].id]
        : characters.map(c => c.id);

    const shotPropIds = isEstablishing
      ? []
      : isCloseUp && propIds.length > 0
        ? [propIds[0]]
        : propIds;

    const enrichedImagePrompt = enrichImagePrompt(
      prompts.imagePrompt,
      characters,
      sceneProps,
      location,
      isCloseUp
    );

    shots.push({
      title: shotTitles[i] || `${scene.title} - 镜头${i + 1}`,
      description: isEstablishing
        ? `建立场景：${locationDesc}`
        : isCloseUp && characters.length > 0
          ? `${characters[0].name}表情特写`
          : `${characterNames}在场景中`,
      duration: config.duration || (shotDef?.typicalDuration || 6),
      shotType,
      shotTypeName: shotDef?.name || "中景",
      cameraMovement,
      cameraMovementName: movementDef?.name || "固定镜头",
      cameraAngle,
      cameraAngleName: angleDef?.name || "平视",
      composition,
      compositionName: compDef?.name || "三分法",
      lightingType: lighting,
      lightingName: lightDef?.name || "自然光",
      depthOfField,
      depthOfFieldName: dofDef?.name || "浅景深",
      characterIds: shotCharacterIds,
      locationId: location?.id || scene.locationId,
      propIds: shotPropIds,
      imagePrompt: enrichedImagePrompt,
      videoPrompt: prompts.videoPrompt,
      dialogue: options?.includeDialogue && !isEstablishing ? scene.dialogue : undefined,
      creativeIntent: isEstablishing
        ? `建立${location?.name || "场景"}的环境氛围`
        : isCloseUp && characters.length > 0
          ? `捕捉${characters[0].name}的情感表达`
          : `展示${characterNames}的互动`,
    });
  }

  return shots;
}

function buildSceneDescription(
  scene: StoryScene,
  characters: Character[],
  location: Location | null,
  props: Prop[]
): string {
  const parts: string[] = [];

  if (location) {
    parts.push(`地点：${location.name}`);
    if (location.atmosphere) {
      parts.push(`氛围：${location.atmosphere}`);
    }
  }

  if (characters.length > 0) {
    parts.push(`角色：${characters.map(c => `${c.name}(${c.appearance || c.role})`).join("、")}`);
  }

  if (props.length > 0) {
    parts.push(`道具：${props.map(p => p.name).join("、")}`);
  }

  if (scene.mood) {
    parts.push(`情绪：${scene.mood}`);
  }

  if (scene.timeOfDay) {
    parts.push(`时间：${scene.timeOfDay}`);
  }

  if (scene.weather) {
    parts.push(`天气：${scene.weather}`);
  }

  parts.push(scene.description);

  return parts.join("。");
}

function generateShotTitles(
  sceneTitle: string,
  shotCount: number,
  characters: Character[]
): string[] {
  const titles: string[] = [];

  if (shotCount >= 1) {
    titles.push(`${sceneTitle} - 建立镜头`);
  }

  if (shotCount >= 2 && characters.length > 0) {
    titles.push(`${sceneTitle} - 角色镜头`);
  }

  if (shotCount >= 3 && characters.length > 0) {
    titles.push(`${sceneTitle} - 特写镜头`);
  }

  if (shotCount >= 4) {
    titles.push(`${sceneTitle} - 动作镜头`);
  }

  if (shotCount >= 5) {
    titles.push(`${sceneTitle} - 反应镜头`);
  }

  for (let i = titles.length; i < shotCount; i++) {
    titles.push(`${sceneTitle} - 镜头${i + 1}`);
  }

  return titles;
}

function enrichImagePrompt(
  basePrompt: string,
  characters: Character[],
  props: Prop[],
  location: Location | null,
  focusOnCharacter: boolean
): string {
  const parts: string[] = [basePrompt];

  if (location) {
    parts.push(location.name);
    if (location.atmosphere) {
      parts.push(location.atmosphere);
    }
    if (location.keyFeatures && location.keyFeatures.length > 0) {
      parts.push(location.keyFeatures.join(", "));
    }
  }

  if (characters.length > 0) {
    if (focusOnCharacter && characters[0]) {
      const char = characters[0];
      parts.push(char.name);
      if (char.appearance) parts.push(char.appearance);
    } else {
      characters.forEach(char => {
        parts.push(char.name);
        if (char.appearance) parts.push(char.appearance);
      });
    }
  }

  if (props.length > 0) {
    props.forEach(prop => {
      parts.push(prop.name);
      if (prop.description) parts.push(prop.description);
    });
  }

  return parts.filter(Boolean).join(", ");
}
