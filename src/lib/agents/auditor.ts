import type {
  AuditReport,
  AuditOptions,
  AuditIssue,
  SceneAuditResult,
  AuditDimension,
  IssueSeverity,
} from "@/types/audit";
import type { SceneDescription } from "@/types/ai";
import { AUDIT_DIMENSIONS } from "@/types/audit";
import { isDeepSeekConfigured, callVolcAPI } from "@/lib/ai/deepseek";

const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-v3-2-251201";

export class AuditorError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = "AuditorError";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildSceneContext(scenes: SceneDescription[], index: number): string {
  const prev = index > 0 ? scenes[index - 1] : null;
  const next = index < scenes.length - 1 ? scenes[index + 1] : null;

  let context = "";
  if (prev) {
    context += `\n【前一个场景 (Scene ${prev.order_index})】\n`;
    context += `- 描述: ${prev.description}\n`;
    context += `- 地点: ${prev.location || "未知"} / 时间: ${prev.time_weather || "未知"}\n`;
    if (prev.emotion_curve) context += `- 情绪结束状态: ${prev.emotion_curve.split("→").pop() || prev.emotion_curve}\n`;
  }
  if (next) {
    context += `\n【后一个场景 (Scene ${next.order_index})】\n`;
    context += `- 描述: ${next.description}\n`;
    context += `- 地点: ${next.location || "未知"} / 时间: ${next.time_weather || "未知"}\n`;
    if (next.emotion_curve) context += `- 情绪起始状态: ${next.emotion_curve.split("→")[0] || next.emotion_curve}\n`;
  }
  return context;
}

async function callAuditAPI(prompt: string): Promise<string> {
  if (!isDeepSeekConfigured()) {
    throw new AuditorError("VOLC_API_KEY is not configured");
  }

  const systemPrompt = `你是专业的影视分镜审计员。分析给定的分镜场景，输出 JSON 格式的审计结果。

审计维度：
${Object.entries(AUDIT_DIMENSIONS).map(([key, val]) => `- ${key}: ${val.name} - ${val.description}`).join("\n")}

输出格式（严格 JSON）：
{
  "issues": [
    {
      "severity": "error|warning|info",
      "dimension": "维度代码",
      "message": "问题描述",
      "suggestion": "修复建议"
    }
  ],
  "scores": {
    "维度代码": 0-100
  },
  "overallScore": 0-100,
  "summary": "一句话总结"
}`;

  try {
    const response = await callVolcAPI(
      [
        { role: "system", content: [{ type: "input_text" as const, text: systemPrompt }] },
        { role: "user", content: [{ type: "input_text" as const, text: prompt }] },
      ],
      { stream: false }
    );
    return response.output?.[0]?.content?.[0]?.text || "";
  } catch (error) {
    throw new AuditorError(`Failed to call audit API: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

function parseAuditResponse(responseText: string): { issues: Array<Omit<AuditIssue, "dimension"> & { dimension: string }>; scores: Record<string, number>; overallScore: number; summary: string } {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { issues: [], scores: {}, overallScore: 70, summary: "无法解析审计结果" };
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { issues: [], scores: {}, overallScore: 70, summary: "审计结果解析失败" };
  }
}

function runRuleBasedChecks(
  scene: SceneDescription,
  index: number,
  allScenes: SceneDescription[],
  options: AuditOptions
): { issues: AuditIssue[]; scores: Partial<Record<AuditDimension, number>> } {
  const issues: AuditIssue[] = [];
  const scores: Partial<Record<AuditDimension, number>> = {};
  const { characters = [], locations = [] } = options;

  let charScore = 100;
  if (characters.length > 0 && scene.description) {
    for (const char of characters) {
      if (char.location && scene.location && char.location !== scene.location && scene.description.includes(char.name)) {
        issues.push({
          severity: "warning",
          dimension: "character_continuity",
          message: `角色"${char.name}"当前应在"${char.location}"，但此场景位于"${scene.location}"`,
          suggestion: `确认角色位置是否已更新，或添加场景过渡说明`,
        });
        charScore -= 15;
      }
      if (char.status === "死亡" && scene.description?.includes(char.name)) {
        issues.push({
          severity: "error",
          dimension: "character_continuity",
          message: `角色"${char.name}"状态为"死亡"，但此场景仍出现该角色`,
          suggestion: `移除该角色或修改角色状态`,
        });
        charScore -= 30;
      }
    }
  }
  if (charScore < 100) scores.character_continuity = Math.max(0, charScore);

  let sceneScore = 100;
  const prevScene = index > 0 ? allScenes[index - 1] : null;
  if (prevScene && scene.location && prevScene.location) {
    const locationChanged = scene.location !== prevScene.location;
    if (locationChanged && !scene.description?.includes(prevScene.location) &&
        !scene.description?.includes(scene.location)) {
      issues.push({
        severity: "warning",
        dimension: "scene_coherence",
        message: `场景从"${prevScene.location}"切换到"${scene.location}"，缺少过渡说明`,
        suggestion: `在描述中添加转场说明或镜头运动暗示`,
      });
      sceneScore -= 12;
    }
  }
  if (locations.length > 0) {
    const currentLoc = locations.find(l => l.name === scene.location);
    if (currentLoc && !currentLoc.visited) {
      issues.push({
        severity: "info",
        dimension: "scene_coherence",
        message: `场景"${scene.location}"标记为未到访，但已在此处使用`,
        suggestion: `在场景追踪中将此场景标记为已到访`,
      });
    }
  }
  if (sceneScore < 100) scores.scene_coherence = Math.max(0, sceneScore);

  let lightScore = 100;
  if (scene.time_weather && scene.lighting_type) {
    const timeKeywords: Record<string, string[]> = {
      "白天": ["natural", "bright", "high_key"],
      "夜晚": ["dramatic", "low_key", "rim"],
      "黄昏": ["golden_hour", "warm", "backlit"],
      "阴天": ["flat", "soft", "diffused"],
      "深夜": ["dramatic", "moonlight", "low_key"],
    };
    const matchedTime = Object.keys(timeKeywords).find(t => scene.time_weather?.includes(t));
    if (matchedTime) {
      const expectedLights = timeKeywords[matchedTime];
      const isMatch = expectedLights.some(l => scene.lighting_type?.includes(l));
      if (!isMatch && scene.lighting_type !== "natural") {
        issues.push({
          severity: "warning",
          dimension: "lighting_consistency",
          message: `时间"${scene.time_weather}"与光影"${scene.lighting_type}"可能不匹配`,
          suggestion: `${matchedTime === "白天" || matchedTime === "阴天" ? "建议使用 natural/bright/high_key" : matchedTime === "夜晚" || matchedTime === "深夜" ? "建议使用 dramatic/low_key/rim" : "建议使用 golden_hour/warm/backlit"}`,
        });
        lightScore -= 10;
      }
    }
  }
  if (lightScore < 100) scores.lighting_consistency = Math.max(0, lightScore);

  let physicsScore = 100;
  if (scene.performance_action) {
    const teleportPatterns = [/瞬间|突然出现|瞬移|一眨眼就到|立刻到达/];
    for (const pattern of teleportPatterns) {
      if (pattern.test(scene.performance_action)) {
        issues.push({
          severity: "warning",
          dimension: "physics_consistency",
          message: `检测到可能的瞬移动作："${scene.performance_action.match(pattern)?.[0]}"`,
          suggestion: `添加合理的移动过程或镜头遮挡来掩盖转场`,
        });
        physicsScore -= 15;
      }
    }
  }
  if (physicsScore < 100) scores.physics_consistency = Math.max(0, physicsScore);

  let shotScore = 100;
  if (scene.shot_type && scene.camera_movement) {
    const incompatibleCombos: [string, string][] = [
      ["ECU", "pan"], ["ECU", "tilt"], ["ECU", "tracking"],
      ["EWS", "dolly_in"], ["EWS", "push_in"],
    ];
    for (const [shot, movement] of incompatibleCombos) {
      if (scene.shot_type === shot && scene.camera_movement.includes(movement.replace("_", ""))) {
        issues.push({
          severity: "warning",
          dimension: "shot_language",
          message: `景别"${scene.shot_type_name || scene.shot_type}"与运镜"${scene.camera_movement_name || scene.camera_movement}"组合不专业`,
          suggestion: `极特写(ECU)不适合大范围运镜，远景(EWS)不适合推进镜头`,
        });
        shotScore -= 12;
      }
    }
  }
  if (shotScore < 100) scores.shot_language = Math.max(0, shotScore);

  let repScore = 100;
  const descNormalized = (scene.description || "").replace(/[\s，。！？、]/g, "").slice(0, 50);
  const similarCount = allScenes.filter((s, i) => i !== index &&
    (s.description || "").replace(/[\s，。！？、]/g, "").slice(0, 50) === descNormalized
  ).length;
  if (similarCount > 0 || (scene.image_prompt && allScenes.filter((s, i) =>
    i !== index && s.image_prompt === scene.image_prompt).length > 0)) {
    issues.push({
      severity: "warning",
      dimension: "repetition_detection",
      message: `此场景描述与其他场景高度相似`,
      suggestion: `增加独特的视觉元素或动作细节，避免重复`,
    });
    repScore -= 20;
  }
  if (repScore < 100) scores.repetition_detection = Math.max(0, repScore);

  let aiScore = 100;
  const aiPatterns = [
    /\b(stunningly|breathtakingly|incredibly|remarkably|absolutely)\b/i,
    /\b(a symphony of|a dance of|a tapestry of|a kaleidoscope of)\b/i,
    /\b(embark on a journey|unveil the secrets|unlock the potential)\b/i,
    /\b(in the realm of|amidst the backdrop of|against the canvas of)\b/i,
    /(?:^|\s)(?:The |A )(?:wind|sun|moon|rivers?|mountains?|ocean?) (?:whispers|dances|paints|sings|echoes)/i,
  ];
  const textToCheck = [scene.description, scene.creative_intent, scene.director_notes].filter(Boolean).join(" ");
  let aiPatternCount = 0;
  for (const pattern of aiPatterns) {
    if (pattern.test(textToCheck)) aiPatternCount++;
  }
  if (aiPatternCount >= 2) {
    issues.push({
      severity: "warning",
      dimension: "ai_detection",
      message: `检测到 ${aiPatternCount} 个 AI 典型表达模式`,
      suggestion: `替换模板化表达为更具体的、有个性的描述`,
    });
    aiScore -= 10 * aiPatternCount;
  }
  if (aiScore < 100) scores.ai_detection = Math.max(0, aiScore);

  let dialogueScore = 100;
  if (scene.dialogue && scene.dialogue_timing) {
    const duration = scene.duration_seconds || 6;
    const timingMatch = scene.dialogue_timing.match(/(\d+)/);
    if (timingMatch) {
      const dialogStart = parseInt(timingMatch[1]);
      if (dialogStart > duration * 0.8) {
        issues.push({
          severity: "warning",
          dimension: "dialogue_timing",
          message: `对话开始时间(${dialogStart}s)接近场景结尾(${duration}s)，可能来不及说完`,
          suggestion: `提前对话开始时间或延长场景时长`,
        });
        dialogueScore -= 10;
      }
    }
    if (!scene.performance_start && scene.dialogue) {
      issues.push({
        severity: "info",
        dimension: "dialogue_timing",
        message: `有对话但缺少表演起始状态，无法确认说话时的肢体动作`,
        suggestion: `补充 performance_start 描述角色说话时的姿态和表情`,
      });
      dialogueScore -= 5;
    }
  }
  if (dialogueScore < 100) scores.dialogue_timing = Math.max(0, dialogueScore);

  let emotionScore = 100;
  if (scene.emotion_curve) {
    const parts = scene.emotion_curve.split("→");
    if (parts.length < 2) {
      issues.push({
        severity: "info",
        dimension: "emotion_curve",
        message: `情绪曲线过于简单，只有一种情绪状态`,
        suggestion: `至少包含 2 个情绪转折点，如"平静→紧张→释放"`,
      });
      emotionScore -= 8;
    }
  }
  if (emotionScore < 100) scores.emotion_curve = Math.max(0, emotionScore);

  let intentScore = 100;
  if (!scene.creative_intent && !scene.narrative_function) {
    issues.push({
      severity: "info",
      dimension: "creative_intent",
      message: `缺少创意意图或叙事功能说明`,
      suggestion: `补充此分镜的叙事目的（如：建立悬念、揭示信息、情感高潮）`,
    });
    intentScore -= 5;
  }
  if (intentScore < 100) scores.creative_intent = Math.max(0, intentScore);

  let soundScore = 100;
  if ((scene.action_sound || scene.special_sound) && !scene.sound_timing) {
    issues.push({
      severity: "info",
      dimension: "sound_timing",
      message: `有动作音效或特效音效但缺少时间标注`,
      suggestion: `补充 sound_timing 标注音效触发的精确时刻`,
    });
    soundScore -= 8;
  }
  if (soundScore < 100) scores.sound_timing = Math.max(0, soundScore);

  let hookScore = 100;
  const { hooks = [] } = options;
  if (hooks.length > 0) {
    const openHooks = hooks.filter((h) => h.status === "open");
    const hooksToHint = openHooks.filter((h) => {
      const isNearPlant = Math.abs(h.plantedAt - index) <= 1;
      const isNearResolution = h.resolvedAt !== undefined ? Math.abs(h.resolvedAt - index) <= 2 : false;
      const needsHint = index > h.plantedAt + 3 && (!h.resolvedAt || index < h.resolvedAt - 2);
      return isNearPlant || isNearResolution || needsHint;
    });

    if (hooksToHint.length > 0 && !scene.description?.includes("伏笔")) {
      const criticalHooks = hooksToHint.filter((h) => h.importance === "critical");
      if (criticalHooks.length > 0) {
        issues.push({
          severity: "warning",
          dimension: "hook_management",
          message: `此场景附近有 ${criticalHooks.length} 个关键伏笔需要处理，但描述中未提及`,
          suggestion: `在描述中添加对以下伏笔的暗示：${criticalHooks.map((h) => `"${h.description}"`).join(", ")}`,
        });
        hookScore -= 15 * criticalHooks.length;
      }
    }
  }
  if (hookScore < 100) scores.hook_management = Math.max(0, hookScore);

  return { issues, scores };
}

export async function auditScene(
  scene: SceneDescription,
  index: number,
  allScenes: SceneDescription[],
  options: AuditOptions = {}
): Promise<SceneAuditResult> {
  const ruleResult = runRuleBasedChecks(scene, index, allScenes, options);
  let aiIssues: AuditIssue[] = [];
  let aiScores: Record<string, number> = {};

  try {
    const sceneContext = buildSceneContext(allScenes, index);
    const truthContext = options.characters?.length ? `
【角色真相文件】
${options.characters.map(c => `- ${c.name} (${c.role}): 位于${c.location || "?"}, 情绪${c.emotion || "?"}, 状态${c.status}`).join("\n")}` : "";

    const locationContext = options.locations?.length ? `
【场景追踪】
${options.locations.map(l => `- ${l.name}: ${l.visited ? "已到访" : "未到访"}`).join("\n")}` : "";

    const authorIntentContext = options.authorIntent?.vision ? `
【作者意图】
- 愿景: ${options.authorIntent.vision}
${options.authorIntent.style ? `- 风格: ${options.authorIntent.style}` : ""}` : "";

    const prompt = `请审计以下分镜场景：

【当前场景 (Scene ${scene.order_index})】
- 描述: ${scene.description}
- 地点/时间: ${scene.location || "?"} / ${scene.time_weather || "?"}
- 时长: ${scene.duration_seconds || "?"}秒
- 景别: ${scene.shot_type_name || scene.shot_type || "?"}
- 运镜: ${scene.camera_movement_name || scene.camera_movement || "?"}
- 情绪曲线: ${scene.emotion_curve || "?"}
- 对白: ${scene.dialogue || "无"}
- 创意意图: ${scene.creative_intent || "?"}
- image_prompt: ${scene.image_prompt || "?"}${sceneContext}${truthContext}${locationContext}${authorIntentContext}

请严格按上述维度进行审计，输出 JSON 结果。`;

    const response = await callAuditAPI(prompt);
    const parsed = parseAuditResponse(response);

    aiIssues = parsed.issues.map(issue => ({
      ...issue,
      dimension: (issue.dimension in AUDIT_DIMENSIONS ? issue.dimension : "creative_intent") as AuditDimension,
    }));

    aiScores = parsed.scores;
  } catch (error) {
    console.warn(`AI audit failed for scene ${index}, using rule-based only:`, error);
  }

  const allIssues = [...ruleResult.issues, ...aiIssues];
  const allScores = { ...ruleResult.scores, ...aiScores };

  const errors = allIssues.filter(i => i.severity === "error").length;
  const warnings = allIssues.filter(i => i.severity === "warning").length;

  const scoreValues = Object.values(allScores);
  const avgScore = scoreValues.length > 0
    ? scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length
    : 100 - (errors * 25) - (warnings * 10);

  return {
    sceneIndex: index,
    scene,
    passed: errors === 0,
    issues: allIssues,
    scores: allScores,
    overallScore: Math.round(Math.max(0, Math.min(100, avgScore))),
  };
}

export async function auditAllScenes(
  scenes: SceneDescription[],
  options: AuditOptions = {}
): Promise<AuditReport> {
  const results: SceneAuditResult[] = [];

  for (let i = 0; i < scenes.length; i++) {
    const result = await auditScene(scenes[i], i, scenes, options);
    results.push(result);
    if (i < scenes.length - 1) await sleep(200);
  }

  const passedScenes = results.filter(r => r.passed).length;
  const warningScenes = results.filter(r => !r.passed && r.issues.some(i => i.severity === "warning")).length;
  const errorScenes = results.filter(r => r.issues.some(i => i.severity === "error")).length;
  const overallScore = results.reduce((sum, r) => sum + r.overallScore, 0) / results.length;

  const allIssues = results.flatMap(r => r.issues);
  const topIssues = allIssues
    .sort((a, b) => {
      const severityOrder: Record<IssueSeverity, number> = { error: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    })
    .slice(0, 10);

  const dimensionScores: Record<AuditDimension, { avg: number; min: number; max: number }> = {} as any;
  for (const dim of Object.keys(AUDIT_DIMENSIONS) as AuditDimension[]) {
    const dimResults = results.map(r => r.scores[dim] ?? 100);
    dimensionScores[dim] = {
      avg: dimResults.reduce((a, b) => a + b, 0) / dimResults.length,
      min: Math.min(...dimResults),
      max: Math.max(...dimResults),
    };
  }

  const recommendations: string[] = [];
  if (errorScenes > 0) recommendations.push(`发现 ${errorScenes} 个场景存在严重问题，建议优先修复`);
  if (dimensionScores.character_continuity?.avg < 70) recommendations.push("角色连续性得分较低，请检查并更新角色真相文件");
  if (dimensionScores.lighting_consistency?.avg < 70) recommendations.push("光影一致性问题较多，建议统一审查 time_weather 与 lighting_type 的对应关系");
  if (dimensionScores.ai_detection?.avg < 80) recommendations.push("检测到较多 AI 表达痕迹，建议手动润色或启用去 AI 味修订");
  if (allIssues.filter(i => i.dimension === "repetition_detection").length > 2) recommendations.push("发现多个重复场景，建议增加多样性或合并相似场景");

  return {
    id: `audit_${Date.now()}`,
    projectId: "",
    createdAt: new Date().toISOString(),
    totalScenes: scenes.length,
    passedScenes,
    warningScenes,
    errorScenes,
    overallScore: Math.round(overallScore),
    scenes: results,
    summary: {
      topIssues,
      dimensionScores,
      recommendations,
    },
  };
}

export function isAuditorConfigured(): boolean {
  return isDeepSeekConfigured();
}
