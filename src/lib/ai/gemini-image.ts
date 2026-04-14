
/**
 * VectorEngine Image Generation API wrapper.
 * Uses /v1/chat/completions endpoint for image generation.
 * Reference: D:\Trae_project\Design-main\src\services\ai.ts
 */

const VECTOR_ENGINE_API_KEY = process.env.GEMINI_API_KEY || "sk-hRBF4qgq2Y4ZPlWKBSQyIHIWNHK1R9JVcGvY466R5u7xXEBA";
const VECTOR_ENGINE_BASE_URL = process.env.GEMINI_BASE_URL || "https://api.vectorengine.ai";
const DEFAULT_MODEL = "gemini-3.1-flash-image-preview";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 10000;
const REQUEST_TIMEOUT_MS = 180000;
const CONNECT_TIMEOUT_MS = 30000;

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

function calculateSize(aspectRatio?: string, resolution?: string) {
  let width = 1024;
  let height = 1024;

  if (resolution) {
    switch (resolution) {
      case "1K":
        width = 1024;
        height = 1024;
        break;
      case "2K":
        width = 1792;
        height = 1024;
        break;
      case "4K":
        width = 2048;
        height = 1536;
        break;
      case "8K":
        width = 3072;
        height = 2048;
        break;
    }
  }

  if (aspectRatio && aspectRatio !== "custom") {
    switch (aspectRatio) {
      case "1:1":
        height = width;
        break;
      case "16:9":
        height = Math.round(width * 9 / 16);
        break;
      case "9:16": {
        const tempHeight = height;
        height = width;
        width = tempHeight;
        break;
      }
      case "4:3":
        height = Math.round(width * 3 / 4);
        break;
    }
  }

  return { width, height };
}

export async function generateImage(
  prompt: string,
  options: {
    style?: string;
    type?: "character" | "location" | "prop" | "scene";
    aspectRatio?: string;
    resolution?: string;
    n?: number;
    model?: string;
    referenceImages?: string[];
  } = {}
): Promise<string[]> {
  if (!isGeminiConfigured()) {
    throw new GeminiImageApiError("Image generation is not configured. Please set GEMINI_API_KEY.");
  }

  const stylePrompt = buildStylePrompt(options.style, options.type);
  const { width, height } = calculateSize(options.aspectRatio, options.resolution);
  const fullPrompt = `${prompt}${stylePrompt}`;

  console.log("Image generation request:", {
    model: options.model || DEFAULT_MODEL,
    promptLength: fullPrompt.length,
    width,
    height,
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const messages: any[] = [];

      const systemPrompt = `You are a professional image generation AI.

CRITICAL RULES - MUST FOLLOW EXACTLY:
1. Generate the requested image with high quality
2. Pay attention to all details in the prompt
3. Do NOT add any text or watermarks to the image
4. Return ONLY the image data, no additional text`;

      messages.push({
        role: "system",
        content: systemPrompt,
      });

      const userContent: any[] = [];

      if (options.referenceImages && options.referenceImages.length > 0) {
        options.referenceImages.forEach((img) => {
          userContent.push({
            type: "image_url",
            image_url: { url: img },
          });
        });
      }

      const sizeRequirements = `EXACT IMAGE SIZE: ${width}x${height} pixels. DO NOT DEVIATE FROM THIS SIZE.`;
      userContent.push({
        type: "text",
        text: `${fullPrompt}\n\n${sizeRequirements}`,
      });

      messages.push({
        role: "user",
        content: userContent,
      });

      const response = await (() => {
        const attemptController = new AbortController();
        const attemptTimeoutId = setTimeout(() => attemptController.abort(), REQUEST_TIMEOUT_MS);
        
        return fetch(`${VECTOR_ENGINE_BASE_URL}/v1/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${VECTOR_ENGINE_API_KEY}`,
          },
          body: JSON.stringify({
            model: options.model || DEFAULT_MODEL,
            messages: messages,
            max_tokens: 4096,
          }),
          signal: attemptController.signal,
        }).then((res) => {
          clearTimeout(attemptTimeoutId);
          return res;
        }).catch((error) => {
          clearTimeout(attemptTimeoutId);
          if (error instanceof Error && error.name === "AbortError") {
            throw new Error("Request timed out");
          }
          throw error;
        });
      })();

      const data = await response.json();

      console.log(`Image generation attempt ${attempt} status:`, response.status);

      if (!response.ok) {
        throw new GeminiImageApiError(
          `HTTP error: ${response.status} - ${JSON.stringify(data)}`,
          response.status
        );
      }

      const content = data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new GeminiImageApiError("No content in response");
      }

      clearTimeout(timeoutId);

      const images: string[] = [];

      if (content.startsWith("data:image/")) {
        const fullDataUrlMatch = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
        if (fullDataUrlMatch) {
          images.push(fullDataUrlMatch[0]);
        }
      }

      const base64Match = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
      if (base64Match && images.length === 0) {
        images.push(base64Match[0]);
      }

      const pureBase64Match = content.match(/^[A-Za-z0-9+/=]{100,}/);
      if (pureBase64Match && images.length === 0) {
        images.push(`data:image/png;base64,${pureBase64Match[0]}`);
      }

      if (images.length === 0) {
        console.log("Response content:", content.slice(0, 500));
        if (attempt < MAX_RETRIES) {
          console.warn(`Attempt ${attempt} returned text instead of image, retrying...`);
          await sleep(RETRY_DELAY_MS * attempt);
          continue;
        }
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
    aspectRatio?: string;
    resolution?: string;
  } = {}
): Promise<Array<{ view: string; imageData: string }>> {
  const views = options.views || ["front"];
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
        aspectRatio: options.aspectRatio || "3:4",
        resolution: options.resolution || "2K",
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
    aspectRatio?: string;
    resolution?: string;
  } = {}
): Promise<string> {
  const prompt = `场景名称：${locationName}
环境描述：${description}
${atmosphere ? `氛围特点：${atmosphere}\n` : ""}高质量场景设计图，用于影视制作参考，展示完整的空间布局和环境细节`;

  const images = await generateImage(prompt, {
    style: options.style || "cinematic",
    type: "location",
    aspectRatio: options.aspectRatio || "16:9",
    resolution: options.resolution || "2K",
  });

  return images[0];
}

export async function generatePropImage(
  propName: string,
  description: string,
  importance?: string,
  options: {
    style?: string;
    aspectRatio?: string;
    resolution?: string;
  } = {}
): Promise<string> {
  const prompt = `道具名称：${propName}
道具描述：${description}
${importance ? `重要程度/用途：${importance}\n` : ""}高质量道具设计图，用于影视制作参考，清晰展示道具的材质、形状和细节`;

  const images = await generateImage(prompt, {
    style: options.style || "realistic",
    type: "prop",
    aspectRatio: options.aspectRatio || "1:1",
    resolution: options.resolution || "2K",
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
    aspectRatio?: string;
    resolution?: string;
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
    aspectRatio: options.aspectRatio || "16:9",
    resolution: options.resolution || "2K",
  });

  return images[0];
}

export async function regenerateImage(
  prompt: string,
  options: {
    style?: string;
    type?: "character" | "location" | "prop" | "scene";
    aspectRatio?: string;
    resolution?: string;
  } = {}
): Promise<string[]> {
  return generateImage(prompt, options);
}

export async function generateImageWithStyle(
  basePrompt: string,
  options: {
    style?: string;
    type?: "character" | "location" | "prop" | "scene";
    aspectRatio?: string;
    resolution?: string;
    referenceImages?: string[];
    customStyleSuffix?: string;
  } = {}
): Promise<string[]> {
  const stylePrompt = buildStylePrompt(options.style, options.type);
  const customSuffix = options.customStyleSuffix || "";

  const fullPrompt = `${basePrompt}${stylePrompt}${customSuffix ? `. ${customSuffix}` : ""}`;

  return generateImage(fullPrompt, {
    style: options.style,
    type: options.type,
    aspectRatio: options.aspectRatio,
    resolution: options.resolution,
    referenceImages: options.referenceImages,
  });
}
