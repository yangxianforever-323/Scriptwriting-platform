"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { StageNavigator } from "@/components/project/StageNavigator";
import { Spinner } from "@/components/ui/Spinner";
import { StoryEditor } from "./StoryEditor";
import { storyDb } from "@/lib/db/story";
import type { Project } from "@/types/database";
import type { Story } from "@/types/story";

export default function StoryPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      // Fetch project
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error("Failed to fetch project");
      const data = await response.json();
      setProject(data.project);

      // Check if planning is completed
      const progress = data.project.stage_progress;
      if (progress?.planning?.status !== "completed") {
        router.push(`/projects/${projectId}/planning`);
        return;
      }

      // Load or create story
      let existingStory = storyDb.getByProjectId(projectId);
      if (!existingStory) {
        // Create new story from project data
        existingStory = storyDb.create(projectId, {
          title: data.project.title,
          logline: progress?.planning?.data?.logline || "",
          synopsis: progress?.planning?.data?.synopsis || "",
          genre: progress?.planning?.data?.genre || "",
          targetDuration: progress?.planning?.data?.targetDuration || 60,
          structure: "three-act",
        });
      }
      setStory(existingStory);
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStoryUpdate = (updatedStory: Story) => {
    setStory(updatedStory);
  };

  const handleComplete = async () => {
    // Update stage progress
    await fetch(`/api/projects/${projectId}/stage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage: "story",
        status: "completed",
        data: {
          actsCount: story?.acts?.length || 0,
          scenesCount: story?.acts?.reduce((acc, act) => acc + (act.scenes?.length || 0), 0) || 0,
          charactersCount: story?.characters?.length || 0,
        },
      }),
    });

    router.push(`/projects/${projectId}/storyboard`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!project || !story) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-zinc-500">项目不存在</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <StageNavigator project={project} currentStage="story" />

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            故事开发
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8">
            构建您的故事结构、角色和场景
          </p>

          <StoryEditor story={story} onUpdate={handleStoryUpdate} />

          {/* Actions */}
          <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-between">
            <button
              onClick={() => router.push(`/projects/${projectId}/planning`)}
              className="px-6 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              ← 返回项目规划
            </button>
            <button
              onClick={handleComplete}
              className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              完成并进入分镜设计
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
