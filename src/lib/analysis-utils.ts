import type { NovelAnalysisResult } from "@/types/audit";

const VALID_ROLES = ["protagonist", "antagonist", "supporting", "minor"] as const;
const DEFAULT_GENRES = ["都市", "玄幻", "科幻", "悬疑", "爱情", "历史", "武侠", "仙侠", "恐怖", "喜剧"];

export interface ValidationError {
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  isValid: boolean;
  data: NovelAnalysisResult;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export function validateNovelAnalysis(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (!data || typeof data !== "object") {
    return {
      isValid: false,
      data: createEmptyAnalysis(),
      errors: [{ field: "root", message: "无效的数据格式", severity: "error" }],
      warnings: [],
    };
  }

  const raw = data as Record<string, unknown>;

  const result: NovelAnalysisResult = {
    title: validateAndCleanString(raw.title, "未命名项目", "title", errors, warnings),
    logline: validateAndCleanString(raw.logline, "", "logline", errors, warnings),
    synopsis: validateAndCleanString(raw.synopsis, "", "synopsis", errors, warnings),
    genre: validateGenre(raw.genre, errors, warnings),
    targetDuration: validateTargetDuration(raw.targetDuration, errors, warnings),
    characters: validateAndCleanCharacters(raw.characters, errors, warnings),
    relationships: validateAndCleanRelationships(raw.relationships, warnings),
    locations: validateAndCleanLocations(raw.locations, errors, warnings),
    props: validateAndCleanProps(raw.props, errors, warnings),
    acts: validateAndCleanActs(raw.acts, errors, warnings),
  };

  if (!result.characters.length) {
    warnings.push({ field: "characters", message: "没有识别到角色，已添加默认角色", severity: "warning" });
    result.characters = [
      { name: "主角", description: "故事的主人公", role: "protagonist", appearance: "普通外貌" },
    ];
  }

  if (!result.acts.length) {
    warnings.push({ field: "acts", message: "没有识别到幕结构，已添加默认分幕", severity: "warning" });
    result.acts = [
      { title: "第一幕：开端", description: "介绍故事背景", scenes: [{ title: "开场", description: "故事开始", location: "主要场景", characters: ["主角"], props: [] }] },
      { title: "第二幕：发展", description: "冲突升级", scenes: [{ title: "冲突", description: "矛盾出现", location: "主要场景", characters: ["主角"], props: [] }] },
      { title: "第三幕：高潮与结局", description: "冲突解决", scenes: [{ title: "高潮", description: "故事达到最高潮", location: "主要场景", characters: ["主角"], props: [] }] },
    ];
  }

  if (!result.locations.length && result.acts.length > 0) {
    const firstScene = result.acts[0].scenes?.[0];
    if (firstScene?.location) {
      result.locations = [{ name: firstScene.location, description: "故事发生的主要地点" }];
    }
  }

  return {
    isValid: errors.length === 0,
    data: result,
    errors,
    warnings,
  };
}

function validateAndCleanString(
  value: unknown,
  defaultValue: string,
  field: string,
  errors: ValidationError[],
  warnings: ValidationError[]
): string {
  if (value === undefined || value === null) {
    if (defaultValue) {
      warnings.push({ field, message: `${field} 为空，已使用默认值`, severity: "warning" });
    }
    return defaultValue;
  }

  const str = String(value).trim();

  if (str.length > 2000) {
    warnings.push({ field, message: `${field} 过长，已截断`, severity: "warning" });
    return str.substring(0, 2000);
  }

  return str;
}

function validateGenre(value: unknown, errors: ValidationError[], warnings: ValidationError[]): string {
  if (!value) return "都市";

  const genre = String(value).trim();

  if (DEFAULT_GENRES.includes(genre)) {
    return genre;
  }

  const matched = DEFAULT_GENRES.find((g) => genre.includes(g));
  if (matched) {
    warnings.push({ field: "genre", message: `题材不标准，已识别为"${matched}"`, severity: "warning" });
    return matched;
  }

  warnings.push({ field: "genre", message: `题材"${genre}"不在标准列表中，已使用默认值`, severity: "warning" });
  return "都市";
}

function validateTargetDuration(value: unknown, errors: ValidationError[], warnings: ValidationError[]): number {
  if (value === undefined || value === null) {
    warnings.push({ field: "targetDuration", message: "时长为空，已使用默认值 60 分钟", severity: "warning" });
    return 60;
  }

  const num = Number(value);

  if (isNaN(num) || num <= 0) {
    warnings.push({ field: "targetDuration", message: "时长无效，已使用默认值 60 分钟", severity: "warning" });
    return 60;
  }

  if (num > 240) {
    warnings.push({ field: "targetDuration", message: "时长过长，已限制为 240 分钟", severity: "warning" });
    return 240;
  }

  if (num < 5) {
    warnings.push({ field: "targetDuration", message: "时长过短，已设置为 5 分钟", severity: "warning" });
    return 5;
  }

  return Math.round(num);
}

function validateAndCleanCharacters(
  value: unknown,
  errors: ValidationError[],
  warnings: ValidationError[]
): NovelAnalysisResult["characters"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item, index) => {
      if (!item || typeof item !== "object") {
        warnings.push({ field: `characters[${index}]`, message: "角色数据无效，已跳过", severity: "warning" });
        return false;
      }
      return true;
    })
    .slice(0, 20) // 放宽上限，允许更多有戏分角色
    .map((item, index) => {
      const char = item as Record<string, unknown>;
      return {
        name: validateAndCleanString(char.name, `角色${index + 1}`, `characters[${index}].name`, [], []),
        description: validateAndCleanString(char.description, "", `characters[${index}].description`, [], []),
        role: validateRole(char.role, `characters[${index}].role`, warnings),
        appearance: validateAndCleanString(char.appearance, "", `characters[${index}].appearance`, [], []),
        // 保留所有详细字段，不再过滤
        age: char.age ? String(char.age).trim() : undefined,
        gender: char.gender ? String(char.gender).trim() : undefined,
        personality: char.personality ? String(char.personality).trim() : undefined,
        background: char.background ? String(char.background).trim() : undefined,
        motivation: char.motivation ? String(char.motivation).trim() : undefined,
        arc: char.arc ? String(char.arc).trim() : undefined,
      };
    });
}

function validateAndCleanRelationships(
  value: unknown,
  warnings: ValidationError[]
): NovelAnalysisResult["relationships"] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item) => item && typeof item === "object")
    .slice(0, 30)
    .map((item) => {
      const rel = item as Record<string, unknown>;
      return {
        from: String(rel.from || "").trim(),
        to: String(rel.to || "").trim(),
        type: String(rel.type || "").trim(),
        description: String(rel.description || "").trim(),
        dynamic: rel.dynamic ? String(rel.dynamic).trim() : undefined,
      };
    })
    .filter((rel) => rel.from && rel.to); // 必须有双方角色名
}

function validateRole(value: unknown, field: string, warnings: ValidationError[]): NovelAnalysisResult["characters"][0]["role"] {
  if (!value) return "supporting";

  const role = String(value).toLowerCase().trim();

  if ((VALID_ROLES as readonly string[]).includes(role)) {
    return role as any;
  }

  if (role.includes("主")) return "protagonist";
  if (role.includes("反") || role.includes("坏")) return "antagonist";
  if (role.includes("配")) return "supporting";

  warnings.push({ field, message: `角色类型"${value}"不标准，已设为"配角"`, severity: "warning" });
  return "supporting";
}

function validateAndCleanLocations(
  value: unknown,
  errors: ValidationError[],
  warnings: ValidationError[]
): NovelAnalysisResult["locations"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item, index) => {
      if (!item || typeof item !== "object") {
        warnings.push({ field: `locations[${index}]`, message: "地点数据无效，已跳过", severity: "warning" });
        return false;
      }
      return true;
    })
    .slice(0, 30)
    .map((item, index) => {
      const loc = item as Record<string, unknown>;
      const locType = String(loc.type || "").toLowerCase().trim();
      const validTypes = ["interior", "exterior", "both"];
      return {
        name: validateAndCleanString(loc.name, `地点${index + 1}`, `locations[${index}].name`, [], []),
        description: validateAndCleanString(loc.description, "", `locations[${index}].description`, [], []),
        // 保留所有详细字段
        type: validTypes.includes(locType) ? (locType as "interior" | "exterior" | "both") : undefined,
        atmosphere: loc.atmosphere ? String(loc.atmosphere).trim() : undefined,
        keyFeatures: Array.isArray(loc.keyFeatures)
          ? loc.keyFeatures.map((f) => String(f).trim()).filter(Boolean).slice(0, 5)
          : undefined,
        timeContext: loc.timeContext ? String(loc.timeContext).trim() : undefined,
      };
    });
}

function validateAndCleanProps(
  value: unknown,
  errors: ValidationError[],
  warnings: ValidationError[]
): NovelAnalysisResult["props"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item, index) => {
      if (!item || typeof item !== "object") {
        warnings.push({ field: `props[${index}]`, message: "道具数据无效，已跳过", severity: "warning" });
        return false;
      }
      return true;
    })
    .slice(0, 30)
    .map((item, index) => {
      const prop = item as Record<string, unknown>;
      const importance = String(prop.importance || "supporting").toLowerCase().trim();
      const validImportances = ["key", "supporting", "background"];
      return {
        name: validateAndCleanString(prop.name, `道具${index + 1}`, `props[${index}].name`, [], []),
        description: validateAndCleanString(prop.description, "", `props[${index}].description`, [], []),
        importance: validImportances.includes(importance)
          ? (importance as "key" | "supporting" | "background")
          : "supporting",
        // 保留外观描述（用于AI图片生成）
        appearance: prop.appearance ? String(prop.appearance).trim() : undefined,
        holder: prop.holder ? String(prop.holder).trim() : undefined,
        storyRole: prop.storyRole ? String(prop.storyRole).trim() : undefined,
      };
    });
}

function validateAndCleanActs(
  value: unknown,
  errors: ValidationError[],
  warnings: ValidationError[]
): NovelAnalysisResult["acts"] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item, index) => {
      if (!item || typeof item !== "object") {
        warnings.push({ field: `acts[${index}]`, message: "幕数据无效，已跳过", severity: "warning" });
        return false;
      }
      return true;
    })
    .slice(0, 6)
    .map((item, actIndex) => {
      const act = item as Record<string, unknown>;
      return {
        title: validateAndCleanString(act.title, `第${actIndex + 1}幕`, `acts[${actIndex}].title`, [], []),
        description: validateAndCleanString(act.description, "", `acts[${actIndex}].description`, [], []),
        scenes: validateAndCleanScenes(act.scenes, actIndex, warnings),
      };
    });
}

function validateAndCleanScenes(
  value: unknown,
  actIndex: number,
  warnings: ValidationError[]
): NovelAnalysisResult["acts"][0]["scenes"] {
  if (!Array.isArray(value)) {
    return [{ title: "场景", description: "", location: "主要场景", characters: [], props: [] }];
  }

  return value
    .filter((item, index) => {
      if (!item || typeof item !== "object") {
        warnings.push({ field: `acts[${actIndex}].scenes[${index}]`, message: "场景数据无效，已跳过", severity: "warning" });
        return false;
      }
      return true;
    })
    .slice(0, 50) // 允许更多场景
    .map((item, sceneIndex) => {
      const scene = item as Record<string, unknown>;
      return {
        title: validateAndCleanString(scene.title, `场景${sceneIndex + 1}`, `acts[${actIndex}].scenes[${sceneIndex}].title`, [], []),
        description: validateAndCleanString(scene.description, "", `acts[${actIndex}].scenes[${sceneIndex}].description`, [], []),
        location: validateAndCleanString(scene.location, "主要场景", `acts[${actIndex}].scenes[${sceneIndex}].location`, [], []),
        characters: Array.isArray(scene.characters)
          ? scene.characters.map((c) => String(c)).filter(Boolean)
          : [],
        props: Array.isArray(scene.props)
          ? scene.props.map((p) => {
              // 兼容 props 是字符串数组或对象数组
              if (typeof p === "string") return p;
              if (p && typeof p === "object" && (p as any).name) return String((p as any).name);
              return String(p);
            }).filter(Boolean)
          : [],
        // 保留所有视觉元数据字段
        timeOfDay: scene.timeOfDay ? String(scene.timeOfDay).trim() : undefined,
        weather: scene.weather ? String(scene.weather).trim() : undefined,
        mood: scene.mood ? String(scene.mood).trim() : undefined,
        visualStyle: scene.visualStyle ? String(scene.visualStyle).trim() : undefined,
        cameraNote: scene.cameraNote ? String(scene.cameraNote).trim() : undefined,
        keyAction: scene.keyAction ? String(scene.keyAction).trim() : undefined,
        keyDialogue: scene.keyDialogue ? String(scene.keyDialogue).trim() : undefined,
      };
    });
}

function createEmptyAnalysis(): NovelAnalysisResult {
  return {
    title: "未命名项目",
    logline: "",
    synopsis: "",
    genre: "都市",
    targetDuration: 60,
    characters: [],
    locations: [],
    props: [],
    acts: [],
  };
}

export function sanitizeNovelContent(content: string): string {
  let cleaned = content;

  cleaned = cleaned.replace(/\r\n/g, "\n");
  cleaned = cleaned.replace(/[ \t]+\n/g, "\n");
  cleaned = cleaned.replace(/\n{4,}/g, "\n\n\n");
  cleaned = cleaned.trim();

  // 对超长内容采用三段均匀采样，保证开头、中间、结尾都被覆盖
  // 避免只取首尾导致中间角色和情节大量丢失
  if (cleaned.length > 60000) {
    const totalLen = cleaned.length;
    const segmentSize = 20000; // 每段约2万字

    const head = cleaned.substring(0, segmentSize);
    const midStart = Math.floor(totalLen / 2) - Math.floor(segmentSize / 2);
    const mid = cleaned.substring(midStart, midStart + segmentSize);
    const tail = cleaned.substring(totalLen - segmentSize);

    cleaned = [
      head,
      `\n\n...(已省略部分内容，原文共约${Math.round(totalLen / 500)}页)...\n\n`,
      mid,
      `\n\n...(已省略部分内容)...\n\n`,
      tail,
    ].join("");
  }

  return cleaned;
}

export function estimateAnalysisTime(contentLength: number): number {
  const baseTime = 10;
  const per1000Chars = 2;
  return Math.min(baseTime + Math.ceil(contentLength / 1000) * per1000Chars, 60);
}
