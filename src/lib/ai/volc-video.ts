/**
 * Volcano Engine Video Generation API wrapper.
 * Handles video generation using Doubao Seedance model (image/text-to-video).
 * API: https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks
 * Docs: https://www.volcengine.com/docs/82379/1520757
 */

// Configuration
const VOLC_API_KEY = process.env.VOLC_API_KEY;
const VOLC_VIDEO_TASKS_URL =
  process.env.VOLC_VIDEO_TASKS_URL ||
  "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks";

// Default model — new Seedance 2.0
export const VOLC_VIDEO_MODEL_DEFAULT = "doubao-seedance-2-0-260128";
// Legacy model (kept for backward compatibility)
export const VOLC_VIDEO_MODEL_LEGACY = "doubao-seedance-1-5-pro-251215";

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const REQUEST_TIMEOUT_MS = 60000; // 1 minute

/**
 * Custom error class for Volcano Engine Video API errors
 */
export class VolcVideoApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string
  ) {
    super(message);
    this.name = "VolcVideoApiError";
  }
}

/** Video task status enum */
export type VideoTaskStatus = "pending" | "processing" | "completed" | "failed";

/** Role for reference content items */
export type ContentRole = "reference_image" | "reference_video" | "reference_audio";

/** A single content item in the request */
export type ContentItem =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string }; role?: ContentRole }
  | { type: "video_url"; video_url: { url: string }; role?: ContentRole }
  | { type: "audio_url"; audio_url: { url: string }; role?: ContentRole };

/** Options for creating a video task */
export interface CreateVideoTaskOptions {
  /** Duration in seconds (e.g. 5, 8, 11) */
  duration?: number;
  /** Whether to add watermark */
  watermark?: boolean;
  /** Whether to generate audio (background music / SFX) */
  generateAudio?: boolean;
  /** Aspect ratio, e.g. "16:9", "9:16", "1:1" */
  ratio?: string;
  /** Reference images (will be sent as reference_image role) */
  referenceImageUrls?: string[];
  /** Reference video URL */
  referenceVideoUrl?: string;
  /** Reference audio URL */
  referenceAudioUrl?: string;
  /** Model to use (defaults to VOLC_VIDEO_MODEL_DEFAULT) */
  model?: string;
}

/** Result of video generation task creation */
export interface VideoTaskResult {
  taskId: string;
  status: VideoTaskStatus;
}

/** Result of video task status query */
export interface VideoStatusResult {
  taskId: string;
  status: VideoTaskStatus;
  progress?: number;
  videoUrl?: string;
  errorMessage?: string;
}

/** Create task response */
interface CreateTaskResponse {
  id: string;
  status?: string;
  error?: { message: string; type: string; code: string };
}

/** Get task status response */
interface GetTaskResponse {
  id: string;
  status: string;
  content?: { video_url?: string };
  output?: { url?: string; duration?: number };
  error?: { message: string; type: string; code: string };
}

/** Sleep utility for retry delays */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Check if the API credentials are configured */
export function isVolcVideoConfigured(): boolean {
  return !!VOLC_API_KEY;
}

/**
 * Create a video generation task.
 *
 * Supports two modes:
 * - Simple: provide `imageUrl` + `prompt` (backward compatible)
 * - Full: provide `contentItems` for complete control over reference images/video/audio
 *
 * @param promptOrContent - Text prompt string, or full ContentItem[] array
 * @param options - Additional generation options
 */
export async function createVideoTask(
  promptOrContent: string | ContentItem[],
  imageUrlOrOptions?: string | CreateVideoTaskOptions,
  options: CreateVideoTaskOptions = {}
): Promise<VideoTaskResult> {
  if (!isVolcVideoConfigured()) {
    throw new VolcVideoApiError(
      "Volcano Engine video generation is not configured. Please set VOLC_API_KEY."
    );
  }

  // Resolve overloaded arguments
  let contentItems: ContentItem[];
  let opts: CreateVideoTaskOptions;

  if (Array.isArray(promptOrContent)) {
    // Called as createVideoTask(contentItems, options?)
    contentItems = promptOrContent;
    opts = (imageUrlOrOptions as CreateVideoTaskOptions) || options;
  } else if (typeof imageUrlOrOptions === "string") {
    // Called as createVideoTask(imageUrl, prompt, options?)  — legacy signature
    // imageUrlOrOptions is actually the imageUrl, promptOrContent is the prompt
    const imageUrl = imageUrlOrOptions;
    const prompt = promptOrContent;
    opts = options;
    contentItems = buildContentItems(prompt, imageUrl, opts);
  } else {
    // Called as createVideoTask(prompt, options?)
    const prompt = promptOrContent;
    opts = (imageUrlOrOptions as CreateVideoTaskOptions) || options;
    contentItems = buildContentItems(prompt, undefined, opts);
  }

  const model = opts.model || VOLC_VIDEO_MODEL_DEFAULT;
  const duration = opts.duration ?? 5;
  const watermark = opts.watermark ?? false;
  const generateAudio = opts.generateAudio ?? false;
  const ratio = opts.ratio ?? "16:9";

  const requestBody: Record<string, unknown> = {
    model,
    content: contentItems,
    duration,
    watermark,
    ratio,
  };

  // Only include generate_audio when explicitly set (avoids billing surprises)
  if (generateAudio) {
    requestBody.generate_audio = true;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(VOLC_VIDEO_TASKS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${VOLC_API_KEY}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      const data: CreateTaskResponse = await response.json();

      if (data.error) {
        throw new VolcVideoApiError(
          data.error.message || `API error: ${data.error.code}`,
          response.status,
          data.error.code
        );
      }

      if (!response.ok) {
        throw new VolcVideoApiError(`HTTP error: ${response.status}`, response.status);
      }

      if (!data.id) {
        throw new VolcVideoApiError("No task ID in response");
      }

      clearTimeout(timeoutId);
      return {
        taskId: data.id,
        status: (data.status as VideoTaskStatus) || "pending",
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      if (error instanceof VolcVideoApiError && error.errorCode === "authentication_error") {
        throw error;
      }
      if ((error as Error).name === "AbortError") {
        throw new VolcVideoApiError("Request timed out");
      }
      if (attempt < MAX_RETRIES) {
        console.warn(`Volc Video API attempt ${attempt} failed, retrying...`, error);
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  clearTimeout(timeoutId);
  throw new VolcVideoApiError(
    `Failed after ${MAX_RETRIES} attempts: ${lastError?.message}`
  );
}

/**
 * Query the status of a video generation task.
 */
export async function getVideoTaskStatus(taskId: string): Promise<VideoStatusResult> {
  if (!isVolcVideoConfigured()) {
    throw new VolcVideoApiError(
      "Volcano Engine video generation is not configured. Please set VOLC_API_KEY."
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${VOLC_VIDEO_TASKS_URL}/${taskId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${VOLC_API_KEY}`,
        },
        signal: controller.signal,
      });

      const data: GetTaskResponse = await response.json();

      if (data.error) {
        return { taskId: data.id, status: "failed", errorMessage: data.error.message };
      }

      if (!response.ok) {
        throw new VolcVideoApiError(`HTTP error: ${response.status}`, response.status);
      }

      clearTimeout(timeoutId);
      console.log(`Video task ${taskId} raw status:`, data.status);

      let status: VideoTaskStatus = "pending";
      const s = (data.status || "").toUpperCase();
      if (s === "RUNNING" || s === "PROCESSING") status = "processing";
      else if (s === "SUCCESS" || s === "SUCCEEDED" || s === "COMPLETED") status = "completed";
      else if (s === "FAILED" || s === "CANCELLED") status = "failed";

      const videoUrl = data.content?.video_url || data.output?.url;

      return { taskId: data.id, status, videoUrl };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error");

      if (error instanceof VolcVideoApiError && error.errorCode === "authentication_error") {
        throw error;
      }
      if ((error as Error).name === "AbortError") {
        throw new VolcVideoApiError("Request timed out");
      }
      if (attempt < MAX_RETRIES) {
        console.warn(`Volc Video Status API attempt ${attempt} failed, retrying...`, error);
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  clearTimeout(timeoutId);
  throw new VolcVideoApiError(
    `Failed after ${MAX_RETRIES} attempts: ${lastError?.message}`
  );
}

/**
 * Wait for a video task to complete (server-side polling).
 */
export async function waitForVideoTask(
  taskId: string,
  options: {
    pollIntervalMs?: number;
    maxWaitMs?: number;
    onProgress?: (status: string) => void;
  } = {}
): Promise<VideoStatusResult> {
  const pollInterval = options.pollIntervalMs ?? 5000;
  const maxWait = options.maxWaitMs ?? 600000;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWait) {
    const status = await getVideoTaskStatus(taskId);

    if (options.onProgress) options.onProgress(status.status);

    if (status.status === "completed") return status;
    if (status.status === "failed") {
      throw new VolcVideoApiError(status.errorMessage || "Video generation failed");
    }

    await sleep(pollInterval);
  }

  throw new VolcVideoApiError(
    `Video generation timed out after ${maxWait / 1000} seconds`
  );
}

/**
 * Download a video from URL and return as Buffer.
 */
export async function downloadVideo(videoUrl: string): Promise<Buffer> {
  const response = await fetch(videoUrl);
  if (!response.ok) {
    throw new VolcVideoApiError(`Failed to download video: ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

// ─────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────

/**
 * Build a ContentItem[] from a simple prompt + optional imageUrl + options.
 */
function buildContentItems(
  prompt: string,
  imageUrl?: string,
  opts: CreateVideoTaskOptions = {}
): ContentItem[] {
  const items: ContentItem[] = [];

  if (prompt) {
    items.push({ type: "text", text: prompt });
  }

  // Primary image (first-frame reference)
  if (imageUrl) {
    items.push({
      type: "image_url",
      image_url: { url: imageUrl },
      role: "reference_image",
    });
  }

  // Extra reference images
  for (const url of opts.referenceImageUrls || []) {
    items.push({
      type: "image_url",
      image_url: { url },
      role: "reference_image",
    });
  }

  // Reference video
  if (opts.referenceVideoUrl) {
    items.push({
      type: "video_url",
      video_url: { url: opts.referenceVideoUrl },
      role: "reference_video",
    });
  }

  // Reference audio
  if (opts.referenceAudioUrl) {
    items.push({
      type: "audio_url",
      audio_url: { url: opts.referenceAudioUrl },
      role: "reference_audio",
    });
  }

  return items;
}
