import type { SceneDescription } from "@/types/ai";

export type AuditDimension =
  | "character_continuity"
  | "scene_coherence"
  | "time_logic"
  | "emotion_curve"
  | "physics_consistency"
  | "dialogue_timing"
  | "shot_language"
  | "lighting_consistency"
  | "style_consistency"
  | "repetition_detection"
  | "ai_detection"
  | "creative_intent"
  | "sound_timing"
  | "film_reference"
  | "director_notes"
  | "hook_management";

export const AUDIT_DIMENSIONS: Record<AuditDimension, { name: string; description: string; weight: number }> = {
  character_continuity: {
    name: "角色连续性",
    description: "角色位置、情绪是否与真相文件一致",
    weight: 10,
  },
  scene_coherence: {
    name: "场景连贯性",
    description: "场景切换是否合理，与追踪记录匹配",
    weight: 9,
  },
  time_logic: {
    name: "时间逻辑",
    description: "时间线是否合理，白天黑夜不能突变",
    weight: 8,
  },
  emotion_curve: {
    name: "情绪曲线",
    description: "emotion_curve 是否符合叙事逻辑",
    weight: 9,
  },
  physics_consistency: {
    name: "物理一致性",
    description: "角色动作是否合理，不能瞬移",
    weight: 7,
  },
  dialogue_timing: {
    name: "对话时机",
    description: "dialogue_timing 与动作是否匹配",
    weight: 6,
  },
  shot_language: {
    name: "镜头语言",
    description: "shot_type/camera_movement 组合是否专业",
    weight: 8,
  },
  lighting_consistency: {
    name: "光影一致性",
    description: "lighting_type 与 time_weather 是否匹配",
    weight: 7,
  },
  style_consistency: {
    name: "风格一致性",
    description: "各场景风格是否统一",
    weight: 6,
  },
  repetition_detection: {
    name: "重复检测",
    description: "相似场景/描述是否过多",
    weight: 5,
  },
  ai_detection: {
    name: "AI 味检测",
    description: "是否有高频 AI 表达痕迹",
    weight: 5,
  },
  creative_intent: {
    name: "创意意图",
    description: "creative_intent 是否被体现",
    weight: 6,
  },
  sound_timing: {
    name: "音效匹配",
    description: "sound_timing 与画面动作同步",
    weight: 5,
  },
  film_reference: {
    name: "参考影片",
    description: "film_reference 是否恰当引用",
    weight: 3,
  },
  director_notes: {
    name: "导演备注",
    description: "director_notes 是否可执行",
    weight: 3,
  },
  hook_management: {
    name: "伏笔管理",
    description: "是否正确处理伏笔（埋设/暗示/回收）",
    weight: 8,
  },
};

export type IssueSeverity = "error" | "warning" | "info";

export interface AuditIssue {
  severity: IssueSeverity;
  dimension: AuditDimension;
  message: string;
  suggestion: string;
}

export interface SceneAuditResult {
  sceneIndex: number;
  scene: SceneDescription;
  passed: boolean;
  issues: AuditIssue[];
  scores: Partial<Record<AuditDimension, number>>;
  overallScore: number;
}

export interface AuditReport {
  id: string;
  projectId: string;
  createdAt: string;
  totalScenes: number;
  passedScenes: number;
  warningScenes: number;
  errorScenes: number;
  overallScore: number;
  scenes: SceneAuditResult[];
  summary: {
    topIssues: AuditIssue[];
    dimensionScores: Record<AuditDimension, { avg: number; min: number; max: number }>;
    recommendations: string[];
  };
}

export interface AuditOptions {
  strictMode?: boolean;
  characters?: Array<{
    name: string;
    role: string;
    location?: string;
    emotion?: string;
    status?: string;
  }>;
  locations?: Array<{
    name: string;
    visited?: boolean;
  }>;
  authorIntent?: {
    vision?: string;
    style?: string;
  };
  previousScenes?: SceneDescription[];
  hooks?: Array<{
    id: string;
    description: string;
    plantedAt: number;
    status: "open" | "progressing" | "deferred" | "resolved";
    resolvedAt?: number;
    category?: string;
    importance?: string;
  }>;
}
