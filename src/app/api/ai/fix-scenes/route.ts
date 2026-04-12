import { NextResponse } from "next/server";
import { dataStore } from "@/lib/data-store";
import type { SceneDescription } from "@/types/ai";
import { isDeepSeekConfigured, callVolcAPI } from "@/lib/ai/deepseek";

export const maxDuration = 600;
export const dynamic = "force-dynamic";

interface FixResult {
  sceneIndex: number;
  fixedScene: Partial<SceneDescription>;
  changesMade: string[];
  confidence: number;
  remainingIssues: string[];
}

async function fixSceneWithAI(
  scene: SceneDescription,
  index: number,
  issues: string[],
  options: any
): Promise<FixResult> {
  if (!isDeepSeekConfigured()) {
    throw new Error("AI service not configured");
  }

  const systemPrompt = `你是一个专业的影视分镜修订专家。根据发现的问题，自动修复分镜场景。

修复原则：
1. 保持原有的核心创意意图
2. 只修改有问题的部分，保留合理的描述
3. 确保修改后场景连贯、逻辑自洽
4. 修复后输出完整的场景信息

输出格式（严格JSON）：
{
  "fixedScene": { ... 完整场景对象 ... },
  "changesMade": ["修改1", "修改2"],
  "confidence": 0.85,
  "remainingIssues": []
}`;

  const prompt = `请修复以下分镜场景：

【当前场景】
${JSON.stringify(scene, null, 2)}

【发现的问题】
${issues.map((i, idx) => `${idx + 1}. ${i}`).join("\n")}

请输出修复后的JSON结果。`;

  try {
    const response = await callVolcAPI(
      [
        { role: "system", content: [{ type: "input_text" as const, text: systemPrompt }] },
        { role: "user", content: [{ type: "input_text" as const, text: prompt }] },
      ],
      { stream: false }
    );
    
    const content = response.output?.[0]?.content?.[0]?.text || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error("Fix scene failed:", error);
  }

  return {
    sceneIndex: index,
    fixedScene: scene,
    changesMade: [],
    confidence: 0,
    remainingIssues: issues,
  };
}

export async function POST(request: Request) {
  try {
    if (!isDeepSeekConfigured()) {
      return NextResponse.json(
        { error: "AI reviser service is not configured. Please set VOLC_API_KEY." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { projectId, sceneIndices, autoFix = false, maxIterations = 3, scoreThreshold = 85 } = body;

    if (!projectId || typeof projectId !== "string") {
      return NextResponse.json(
        { error: "Project ID is required" },
        { status: 400 }
      );
    }

    const project = dataStore.project.getById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const dbScenes = dataStore.scene.getByProjectId(projectId);
    if (dbScenes.length === 0) {
      return NextResponse.json(
        { error: "No scenes found. Generate scenes first." },
        { status: 400 }
      );
    }

    const scenes: SceneDescription[] = dbScenes.map((s) => ({
      order_index: s.order_index,
      description: s.description || "",
      duration_seconds: s.duration_seconds ?? undefined,
      location: s.location ?? undefined,
      time_weather: s.time_weather ?? undefined,
      image_prompt: s.image_prompt ?? undefined,
      shot_type: s.shot_type ?? undefined,
      shot_type_name: s.shot_type_name ?? undefined,
      camera_movement: s.camera_movement ?? undefined,
      camera_movement_name: s.camera_movement_name ?? undefined,
      camera_angle: s.camera_angle ?? undefined,
      lighting_type: s.lighting_type ?? undefined,
      emotion_curve: s.emotion_curve ?? undefined,
      dialogue: s.dialogue ?? undefined,
      dialogue_timing: s.dialogue_timing ?? undefined,
      creative_intent: s.creative_intent ?? undefined,
      director_notes: s.director_notes ?? undefined,
      film_reference: s.film_reference ?? undefined,
      performance_start: s.performance_start ?? undefined,
      performance_action: s.performance_action ?? undefined,
      sound_timing: s.sound_timing ?? undefined,
    }));

    const results: FixResult[] = [];

    if (sceneIndices && Array.isArray(sceneIndices)) {
      for (const idx of sceneIndices) {
        const scene = scenes[idx];
        if (!scene) continue;

        const issues = [`Scene ${idx} needs fixing based on audit report`];
        const fixResult = await fixSceneWithAI(scene, idx, issues, {});
        results.push(fixResult);

        if (fixResult.changesMade.length > 0) {
          const dbScene = dbScenes.find((s) => s.order_index === idx);
          if (dbScene) {
            dataStore.scene.update(dbScene.id, {
              description: fixResult.fixedScene.description,
              location: fixResult.fixedScene.location,
              time_weather: fixResult.fixedScene.time_weather,
              image_prompt: fixResult.fixedScene.image_prompt,
              shot_type: fixResult.fixedScene.shot_type,
              lighting_type: fixResult.fixedScene.lighting_type,
              emotion_curve: fixResult.fixedScene.emotion_curve,
              dialogue: fixResult.fixedScene.dialogue,
            });
          }
        }
      }

      return NextResponse.json({
        success: true,
        mode: "selective",
        results,
        message: `Fixed ${results.length} scene(s)`,
      });
    }

    if (autoFix) {
      let iteration = 0;
      let currentScenes = [...scenes];

      while (iteration < maxIterations) {
        iteration++;
        console.log(`Auto-fix iteration ${iteration}/${maxIterations}`);

        for (let i = 0; i < currentScenes.length; i++) {
          const scene = currentScenes[i];
          const issues = [`Auto-fix iteration ${iteration}`];
          const fixResult = await fixSceneWithAI(scene, i, issues, {});

          if (fixResult.changesMade.length > 0) {
            results.push(fixResult);
            currentScenes[i] = { ...scene, ...fixResult.fixedScene } as SceneDescription;

            const dbScene = dbScenes.find((s) => s.order_index === i);
            if (dbScene) {
              dataStore.scene.update(dbScene.id, {
                description: fixResult.fixedScene.description,
                location: fixResult.fixedScene.location,
                time_weather: fixResult.fixedScene.time_weather,
                image_prompt: fixResult.fixedScene.image_prompt,
                shot_type: fixResult.fixedScene.shot_type,
                lighting_type: fixResult.fixedScene.lighting_type,
                emotion_curve: fixResult.fixedScene.emotion_curve,
                dialogue: fixResult.fixedScene.dialogue,
              });
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        mode: "auto_fix",
        iteration,
        results,
        message: `Auto-fix complete after ${iteration} iteration(s). Fixed ${results.length} scene(s).`,
      });
    }

    return NextResponse.json(
      { error: "Please provide sceneIndices array or enable autoFix" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error fixing scenes:", error);
    return NextResponse.json(
      { error: "Failed to fix scenes" },
      { status: 500 }
    );
  }
}
