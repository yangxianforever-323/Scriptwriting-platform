import { NextResponse } from "next/server";
import { actDb, storySceneDb, characterDb, locationDb, propDb } from "@/lib/db/story";
import { shotDb, storyboardDb } from "@/lib/db/storyboard";

interface SceneData {
  id: string;
  title: string;
  description: string;
  characterIds?: string[];
  locationId?: string;
  propIds?: string[];
  timeOfDay?: string;
  weather?: string;
  mood?: string;
  notes?: string;
}

interface CharacterData {
  id: string;
  name: string;
  appearance?: string;
  age?: string;
  gender?: string;
  personality?: string;
  motivation?: string;
}

interface LocationData {
  id: string;
  name: string;
  description: string;
  atmosphere?: string;
  keyFeatures?: string[];
}

interface PropData {
  id: string;
  name: string;
  description?: string;
}

interface ActData {
  id: string;
  title: string;
}

interface ShotConfig {
  shotType: string;
  cameraMovement: string;
  composition: string;
  lighting: string;
  cameraAngle: string;
  depthOfField: string;
  duration: number;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const storyId = body.storyId as string;
    const storyboardId = body.storyboardId as string;

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

    const shotsPerScene = 3;
    const generatedShots: any[] = [];

    for (const act of acts) {
      const scenes = storySceneDb.getByActId(act.id);

      for (const scene of scenes) {
        const sceneCharacters = characters.filter(function(c: CharacterData): boolean {
          return scene.characterIds && scene.characterIds.includes(c.id);
        });
        const loc = locations.find(function(l: LocationData): boolean {
          return l.id === scene.locationId;
        }) || null;
        const sceneProps = props.filter(function(p: PropData): boolean {
          return scene.propIds && scene.propIds.includes(p.id);
        });

        const shots = generateShotsForScene(
          scene as SceneData,
          sceneCharacters as CharacterData[],
          loc as LocationData | null,
          sceneProps as PropData[],
          act,
          shotsPerScene
        );

        shots.forEach(function(shotData: any, index: number) {
          const createdShot = shotDb.create(storyboardId, Object.assign({}, shotData, {
            index: generatedShots.length + index,
            storySceneId: scene.id,
            actId: act.id,
          }));
          generatedShots.push(createdShot);
        });
      }
    }

    storyboardDb.update(storyboardId, { shotCount: generatedShots.length });

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
  scene: SceneData,
  characters: CharacterData[],
  location: LocationData | null,
  sceneProps: PropData[],
  act: ActData,
  shotsPerScene: number
): Record<string, unknown>[] {
  const shots: Record<string, unknown>[] = [];
  const characterNames = characters.map(function(c: CharacterData): string { return c.name; }).join(",");
  const locationDesc = location ? (location.name + " - " + location.description) : scene.description;
  const propIds = sceneProps.map(function(p: PropData): string { return p.id; });

  const sequence: ShotConfig[] = [
    { shotType: "LS", cameraMovement: "static", composition: "rule_of_thirds", lighting: "natural", cameraAngle: "eye_level", depthOfField: "deep", duration: 4 },
    { shotType: "MS", cameraMovement: "push", composition: "rule_of_thirds", lighting: "natural", cameraAngle: "eye_level", depthOfField: "shallow", duration: 6 },
    { shotType: "CU", cameraMovement: "static", composition: "center", lighting: "dramatic", cameraAngle: "eye_level", depthOfField: "shallow", duration: 3 },
  ];

  const shotTitles = [
    scene.title + " - 建立镜头",
    scene.title + " - 角色镜头",
    scene.title + " - 特写镜头",
  ];

  for (let i = 0; i < Math.min(sequence.length, shotsPerScene); i++) {
    const config = sequence[i];
    const shotType = config.shotType || "MS";
    const isEstablishing = shotType === "LS" || shotType === "ELS";
    const isCloseUp = shotType === "CU" || shotType === "ECU";

    const shotCharacterIds: string[] = isEstablishing
      ? []
      : isCloseUp && characters.length > 0
        ? [characters[0].id]
        : characters.map(function(c: CharacterData): string { return c.id; });

    const shotPropIds: string[] = isEstablishing
      ? []
      : isCloseUp && propIds.length > 0
        ? [propIds[0]]
        : propIds;

    const imagePrompt = buildImagePrompt(scene, characters, sceneProps, location, isCloseUp);
    const videoPrompt = buildVideoPrompt(scene, characters, location, config, isCloseUp);

    shots.push({
      title: shotTitles[i] || (scene.title + " - 镜头" + (i + 1)),
      description: isEstablishing
        ? ("建立场景：" + locationDesc)
        : isCloseUp && characters.length > 0
          ? (characters[0].name + "表情特写")
          : (characterNames + "在场景中"),
      duration: config.duration || 6,
      shotType: shotType,
      shotTypeName: getShotTypeName(shotType),
      cameraMovement: config.cameraMovement || "static",
      cameraMovementName: getCameraMovementName(config.cameraMovement || "static"),
      cameraAngle: config.cameraAngle || "eye_level",
      cameraAngleName: getCameraAngleName(config.cameraAngle || "eye_level"),
      composition: config.composition || "rule_of_thirds",
      compositionName: getCompositionName(config.composition || "rule_of_thirds"),
      lightingType: config.lighting || "natural",
      lightingName: getLightingName(config.lighting || "natural"),
      depthOfField: config.depthOfField || "shallow",
      depthOfFieldName: getDepthOfFieldName(config.depthOfField || "shallow"),
      characterIds: shotCharacterIds,
      locationId: location ? location.id : scene.locationId,
      propIds: shotPropIds,
      // Pass scene metadata so prompt-generation.ts can use timeOfDay/mood
      timeOfDay: scene.timeOfDay || "",
      weather: scene.weather || "",
      mood: scene.mood || "",
      imagePrompt: imagePrompt,
      videoPrompt: videoPrompt,
      creativeIntent: isEstablishing
        ? ("建立" + (location ? location.name : "场景") + "的环境氛围")
        : isCloseUp && characters.length > 0
          ? ("捕捉" + characters[0].name + "的情感表达")
          : ("展示" + characterNames + "的互动"),
    });
  }

  return shots;
}

function buildImagePrompt(
  scene: SceneData,
  characters: CharacterData[],
  props: PropData[],
  location: LocationData | null,
  focusOnCharacter: boolean
): string {
  const parts: string[] = [];

  // Cinematic preamble for safety filter compliance
  parts.push("cinematic film still, professional cinematography");

  // Location context
  if (location) {
    const locParts = [location.name];
    if (location.atmosphere) locParts.push(location.atmosphere);
    if (location.keyFeatures && location.keyFeatures.length > 0) {
      locParts.push(...location.keyFeatures.slice(0, 2));
    }
    parts.push(locParts.join(", "));
  }

  // Time of day and mood from scene
  if (scene.timeOfDay) parts.push(scene.timeOfDay);
  if (scene.mood) parts.push(scene.mood);

  // Characters with full appearance data
  if (characters.length > 0) {
    if (focusOnCharacter && characters[0]) {
      const char = characters[0];
      const charParts = [char.name];
      if (char.appearance) charParts.push(char.appearance);
      if (char.age) charParts.push(char.age);
      if (char.gender) charParts.push(char.gender);
      parts.push(charParts.filter(Boolean).join(", "));
    } else {
      characters.forEach(function(char: CharacterData): void {
        const charParts = [char.name];
        if (char.appearance) charParts.push(char.appearance);
        parts.push(charParts.filter(Boolean).join(", "));
      });
    }
  }

  // Scene description as narrative context
  if (scene.description) parts.push(scene.description);

  // Key notes (contains visualStyle, cameraNote, keyAction from apply-analysis)
  if (scene.notes) {
    // Only take the first note segment (keyAction) to keep prompt focused
    const firstNote = scene.notes.split(" | ")[0];
    if (firstNote) parts.push(firstNote);
  }

  return parts.filter(Boolean).join(". ");
}

function buildVideoPrompt(
  scene: SceneData,
  characters: CharacterData[],
  location: LocationData | null,
  shotConfig: ShotConfig,
  focusOnCharacter: boolean
): string {
  const base = buildImagePrompt(scene, characters, [], location, focusOnCharacter);

  const motionParts: string[] = [base];

  // Camera movement for video
  const movementNames: Record<string, string> = {
    static: "static shot", push: "dolly in", pull: "dolly out",
    track: "tracking shot", pan: "pan", tilt: "tilt",
    orbit: "orbit", crane_up: "crane up", crane_down: "crane down",
  };
  if (shotConfig.cameraMovement && movementNames[shotConfig.cameraMovement]) {
    motionParts.push(movementNames[shotConfig.cameraMovement]);
  }

  return motionParts.filter(Boolean).join(", ");
}

function getShotTypeName(shotType: string): string {
  const names: Record<string, string> = {
    EWS: "极远景", LS: "远景", FS: "全景", MS: "中景", MCU: "中近景", CU: "特写", ECU: "极特写"
  };
  return names[shotType] || "中景";
}

function getCameraMovementName(movement: string): string {
  const names: Record<string, string> = {
    static: "固定镜头", push: "推进", pull: "拉远", track: "跟随", pan: "摇摄",
    tilt: "俯仰", orbit: "环绕", crane_up: "上摇", crane_down: "下摇"
  };
  return names[movement] || "固定镜头";
}

function getCameraAngleName(angle: string): string {
  const names: Record<string, string> = {
    eye_level: "平视", high_angle: "俯视", low_angle: "仰视", dutch_angle: "荷兰角"
  };
  return names[angle] || "平视";
}

function getCompositionName(composition: string): string {
  const names: Record<string, string> = {
    rule_of_thirds: "三分法", center: "居中", symmetry: "对称", leading_lines: "引导线"
  };
  return names[composition] || "三分法";
}

function getLightingName(lighting: string): string {
  const names: Record<string, string> = {
    natural: "自然光", dramatic: "戏剧光", soft: "柔和光", golden_hour: "黄金时刻"
  };
  return names[lighting] || "自然光";
}

function getDepthOfFieldName(dof: string): string {
  const names: Record<string, string> = {
    shallow: "浅景深", deep: "深景深", medium: "中等景深"
  };
  return names[dof] || "浅景深";
}
