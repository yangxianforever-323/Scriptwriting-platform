/**
 * Project data access layer using local file storage.
 */

import { localDb } from "./local-db";
import type {
  Project,
  ProjectWithScenes,
  project_stage,
  StageProgress,
} from "@/types/database";

export class ProjectError extends Error {
  constructor(
    message: string,
    public code: "not_found" | "unauthorized" | "database_error"
  ) {
    super(message);
    this.name = "ProjectError";
  }
}

export async function createProject(
  userId: string | null,
  title: string,
  story?: string,
  style?: string,
  shotCount?: number
): Promise<Project> {
  try {
    const project = localDb.createProject(userId, title, story, style, shotCount);
    return project as Project;
  } catch (error) {
    console.error("Error creating project:", error);
    throw new ProjectError("Failed to create project", "database_error");
  }
}

export async function getProjects(
  userId: string | null,
  options: {
    page?: number;
    limit?: number;
  } = {}
): Promise<{ projects: Project[]; total: number }> {
  try {
    const result = localDb.getProjects(userId, options);
    return {
      projects: result.projects as Project[],
      total: result.total,
    };
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw new ProjectError("Failed to fetch projects", "database_error");
  }
}

export async function getProjectById(
  projectId: string,
  userId: string | null
): Promise<ProjectWithScenes> {
  try {
    const result = localDb.getProjectWithScenes(projectId, userId);
    if (!result) {
      throw new ProjectError("Project not found", "not_found");
    }
    return {
      ...result.project,
      scenes: result.scenes,
    } as ProjectWithScenes;
  } catch (error) {
    if (error instanceof ProjectError) throw error;
    console.error("Error fetching project:", error);
    throw new ProjectError("Failed to fetch project", "database_error");
  }
}

export async function updateProject(
  projectId: string,
  userId: string | null,
  updates: {
    title?: string;
    story?: string;
    style?: string;
    stage?: project_stage;
    shot_count?: number;
    stage_progress?: Partial<StageProgress>;
  }
): Promise<Project> {
  try {
    const project = localDb.updateProject(projectId, userId, updates as Partial<Project>);
    if (!project) {
      throw new ProjectError("Project not found", "not_found");
    }
    return project as Project;
  } catch (error) {
    if (error instanceof ProjectError) throw error;
    console.error("Error updating project:", error);
    throw new ProjectError("Failed to update project", "database_error");
  }
}

export async function updateProjectStage(
  projectId: string,
  userId: string | null,
  stage: project_stage
): Promise<Project> {
  try {
    const project = localDb.updateProjectStage(projectId, userId, stage);
    if (!project) {
      throw new ProjectError("Project not found", "not_found");
    }
    return project as Project;
  } catch (error) {
    if (error instanceof ProjectError) throw error;
    console.error("Error updating project stage:", error);
    throw new ProjectError("Failed to update project stage", "database_error");
  }
}

export async function deleteProject(
  projectId: string,
  userId: string | null
): Promise<void> {
  try {
    const deleted = localDb.deleteProject(projectId, userId);
    if (!deleted) {
      throw new ProjectError("Project not found", "not_found");
    }
  } catch (error) {
    if (error instanceof ProjectError) throw error;
    console.error("Error deleting project:", error);
    throw new ProjectError("Failed to delete project", "database_error");
  }
}

export async function isProjectOwner(
  projectId: string,
  userId: string | null
): Promise<boolean> {
  try {
    const project = localDb.getProjectById(projectId, userId);
    return project !== null;
  } catch {
    return false;
  }
}
