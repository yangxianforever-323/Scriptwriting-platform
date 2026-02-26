/**
 * Project list data access using local file storage.
 */

import { localDb } from "./local-db";
import type { Project } from "@/types/database";

export interface ProjectWithPreview extends Project {
  preview_image_url: string | null;
  scene_count: number;
}

export async function getProjectsWithPreview(
  userId: string | null,
  options: {
    page?: number;
    limit?: number;
  } = {}
): Promise<{ projects: ProjectWithPreview[]; total: number }> {
  try {
    const result = localDb.getProjects(userId, options);
    const projects = result.projects;

    const projectsWithPreview: ProjectWithPreview[] = projects.map((project) => {
      const scenes = localDb.getScenesByProjectId(project.id);
      const firstScene = scenes[0];
      let previewImageUrl: string | null = null;

      if (firstScene) {
        const images = localDb.getImagesBySceneId(firstScene.id);
        if (images.length > 0) {
          previewImageUrl = images[0].url;
        }
      }

      return {
        ...project,
        preview_image_url: previewImageUrl,
        scene_count: scenes.length,
      } as ProjectWithPreview;
    });

    return {
      projects: projectsWithPreview,
      total: result.total,
    };
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw new Error("Failed to fetch projects");
  }
}
