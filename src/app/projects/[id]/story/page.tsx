"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { StageNavigator } from "@/components/project/StageNavigator";
import { Spinner } from "@/components/ui/Spinner";
import { StoryEditor } from "./StoryEditor";
import { storyDb, characterDb, locationDb, propDb, actDb, storySceneDb } from "@/lib/db/story";
import { saveStoryData, saveStageProgress, createAutoSave } from "@/lib/save-utils";
import type { Project } from "@/types/database";
import type { Story, Character, Location, Prop, Act } from "@/types/story";

export default function StoryPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const autoSaveRef = useRef<ReturnType<typeof createAutoSave> | null>(null);
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    fetchProject();

    return () => {
      isMountedRef.current = false;
    };
  }, [projectId]);

  useEffect(() => {
    if (!story) return;

    autoSaveRef.current = createAutoSave(async () => {
      const currentStory = storyDb.getByProjectId(projectId);
      if (!currentStory) return;

      const characters = characterDb.getByProjectId(projectId);
      const locations = locationDb.getByProjectId(projectId);
      const props = propDb.getByProjectId(projectId);
      const acts = actDb.getByStoryId(currentStory.id);

      const result = await saveStoryData(projectId, {
        title: currentStory.title,
        logline: currentStory.logline,
        synopsis: currentStory.synopsis,
        genre: currentStory.genre,
        targetDuration: currentStory.targetDuration,
        characters: characters.map((c) => ({ ...c })),
        locations: locations.map((l) => ({ ...l })),
        props: props.map((p) => ({ ...p })),
        acts: acts.map((a) => ({
          ...a,
          scenes: storySceneDb.getByActId(a.id).map((s) => ({ ...s })),
        })),
      });

      if (!result.success) {
        console.error("Auto-save failed:", result.error);
      }
    }, 3000);

    return () => {
      autoSaveRef.current?.cancel();
    };
  }, [projectId, story?.id]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error("Failed to fetch project");
      const data = await response.json();
      setProject(data.project);

      const progress = data.project.stage_progress;
      if (progress?.planning?.status !== "completed") {
        router.push(`/projects/${projectId}/planning`);
        return;
      }

      let existingStory: Story | null = null;

      try {
        const storyResponse = await fetch(`/api/projects/${projectId}/story-data`);
        if (storyResponse.ok) {
          const storyResult = await storyResponse.json();

          if (storyResult.story) {
            const serverStory = storyResult.story as Story;

            const localStory = storyDb.getByProjectId(projectId);
            if (!localStory || localStory.updatedAt < serverStory.updatedAt) {
              storyDb.deleteByProjectId(projectId);
              existingStory = storyDb.create(projectId, {
                title: serverStory.title,
                logline: serverStory.logline,
                synopsis: serverStory.synopsis,
                genre: serverStory.genre,
                targetDuration: serverStory.targetDuration,
                structure: serverStory.structure,
                theme: serverStory.theme,
                tone: serverStory.tone,
              });
            } else {
              existingStory = localStory;
            }

            if (storyResult.characters && Array.isArray(storyResult.characters)) {
              const localChars = characterDb.getByProjectId(projectId);
              if (localChars.length === 0) {
                (storyResult.characters as Character[]).forEach((char) => {
                  characterDb.create(projectId, char);
                });
              }
            }

            if (storyResult.locations && Array.isArray(storyResult.locations)) {
              const localLocs = locationDb.getByProjectId(projectId);
              if (localLocs.length === 0) {
                (storyResult.locations as Location[]).forEach((loc) => {
                  locationDb.create(projectId, loc);
                });
              }
            }

            if (storyResult.props && Array.isArray(storyResult.props)) {
              const localProps = propDb.getByProjectId(projectId);
              if (localProps.length === 0) {
                (storyResult.props as Prop[]).forEach((prop) => {
                  propDb.create(projectId, prop);
                });
              }
            }

            if (storyResult.acts && Array.isArray(storyResult.acts)) {
              const storyId = existingStory.id;
              const localActs = actDb.getByStoryId(storyId);
              if (localActs.length === 0) {
                (storyResult.acts as Act[]).forEach((act) => {
                  const createdAct = actDb.create(storyId, {
                    index: act.index,
                    title: act.title,
                    description: act.description,
                    goal: act.goal,
                    conflict: act.conflict,
                    resolution: act.resolution,
                  });

                  if (act.scenes && Array.isArray(act.scenes)) {
                    act.scenes.forEach((scene: any) => {
                      storySceneDb.create(createdAct.id, scene);
                    });
                  }
                });
              }
            }

            if (!existingStory) {
              existingStory = storyDb.getByProjectId(projectId);
            }
          }
        }
      } catch (e) {
        console.log("Story data not available from API, falling back to localStorage");
      }

      if (!existingStory) {
        existingStory = storyDb.getByProjectId(projectId);
      }

      if (!existingStory) {
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
      setSaveStatus("已加载");
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStoryUpdate = useCallback((updatedStory: Story) => {
    setStory(updatedStory);
    setHasUnsavedChanges(true);
    autoSaveRef.current?.trigger();
  }, []);

  const handleManualSave = async () => {
    if (!story) return;

    setSaving(true);
    setError(null);
    setSaveStatus("保存中...");

    try {
      const currentStory = storyDb.getByProjectId(projectId);
      if (!currentStory) throw new Error("Story not found");

      const characters = characterDb.getByProjectId(projectId);
      const locations = locationDb.getByProjectId(projectId);
      const props = propDb.getByProjectId(projectId);
      const acts = actDb.getByStoryId(currentStory.id);

      const result = await saveStoryData(projectId, {
        title: currentStory.title,
        logline: currentStory.logline,
        synopsis: currentStory.synopsis,
        genre: currentStory.genre,
        targetDuration: currentStory.targetDuration,
        characters: characters.map((c) => ({ ...c })),
        locations: locations.map((l) => ({ ...l })),
        props: props.map((p) => ({ ...p })),
        acts: acts.map((a) => ({
          ...a,
          scenes: storySceneDb.getByActId(a.id).map((s) => ({ ...s })),
        })),
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      await saveStageProgress({
        projectId,
        stage: "story",
        status: "in_progress",
        data: {
          charactersCount: characters.length,
          locationsCount: locations.length,
          propsCount: props.length,
          actsCount: acts.length,
          updatedAt: new Date().toISOString(),
        },
      });

      setHasUnsavedChanges(false);
      setSaveStatus("已保存");

      setTimeout(() => {
        if (isMountedRef.current) {
          setSaveStatus("");
        }
      }, 2000);
    } catch (error) {
      console.error("Error saving:", error);
      setError("保存失败，请重试");
      setSaveStatus("");
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  };

  const handleComplete = async () => {
    if (!story) return;

    setSaving(true);
    setError(null);

    try {
      const currentStory = storyDb.getByProjectId(projectId);
      const characters = characterDb.getByProjectId(projectId);
      const locations = locationDb.getByProjectId(projectId);
      const props = propDb.getByProjectId(projectId);
      const acts = currentStory ? actDb.getByStoryId(currentStory.id) : [];

      const result = await saveStoryData(projectId, {
        title: currentStory?.title,
        logline: currentStory?.logline,
        synopsis: currentStory?.synopsis,
        genre: currentStory?.genre,
        targetDuration: currentStory?.targetDuration,
        characters: characters.map((c) => ({ ...c })),
        locations: locations.map((l) => ({ ...l })),
        props: props.map((p) => ({ ...p })),
        acts: acts.map((a) => ({
          ...a,
          scenes: storySceneDb.getByActId(a.id).map((s) => ({ ...s })),
        })),
        stage: "story",
        status: "completed",
      });

      if (!result.success) {
        throw new Error("Failed to save story data");
      }

      await saveStageProgress({
        projectId,
        stage: "story",
        status: "completed",
        data: {
          charactersCount: characters.length,
          locationsCount: locations.length,
          propsCount: props.length,
          actsCount: acts.length,
          completedAt: new Date().toISOString(),
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 300));
      router.push(`/projects/${projectId}/storyboard`);
    } catch (error) {
      console.error("Error completing story:", error);
      setError(error instanceof Error ? error.message : "保存失败，请重试");
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
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
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                故事开发
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                构建您的故事结构、角色和场景
              </p>
            </div>
            <div className="flex items-center gap-3">
              {saveStatus && (
                <span className={`text-sm ${saveStatus.includes("失败") ? "text-red-500" : "text-green-500"}`}>
                  {saveStatus}
                </span>
              )}
              {hasUnsavedChanges && !saving && (
                <span className="text-xs text-amber-500 flex items-center gap-1">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                  未保存
                </span>
              )}
            </div>
          </div>

          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          <div className="p-6">
            <StoryEditor story={story} onUpdate={handleStoryUpdate} />
          </div>

          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
            <button
              onClick={handleManualSave}
              disabled={saving}
              className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm flex items-center gap-2"
            >
              {saving ? (
                <Spinner size="sm" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
              )}
              保存
            </button>
            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/projects/${projectId}/planning`)}
                disabled={saving}
                className="px-5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm"
              >
                返回项目规划
              </button>
              <button
                onClick={handleComplete}
                disabled={saving}
                className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium"
              >
                {saving ? (
                  <>
                    <Spinner size="sm" />
                    保存中...
                  </>
                ) : (
                  <>
                    完成并进入分镜设计
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-green-700 dark:text-green-300">
              <p className="font-medium mb-1">保存机制</p>
              <ul className="space-y-1 text-xs">
                <li>✓ <strong>自动保存</strong>：修改内容后约3秒自动保存到服务器</li>
                <li>✓ <strong>手动保存</strong>：点击"保存"按钮立即保存</li>
                <li>✓ <strong>完成时保存</strong>：点击"完成并进入分镜设计"保存所有数据</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
