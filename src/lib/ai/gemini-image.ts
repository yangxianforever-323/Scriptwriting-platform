/**
 * VectorEngine Image Generation API wrapper.
 * Uses /v1/chat/completions endpoint for image generation.
 * Reference: D:\Trae_project\Design-main\backend\src\api\api.service.ts
 */

const VECTOR_ENGINE_API_KEY = process.env.GEMINI_API_KEY || "sk-hRBF4qgq2Y4ZPlWKBSQyIHIWNHK1R9JVcGvY466R5u7xXEBA";
const VECTOR_ENGINE_BASE_URL = process.env.GEMINI_BASE_URL || "https://api.vectorengine.ai";
const DEFAULT_MODEL = "gemini-3.1-flash-image-preview";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const REQUEST_TIMEOUT_MS = 120000;

export class GeminiImageApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string
  ) {
    super(message);
    this.name = "GeminiImageApiError";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isGeminiConfigured(): boolean {
  return !!VECTOR_ENGINE_API_KEY;
}

function buildStylePrompt(style?: string, type?: "character" | "location" | "prop" | "scene"): string {
  const basePrompts: Record<string, string> = {
    realistic: ", photorealistic, high quality, natural lighting, sharp details, professional photography",
    anime: ", anime style, vibrant colors, clean lines, Japanese animation style",
    cartoon: ", cartoon style, bright colors, playful, exaggerated features",
    cinematic: ", cinematic, dramatic lighting, film grain, professional cinematography, movie still",
    watercolor: ", watercolor painting style, soft edges, delicate colors, artistic illustration",
    oil_painting: ", oil painting style, thick brushstrokes, rich colors, classical art",
    sketch: ", pencil sketch style, detailed linework, grayscale, artistic drawing",
    cyberpunk: ", cyberpunk style, neon lights, futuristic, dark atmosphere, tech aesthetic",
    fantasy: ", fantasy style, magical elements, ethereal, dreamlike, mystical",
    scifi: ", sci-fi style, futuristic, high-tech, space age, advanced technology",
  };

  const typePrompts: Record<string, string> = {
    character: ", character design, full body or portrait, detailed facial features, expressive",
    location: ", environment design, architectural details, atmospheric perspective, immersive background",
    prop: ", object photography, product shot, detailed texture, studio lighting, centered composition",
    scene: ", cinematic scene, storytelling composition, mood and atmosphere, narrative moment",
  };

  let result = basePrompts[style ?? "realistic"] || basePrompts.realistic;

  if (type && typePrompts[type]) {
    result += typePrompts[type];
  }

  return result;
}

export async function generateImage(
  prompt: string,
  options: {
    style?: string;
    type?: "character" | "location" | "prop" | "scene";
    size?: "256x256" | "512x512" | "1024x1024" | "1024x1536" | "1536x1024" | "HD(1024*1536)";
    n?: number;
    model?: string;
  } = {}
): Promise<string[]> {
  if (!isGeminiConfigured()) {
    throw new GeminiImageApiError("Image generation is not configured. Please set GEMINI_API_KEY.");
  }

  const stylePrompt = buildStylePrompt(options.style, options.type);
  const fullPrompt = `${prompt}${stylePrompt}`;

  console.log("Image generation request:", {
    model: options.model || DEFAULT_MODEL,
    promptLength: fullPrompt.length,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${VECTOR_ENGINE_BASE_URL}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${VECTOR_ENGINE_API_KEY}`,
        },
        body: JSON.stringify({
          model: options.model || DEFAULT_MODEL,
          messages: [
            { role: "user", content: fullPrompt },
          ],
        }),
        signal: controller.signal,
      });

      const data = await response.json();

      console.log(`Image generation attempt ${attempt} status:`, response.status);

      if (!response.ok) {
        throw new GeminiImageApiError(
          `HTTP error: ${response.status} - ${JSON.stringify(data)}`,
          response.status
        );
      }

      const choice = data?.choices?.[0];
      if (!choice) {
        throw new GeminiImageApiError("No choice in response");
      }

      clearTimeout(timeoutId);

      const images: string[] = [];

      if (choice.message?.content && typeof choice.message.content === "string") {
        const base64Match = choice.message.content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
        if (base64Match) {
          images.push(base64Match[0]);
        }
      }

      if (Array.isArray(choice.message?.content)) {
        for (const part of choice.message.content) {
          if (part.type === "image_url") {
            images.push(part.image_url?.url || "");
          }
        }
      }

      if (images.length === 0) {
        console.log("Response data:", JSON.stringify(data).slice(0, 500));
        throw new GeminiImageApiError("No image found in response");
      }

      return images;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      if (error instanceof GeminiImageApiError && (
        error.statusCode === 401 ||
        error.statusCode === 403 ||
        error.errorCode === "authentication_error"
      )) {
        clearTimeout(timeoutId);
        throw error;
      }

      if ((error as Error).name === "AbortError") {
        clearTimeout(timeoutId);
        throw new GeminiImageApiError("Request timed out");
      }

      if (attempt < MAX_RETRIES) {
        console.warn(`Image API attempt ${attempt} failed, retrying...`, error);
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  clearTimeout(timeoutId);
  throw new GeminiImageApiError(
    `Failed after ${MAX_RETRIES} attempts: ${lastError?.message}`
  );
}

export async function generateCharacterImages(
  characterName: string,
  appearance: string,
  personality?: string,
  options: {
    views?: ("front" | "side" | "back" | "three_quarter" | "close_up")[];
    style?: string;
  } = {}
): Promise<Array<{ view: string; imageData: string }>> {
  const views = options.views || ["front", "side", "back", "three_quarter", "close_up"];
  const viewDescriptions: Record<string, string> = {
    front: "正面全身像，直视镜头，完整展示角色外观和服装",
    side: "侧面全身像，展示角色轮廓和侧面特征",
    back: "背面全身像，展示角色背面造型和服装细节",
    three_quarter: "四分之三角度半身像，展示角色立体感和表情",
    close_up: "面部特写，详细展示角色五官、表情和神态特征",
  };

  const results: Array<{ view: string; imageData: string }> = [];

  for (const view of views) {
    const viewDesc = viewDescriptions[view] || view;
    const prompt = `角色名称：${characterName}
外貌描述：${appearance}
${personality ? `性格特点：${personality}\n` : ""}视角要求：${viewDesc}
高质量角色设计图，用于影视制作参考`;

    try {
      const images = await generateImage(prompt, {
        style: options.style || "realistic",
        type: "character",
        n: 1,
      });

      results.push({
        view,
        imageData: images[0],
      });
    } catch (error) {
      console.error(`Failed to generate ${view} view for ${characterName}:`, error);
      throw error;
    }
  }

  return results;
}

export async function generateLocationImage(
  locationName: string,
  description: string,
  atmosphere?: string,
  options: {
    style?: string;
  } = {}
): Promise<string> {
  const prompt = `场景名称：${locationName}
环境描述：${description}
${atmosphere ? `氛围特点：${atmosphere}\n` : ""}高质量场景设计图，用于影视制作参考，展示完整的空间布局和环境细节`;

  const images = await generateImage(prompt, {
    style: options.style || "cinematic",
    type: "location",
  });

  return images[0];
}

export async function generatePropImage(
  propName: string,
  description: string,
  importance?: string,
  options: {
    style?: string;
  } = {}
): Promise<string> {
  const prompt = `道具名称：${propName}
道具描述：${description}
${importance ? `重要程度/用途：${importance}\n` : ""}高质量道具设计图，用于影视制作参考，清晰展示道具的材质、形状和细节`;

  const images = await generateImage(prompt, {
    style: options.style || "realistic",
    type: "prop",
  });

  return images[0];
}

export async function generateSceneImage(
  sceneDescription: string,
  characters?: string[],
  location?: string,
  props?: string[],
  mood?: string,
  options: {
    style?: string;
    shotType?: string;
  } = {}
): Promise<string> {
  let prompt = sceneDescription;

  if (characters && characters.length > 0) {
    prompt += `\n场景中的角色：${characters.join("、")}`;
  }

  if (location) {
    prompt += `\n场景地点：${location}`;
  }

  if (props && props.length > 0) {
    prompt += `\n场景中的道具：${props.join("、")}`;
  }

  if (mood) {
    prompt += `\n情绪氛围：${mood}`;
  }

  if (options.shotType) {
    const shotTypes: Record<string, string> = {
      EWS: "极远景，展示宏大环境和空间关系",
      LS: "远景，建立场景环境",
      FS: "全景，展示人物与环境的关系",
      MS: "中景，展示人物上半身和动作",
      MCU: "中近景，聚焦人物胸部以上",
      CU: "特写，聚焦人物面部或重要细节",
      ECU: "极特写，极端细节展示",
    };
    prompt += `\n镜头类型：${shotTypes[options.shotType] || options.shotType}`;
  }

  prompt += "\n高质量电影分镜参考图，专业影视制作级别";

  const images = await generateImage(prompt, {
    style: options.style || "cinematic",
    type: "scene",
  });

  return images[0];
}

export async function regenerateImage(
  prompt: string,
  options: {
    style?: string;
    type?: "character" | "location" | "prop" | "scene";
    size?: string;
  } = {}
): Promise<string[]> {
  return generateImage(prompt, options);
}
