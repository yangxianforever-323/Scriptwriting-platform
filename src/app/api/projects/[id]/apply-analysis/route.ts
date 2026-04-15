/**
 * POST /api/projects/[id]/apply-analysis
 * Applies the novel analysis to story - creates characters, locations, acts, scenes, props
 * Saves ALL fields extracted by the AI analysis for use in storyboard prompt generation.
 */

import { NextResponse } from "next/server";
import {
  storyStore,
  actStore,
  storySceneStore,
  characterStore,
  locationStore,
  propStore,
} from "@/lib/data-store";

interface AnalysisCharacter {
  name: string;
  description: string;
  role: string;
  appearance: string;
  age?: string;
  gender?: string;
  personality?: string;
  background?: string;
  motivation?: string;
  arc?: string;
  thumbnailUrl?: string;
}

interface AnalysisLocation {
  name: string;
  description: string;
  type?: string;
  atmosphere?: string;
  keyFeatures?: string[];
  timeContext?: string;
  thumbnailUrl?: string;
}

interface AnalysisRelationship {
  from: string;
  to: string;
  type: string;
  description: string;
  dynamic?: string;
}

interface AnalysisScene {
  title: string;
  description: string;
  location: string;
  characters: string[];
  props?: string[] | { name: string; type?: string; description?: string; holder?: string }[];
  timeOfDay?: string;
  weather?: string;
  mood?: string;
  visualStyle?: string;
  cameraNote?: string;
  keyAction?: string;
  keyDialogue?: string;
  thumbnailUrl?: string;
  // Legacy fields from review panel edit
  visualEffect?: { style?: string; colorTone?: string; lighting?: string; cameraAngle?: string };
  atmosphereRef?: string;
  notes?: string;
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
  appearance?: string;
  holder?: string;
  storyRole?: string;
}

interface AnalysisResult {
  title: string;
  logline: string;
  synopsis: string;
  genre: string;
  targetDuration: number;
  characters: AnalysisCharacter[];
  relationships?: AnalysisRelationship[];
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

  // 把人物关系序列化为JSON字符串，存入 story.theme 字段（复用现有字段避免schema改动）
  const relationshipsJson = analysis.relationships && analysis.relationships.length > 0
    ? JSON.stringify(analysis.relationships)
    : undefined;

  let story = storyStore.getByProjectId(projectId);
  if (!story) {
    story = storyStore.create(projectId, {
      title: analysis.title || "",
      logline: analysis.logline || "",
      synopsis: analysis.synopsis || "",
      genre: analysis.genre || "",
      targetDuration: analysis.targetDuration || 60,
      ...(relationshipsJson ? { theme: relationshipsJson } : {}),
    });
  } else {
    // Update existing story with fresh analysis data
    storyStore.update(story.id, {
      title: analysis.title || story.title,
      logline: analysis.logline || story.logline,
      synopsis: analysis.synopsis || story.synopsis,
      genre: analysis.genre || story.genre,
      targetDuration: analysis.targetDuration || story.targetDuration,
      ...(relationshipsJson ? { theme: relationshipsJson } : {}),
    });
  }

  const createdCharacters: { id: string; name: string }[] = [];
  const createdLocations: { id: string; name: string }[] = [];
  const createdActs: { id: string; title: string }[] = [];
  const createdProps: { id: string; name: string }[] = [];

  try {
    // ── Characters ──────────────────────────────────────────────
    for (const char of analysis.characters || []) {
      // Build a rich description combining all character fields for prompt generation
      const richDescription = [
        char.description,
        char.motivation ? `动机：${char.motivation}` : "",
        char.arc ? `成长弧线：${char.arc}` : "",
      ].filter(Boolean).join(" | ");

      const newChar = characterStore.create(projectId, {
        name: char.name,
        // appearance is the most important field for image generation
        appearance: char.appearance || char.description || "",
        personality: buildPersonalityText(char),
        background: buildBackgroundText(char),
        role: mapCharacterRole(char.role),
        // Also save as structured fields for direct use in prompt generation
        age: char.age || "",
        gender: char.gender || "",
        motivation: char.motivation || "",
        arc: char.arc || "",
        ...(char.thumbnailUrl ? { referenceImages: [char.thumbnailUrl] } : {}),
      });
      createdCharacters.push({ id: newChar.id, name: newChar.name });
    }

    // ── Locations ──────────────────────────────────────────────
    for (const loc of analysis.locations || []) {
      const newLoc = locationStore.create(projectId, {
        name: loc.name,
        description: loc.description,
        type: mapLocationType(loc.type),
        atmosphere: loc.atmosphere || loc.timeContext || "",
        keyFeatures: loc.keyFeatures || [],
        ...(loc.thumbnailUrl ? { referenceImages: [loc.thumbnailUrl] } : {}),
      });
      createdLocations.push({ id: newLoc.id, name: newLoc.name });
    }

    // ── Props ──────────────────────────────────────────────────
    for (const prop of analysis.props || []) {
      // 构建完整道具描述：包含外观、持有者、故事作用
      const richPropDesc = [
        prop.description,
        prop.appearance ? `外观：${prop.appearance}` : "",
        prop.holder ? `持有者：${prop.holder}` : "",
        prop.storyRole ? `故事作用：${prop.storyRole}` : "",
      ].filter(Boolean).join(" | ");

      const newProp = propStore.create(projectId, {
        name: prop.name,
        description: richPropDesc,
        importance: mapPropImportance(prop.importance),
      });
      createdProps.push({ id: newProp.id, name: newProp.name });
    }

    // ── Acts & Scenes ──────────────────────────────────────────
    for (const actData of analysis.acts || []) {
      const newAct = actStore.create(story.id, {
        title: actData.title,
        description: actData.description,
      });
      createdActs.push({ id: newAct.id, title: actData.title });

      for (const sceneData of actData.scenes || []) {
        const location = createdLocations.find((l) => l.name === sceneData.location);

        const characterIds = createdCharacters
          .filter((c) => sceneData.characters?.includes(c.name))
          .map((c) => c.id);

        const scenePropNames = (sceneData.props || []).map((p) =>
          typeof p === "string" ? p : p.name
        );
        const propIds = createdProps
          .filter((p) => scenePropNames.includes(p.name))
          .map((p) => p.id);

        // Build enriched notes combining all visual metadata and key dialogue
        const visualNotes = [
          sceneData.visualStyle ? `视觉风格：${sceneData.visualStyle}` : "",
          sceneData.cameraNote ? `镜头：${sceneData.cameraNote}` : "",
          sceneData.keyAction ? `关键动作：${sceneData.keyAction}` : "",
          sceneData.keyDialogue ? `关键台词："${sceneData.keyDialogue}"` : "",
          sceneData.notes || "",
        ].filter(Boolean).join(" | ");

        // Determine effective mood (prefer explicit field, fall back to atmosphereRef)
        const effectiveMood =
          sceneData.mood ||
          sceneData.atmosphereRef ||
          (sceneData.visualEffect?.style ? sceneData.visualEffect.style : "");

        storySceneStore.create(newAct.id, {
          title: sceneData.title,
          description: sceneData.description,
          locationId: location?.id,
          characterIds,
          propIds,
          timeOfDay: sceneData.timeOfDay || "",
          weather: sceneData.weather || "",
          mood: effectiveMood,
          notes: visualNotes || sceneData.notes || "",
          ...(sceneData.thumbnailUrl ? { thumbnailUrl: sceneData.thumbnailUrl } : {}),
        });
      }
    }

    return NextResponse.json({
      success: true,
      storyId: story.id,
      charactersCreated: createdCharacters.length,
      relationshipsSaved: analysis.relationships?.length || 0,
      locationsCreated: createdLocations.length,
      actsCreated: createdActs.length,
      propsCreated: createdProps.length,
    });
  } catch (error) {
    console.error("Error applying analysis:", error);
    return NextResponse.json(
      { error: "保存分析结果失败，请重试" },
      { status: 500 }
    );
  }
}

// ── Helpers ────────────────────────────────────────────────────

function buildPersonalityText(char: AnalysisCharacter): string {
  const parts = [
    char.personality,
    char.motivation ? `核心动机：${char.motivation}` : "",
  ].filter(Boolean);
  return parts.join("；") || "";
}

function buildBackgroundText(char: AnalysisCharacter): string {
  const parts = [
    char.age ? `年龄：${char.age}` : "",
    char.gender ? `性别：${char.gender}` : "",
    char.background,
    char.arc ? `成长弧线：${char.arc}` : "",
  ].filter(Boolean);
  return parts.join("；") || "";
}

function mapCharacterRole(role: string): "protagonist" | "antagonist" | "supporting" | "minor" {
  const s = (role || "").toLowerCase();
  if (s === "protagonist" || s === "main" || s === "主角") return "protagonist";
  if (s === "antagonist" || s === "villain" || s === "反派") return "antagonist";
  if (s === "minor" || s === "次要" || s === "龙套") return "minor";
  return "supporting";
}

function mapLocationType(type?: string): "interior" | "exterior" | "both" {
  if (!type) return "exterior";
  const s = type.toLowerCase();
  if (s === "interior" || s === "室内" || s === "indoor") return "interior";
  if (s === "both" || s === "兼有" || s === "both") return "both";
  return "exterior";
}

function mapPropImportance(importance?: string): "key" | "supporting" | "background" {
  const s = (importance || "").toLowerCase();
  if (s === "key" || s === "关键" || s === "重要") return "key";
  if (s === "background" || s === "背景") return "background";
  return "supporting";
}
