/**
 * Media data access layer using local file storage.
 * Handles CRUD and storage operations for images and videos.
 */

import { localDb } from "./local-db";
import type { Image, Video } from "@/types/database";
import fs from "fs";
import path from "path";

const MEDIA_DIR = path.join(process.cwd(), "data", "media");

function ensureMediaDir() {
  if (!fs.existsSync(MEDIA_DIR)) {
    fs.mkdirSync(MEDIA_DIR, { recursive: true });
  }
}

export class MediaError extends Error {
  constructor(
    message: string,
    public code: "not_found" | "unauthorized" | "storage_error" | "database_error"
  ) {
    super(message);
    this.name = "MediaError";
  }
}

export async function createImage(
  sceneId: string,
  storagePath: string,
  url: string,
  options: { width?: number; height?: number } = {}
): Promise<Image> {
  const image = localDb.createImage(sceneId, storagePath, url, options.width, options.height);
  return image as Image;
}

export async function getImagesBySceneId(sceneId: string): Promise<Image[]> {
  return localDb.getImagesBySceneId(sceneId) as Image[];
}

export async function getLatestImageBySceneId(sceneId: string): Promise<Image | null> {
  const images = localDb.getImagesBySceneId(sceneId);
  return images.length > 0 ? (images[0] as Image) : null;
}

export async function getImageById(imageId: string): Promise<Image> {
  const data = localDb["loadData"]();
  const image = data.images.find((img) => img.id === imageId);
  if (!image) {
    throw new MediaError("Image not found", "not_found");
  }
  return image as Image;
}

export async function deleteImagesBySceneId(sceneId: string): Promise<number> {
  const data = localDb["loadData"]();
  const count = data.images.filter((img) => img.scene_id === sceneId).length;
  data.images = data.images.filter((img) => img.scene_id !== sceneId);
  localDb["saveData"](data);
  return count;
}

export async function createVideo(
  sceneId: string,
  storagePath: string,
  url: string,
  options: { duration?: number; taskId?: string } = {}
): Promise<Video> {
  const video = localDb.createVideo(sceneId, storagePath, url, options.taskId, options.duration);
  return video as Video;
}

export async function updateVideoTaskId(
  videoId: string,
  taskId: string
): Promise<Video> {
  const video = localDb.updateVideo(videoId, { task_id: taskId });
  if (!video) {
    throw new MediaError("Video not found", "not_found");
  }
  return video as Video;
}

export async function createProcessingVideo(
  sceneId: string,
  taskId: string
): Promise<Video> {
  const video = localDb.createVideo(sceneId, "", "", taskId);
  return video as Video;
}

export async function updateCompletedVideo(
  videoId: string,
  storagePath: string,
  url: string,
  options: { duration?: number } = {}
): Promise<Video> {
  const video = localDb.updateVideo(videoId, {
    storage_path: storagePath,
    url,
    duration: options.duration ?? null,
  });
  if (!video) {
    throw new MediaError("Video not found", "not_found");
  }
  return video as Video;
}

export async function getLatestVideoBySceneIdWithTask(
  sceneId: string
): Promise<Video | null> {
  const videos = localDb.getVideosBySceneId(sceneId);
  return videos.length > 0 ? (videos[0] as Video) : null;
}

export async function getVideosBySceneId(sceneId: string): Promise<Video[]> {
  return localDb.getVideosBySceneId(sceneId) as Video[];
}

export async function getLatestVideoBySceneId(sceneId: string): Promise<Video | null> {
  const videos = localDb.getVideosBySceneId(sceneId);
  return videos.length > 0 ? (videos[0] as Video) : null;
}

export async function getVideoById(videoId: string): Promise<Video> {
  const data = localDb["loadData"]();
  const video = data.videos.find((v) => v.id === videoId);
  if (!video) {
    throw new MediaError("Video not found", "not_found");
  }
  return video as Video;
}

export async function deleteVideosBySceneId(sceneId: string): Promise<number> {
  const data = localDb["loadData"]();
  const count = data.videos.filter((vid) => vid.scene_id === sceneId).length;
  data.videos = data.videos.filter((vid) => vid.scene_id !== sceneId);
  localDb["saveData"](data);
  return count;
}

export async function getSignedUrl(
  storagePath: string,
  expiresIn: number = 3600
): Promise<string> {
  if (!storagePath) {
    return "";
  }
  ensureMediaDir();
  const fullPath = path.join(MEDIA_DIR, storagePath);
  if (fs.existsSync(fullPath)) {
    return `/api/storage/file?path=${encodeURIComponent(storagePath)}`;
  }
  return "";
}

export async function getSignedUrls(
  storagePaths: string[],
  expiresIn: number = 3600
): Promise<Map<string, string>> {
  const urlMap = new Map<string, string>();
  for (const storagePath of storagePaths) {
    const url = await getSignedUrl(storagePath, expiresIn);
    urlMap.set(storagePath, url);
  }
  return urlMap;
}

export async function uploadFile(
  userId: string,
  projectId: string,
  fileName: string,
  file: Buffer | Blob,
  options: {
    contentType?: string;
    upsert?: boolean;
  } = {}
): Promise<{ path: string; url: string }> {
  ensureMediaDir();
  const storagePath = `${userId}/${projectId}/${fileName}`;
  const fullPath = path.join(MEDIA_DIR, storagePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const buffer = file instanceof Blob ? Buffer.from(await file.arrayBuffer()) : file;
  fs.writeFileSync(fullPath, buffer);
  const url = await getSignedUrl(storagePath);
  return { path: storagePath, url };
}

export async function uploadAndCreateImage(
  userId: string,
  projectId: string,
  sceneId: string,
  fileName: string,
  imageData: Buffer | string,
  options: {
    width?: number;
    height?: number;
    contentType?: string;
  } = {}
): Promise<Image> {
  const buffer =
    typeof imageData === "string"
      ? Buffer.from(imageData, "base64")
      : imageData;

  const { path, url } = await uploadFile(userId, projectId, fileName, buffer, {
    contentType: options.contentType ?? "image/png",
  });

  return createImage(sceneId, path, url, {
    width: options.width,
    height: options.height,
  });
}

export async function uploadAndCreateVideo(
  userId: string,
  projectId: string,
  sceneId: string,
  fileName: string,
  videoData: Buffer,
  options: {
    duration?: number;
    taskId?: string;
    contentType?: string;
  } = {}
): Promise<Video> {
  const { path, url } = await uploadFile(userId, projectId, fileName, videoData, {
    contentType: options.contentType ?? "video/mp4",
  });

  return createVideo(sceneId, path, url, {
    duration: options.duration,
    taskId: options.taskId,
  });
}

export async function deleteFile(storagePath: string): Promise<void> {
  if (!storagePath) return;
  ensureMediaDir();
  const fullPath = path.join(MEDIA_DIR, storagePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
}

export async function deleteProjectFiles(
  userId: string,
  projectId: string
): Promise<void> {
  ensureMediaDir();
  const folderPath = path.join(MEDIA_DIR, userId, projectId);
  if (fs.existsSync(folderPath)) {
    fs.rmSync(folderPath, { recursive: true, force: true });
  }
}

export async function deleteOldSceneImages(sceneId: string): Promise<void> {
  const images = await getImagesBySceneId(sceneId);
  for (const image of images) {
    if (image.storage_path) {
      await deleteFile(image.storage_path);
    }
  }
  await deleteImagesBySceneId(sceneId);
}

export async function deleteOldSceneVideos(sceneId: string): Promise<void> {
  const videos = await getVideosBySceneId(sceneId);
  for (const video of videos) {
    if (video.storage_path) {
      await deleteFile(video.storage_path);
    }
  }
  await deleteVideosBySceneId(sceneId);
}

export async function getMediaBySceneId(sceneId: string): Promise<{
  images: Image[];
  videos: Video[];
}> {
  const [images, videos] = await Promise.all([
    getImagesBySceneId(sceneId),
    getVideosBySceneId(sceneId),
  ]);

  return { images, videos };
}

export async function downloadAndUpload(
  url: string,
  userId: string,
  projectId: string,
  fileName: string
): Promise<{ path: string; url: string }> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new MediaError(`Failed to download file: ${response.status}`, "storage_error");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") ?? undefined;

  return uploadFile(userId, projectId, fileName, buffer, { contentType });
}
