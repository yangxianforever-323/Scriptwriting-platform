/**
 * 镜头语言引擎
 * 专业影视镜头语言系统入口
 */

export * from "./types";
export * from "./shot-types";
export * from "./camera-movements";
export * from "./compositions";
export * from "./lighting";
export * from "./camera-angles";
export * from "./depth-of-field";
export * from "./prompt-builder";
export * from "./scene-analyzer";

// Export lists for UI components
export { SHOT_TYPE_LIST as shotTypes } from "./shot-types";
export { CAMERA_MOVEMENT_LIST as cameraMovements } from "./camera-movements";
export { CAMERA_ANGLE_LIST as cameraAngles } from "./camera-angles";
export { DEPTH_OF_FIELD_LIST as depthOfField } from "./depth-of-field";
export { COMPOSITION_LIST as compositions } from "./compositions";
export { LIGHTING_LIST as lightingTypes } from "./lighting";

import { analyzeScene, getOptimalConfiguration } from "./scene-analyzer";
import { generatePrompts, generateShotSequence } from "./prompt-builder";
import type {
  ShotConfiguration,
  GeneratedPrompt,
  SceneDescriptionInput,
  ShotAnalysis,
} from "./types";

export const ShotLanguageEngine = {
  analyzeScene,
  getOptimalConfiguration,
  generatePrompts,
  generateShotSequence,
  generateSequenceFromDescription: generateShotSequence,

  isAIAnalysisAvailable: (): boolean => !!process.env.VOLC_API_KEY,

  async analyzeSceneWithAI(
    input: SceneDescriptionInput
  ): Promise<{ analysis: ShotAnalysis; confidence: number; reasoning: string }> {
    const { analyzeSceneWithAI } = await import("./ai-analyzer");
    return analyzeSceneWithAI(input);
  },

  async generateShotSequenceWithAI(
    description: string,
    shotCount: number = 3,
    style?: string
  ): Promise<Array<{
    shotNumber: number;
    config: Partial<ShotConfiguration>;
    reasoning: string;
  }>> {
    const { generateShotSequenceWithAI } = await import("./ai-analyzer");
    return generateShotSequenceWithAI(description, shotCount, style);
  },

  generateShotFromDescription(
    description: string,
    options?: Partial<SceneDescriptionInput> & Partial<ShotConfiguration>
  ): {
    analysis: ShotAnalysis;
    config: ShotConfiguration;
    prompts: GeneratedPrompt;
  } {
    const input: SceneDescriptionInput = {
      description,
      mood: options?.mood,
      style: options?.style,
      characterCount: options?.characterCount,
      location: options?.location,
      timeOfDay: options?.timeOfDay,
      weather: options?.weather,
      customRequirements: options?.customRequirements,
    };

    const analysis = analyzeScene(input);
    const optimalConfig = getOptimalConfiguration(analysis);

    const config: ShotConfiguration = {
      shotType: options?.shotType ?? optimalConfig.shotType,
      cameraMovement: options?.cameraMovement ?? optimalConfig.cameraMovement,
      composition: options?.composition ?? optimalConfig.composition,
      lighting: options?.lighting ?? optimalConfig.lighting,
      cameraAngle: options?.cameraAngle ?? optimalConfig.cameraAngle,
      depthOfField: options?.depthOfField ?? optimalConfig.depthOfField,
      duration: options?.duration ?? optimalConfig.duration,
    };

    const prompts = generatePrompts(description, config, input);

    return {
      analysis,
      config,
      prompts,
    };
  },

  async generateSmartSequenceFromDescription(
    description: string,
    shotCount: number = 3,
    style?: string
  ): Promise<Array<{
    shotNumber: number;
    config: Partial<ShotConfiguration>;
    prompts: GeneratedPrompt;
    reasoning?: string;
    useAI: boolean;
  }>> {
    if (process.env.VOLC_API_KEY) {
      try {
        const { generateShotSequenceWithAI } = await import("./ai-analyzer");
        const aiResults = await generateShotSequenceWithAI(description, shotCount, style);

        return aiResults.map((result) => ({
          shotNumber: result.shotNumber,
          config: result.config,
          prompts: generatePrompts(description, result.config, { description, style }),
          reasoning: result.reasoning,
          useAI: true,
        }));
      } catch (error) {
        console.warn("AI analysis failed, falling back to rule-based:", error);
      }
    }

    const ruleBasedResults = generateShotSequence(description, shotCount, style);

    return ruleBasedResults.map((result) => ({
      ...result,
      useAI: false,
    }));
  },
};

export default ShotLanguageEngine;
