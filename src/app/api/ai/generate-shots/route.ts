import { NextResponse } from "next/server";
import { actDb, storySceneDb, characterDb, locationDb, propDb } from "@/lib/db/story";
import { shotDb, storyboardDb } from "@/lib/db/storyboard";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const storyId = body.storyId;
    const storyboardId = body.storyboardId;
    
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
        const sceneCharacters = characters.filter(function(c) { return scene.characterIds && scene.characterIds.includes(c.id); });
        const loc = locations.find(function(l) { return l.id === scene.locationId; }) || null;
        const sceneProps = props.filter(function(p) { return scene.propIds && scene.propIds.includes(p.id); });

        const shots = generateShotsForScene(scene, sceneCharacters, loc, sceneProps, act, shotsPerScene);

        shots.forEach(function(shotData, index) {
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

function generateShotsForScene(scene, characters, location, sceneProps, act, shotsPerScene) {
  var shots = [];
  var characterNames = characters.map(function(c) { return c.name; }).join(",");
  var locationDesc = location ? (location.name + " - " + location.description) : scene.description;
  var propIds = sceneProps.map(function(p) { return p.id; });

  var sequence = [
    { shotType: "LS", cameraMovement: "static", composition: "rule_of_thirds", lighting: "natural", cameraAngle: "eye_level", depthOfField: "deep", duration: 4 },
    { shotType: "MS", cameraMovement: "push", composition: "rule_of_thirds", lighting: "natural", cameraAngle: "eye_level", depthOfField: "shallow", duration: 6 },
    { shotType: "CU", cameraMovement: "static", composition: "center", lighting: "dramatic", cameraAngle: "eye_level", depthOfField: "shallow", duration: 3 },
  ];

  var shotTitles = [
    scene.title + " - 建立镜头",
    scene.title + " - 角色镜头",
    scene.title + " - 特写镜头",
  ];

  for (var i = 0; i < Math.min(sequence.length, shotsPerScene); i++) {
    var config = sequence[i];
    var shotType = config.shotType || "MS";
    var isEstablishing = shotType === "LS" || shotType === "ELS";
    var isCloseUp = shotType === "CU" || shotType === "ECU";

    var shotCharacterIds = isEstablishing
      ? []
      : isCloseUp && characters.length > 0
        ? [characters[0].id]
        : characters.map(function(c) { return c.id; });

    var shotPropIds = isEstablishing
      ? []
      : isCloseUp && propIds.length > 0
        ? [propIds[0]]
        : propIds;

    var imagePrompt = buildImagePrompt(scene.description, characters, sceneProps, location, isCloseUp);

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
      imagePrompt: imagePrompt,
      videoPrompt: imagePrompt,
      creativeIntent: isEstablishing
        ? ("建立" + (location ? location.name : "场景") + "的环境氛围")
        : isCloseUp && characters.length > 0
          ? ("捕捉" + characters[0].name + "的情感表达")
          : ("展示" + characterNames + "的互动"),
    });
  }

  return shots;
}

function buildImagePrompt(basePrompt, characters, props, location, focusOnCharacter) {
  var parts = [basePrompt];

  if (location) {
    parts.push(location.name);
    if (location.atmosphere) {
      parts.push(location.atmosphere);
    }
  }

  if (characters.length > 0) {
    if (focusOnCharacter && characters[0]) {
      var char = characters[0];
      parts.push(char.name);
      if (char.appearance) parts.push(char.appearance);
    } else {
      characters.forEach(function(char) {
        parts.push(char.name);
        if (char.appearance) parts.push(char.appearance);
      });
    }
  }

  if (props.length > 0) {
    props.forEach(function(prop) {
      parts.push(prop.name);
      if (prop.description) parts.push(prop.description);
    });
  }

  return parts.filter(Boolean).join(", ");
}

function getShotTypeName(shotType) {
  var names = {
    EWS: "极远景", LS: "远景", FS: "全景", MS: "中景", MCU: "中近景", CU: "特写", ECU: "极特写"
  };
  return names[shotType] || "中景";
}

function getCameraMovementName(movement) {
  var names = {
    static: "固定镜头", push: "推进", pull: "拉远", track: "跟随", pan: "摇摄",
    tilt: "俯仰", orbit: "环绕", crane_up: "上摇", crane_down: "下摇"
  };
  return names[movement] || "固定镜头";
}

function getCameraAngleName(angle) {
  var names = {
    eye_level: "平视", high_angle: "俯视", low_angle: "仰视", dutch_angle: "荷兰角"
  };
  return names[angle] || "平视";
}

function getCompositionName(composition) {
  var names = {
    rule_of_thirds: "三分法", center: "居中", symmetry: "对称", leading_lines: "引导线"
  };
  return names[composition] || "三分法";
}

function getLightingName(lighting) {
  var names = {
    natural: "自然光", dramatic: "戏剧光", soft: "柔和光", golden_hour: "黄金时刻"
  };
  return names[lighting] || "自然光";
}

function getDepthOfFieldName(dof) {
  var names = {
    shallow: "浅景深", deep: "深景深", medium: "中等景深"
  };
  return names[dof] || "浅景深";
}
