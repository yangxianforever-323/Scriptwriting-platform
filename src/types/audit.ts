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

export interface NovelAnalysisResult {
  title: string;
  logline: string;
  synopsis: string;
  genre: string;
  targetDuration: number;
  characters: Array<{
    name: string;
    description: string;
    role: "protagonist" | "antagonist" | "supporting" | "minor";
    appearance: string;          // 外貌特征（发型、肤色、身材、服装风格等）
    age?: string;                // 年龄或年龄段（如"25岁"、"中年"）
    gender?: string;             // 性别
    personality?: string;        // 性格特点（3-5个关键词）
    background?: string;         // 人物背景（出身、经历）
    motivation?: string;         // 核心动机（角色想要什么）
    arc?: string;                // 成长弧线（角色如何变化）
  }>;
  relationships?: Array<{        // 人物关系网络
    from: string;                // 关系发起方角色名
    to: string;                  // 关系对象角色名
    type: string;                // 关系类型：父子/母女/师徒/情侣/夫妻/兄弟/朋友/对手/仇人/主仆/合作伙伴
    description: string;         // 关系详细描述（包括关系的演变过程）
    dynamic?: string;            // 关系动态：互相信任/单方爱慕/明争暗斗/相互利用
  }>;
  locations: Array<{
    name: string;
    description: string;
    type?: "interior" | "exterior" | "both"; // 室内/室外/两者兼有
    atmosphere?: string;                      // 氛围关键词（如：阴森、温馨、壮阔）
    keyFeatures?: string[];                   // 3-5个视觉关键特征（用于生成图片）
    timeContext?: string;                     // 常见出现时间（白天/夜晚/黄昏）
  }>;
  props: Array<{
    name: string;
    description: string;
    importance: "key" | "supporting" | "background";
    appearance?: string;         // 道具的外观描述（用于生成）
    holder?: string;             // 持有者（哪个角色持有/使用）
    storyRole?: string;          // 在故事中的象征意义或作用
  }>;
  acts: Array<{
    title: string;
    description: string;
    scenes: Array<{
      title: string;
      description: string;       // 详细的场景描述（150字以上）
      location: string;
      characters: string[];
      props: string[];
      timeOfDay?: string;        // 时间段：morning/afternoon/evening/night/dawn
      weather?: string;          // 天气：clear/cloudy/rainy/foggy/snowy/storm
      mood?: string;             // 情绪基调：tense/warm/sad/joyful/mysterious/romantic/horror
      visualStyle?: string;      // 视觉风格建议（如：高对比度、柔光、冷色调）
      cameraNote?: string;       // 运镜建议（如：主观视角、特写、航拍）
      keyAction?: string;        // 关键动作/事件（场景最重要发生了什么）
      keyDialogue?: string;      // 关键台词（最能体现人物性格或推进剧情的一句话）
    }>;
  }>;
}
