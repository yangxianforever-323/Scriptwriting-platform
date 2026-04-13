"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { StageNavigator } from "@/components/project/StageNavigator";
import { Spinner } from "@/components/ui/Spinner";
import type { Project } from "@/types/database";
import {
  CharacterGeneratePanel,
  LocationGeneratePanel,
  SceneGeneratePanel,
} from "./components/GeneratePanels";

interface AnalysisCharacter {
  id: string;
  name: string;
  description: string;
  role: string;
  appearance: string;
  personality?: string;
  background?: string;
  thumbnailUrl?: string;
}

interface AnalysisLocation {
  id: string;
  name: string;
  description: string;
  atmosphere?: string;
  thumbnailUrl?: string;
}

interface PropItem {
  name: string;
  type: "weapon" | "item" | "tool" | "accessory" | "other";
  description: string;
  holder?: string;
}

interface VisualEffect {
  style: string;
  colorTone: string;
  lighting: string;
  cameraAngle?: string;
}

interface AnalysisScene {
  id: string;
  title: string;
  description: string;
  location: string;
  locationId?: string;
  characters: string[];
  characterIds?: string[];
  timeOfDay?: string;
  mood?: string;
  thumbnailUrl?: string;
  visualEffect?: VisualEffect;
  props?: PropItem[];
  atmosphereRef?: string;
  notes?: string;
}

interface AnalysisAct {
  id: string;
  title: string;
  description: string;
  scenes: AnalysisScene[];
}

interface AnalysisData {
  title: string;
  logline: string;
  synopsis: string;
  genre: string;
  targetDuration: number;
  characters: AnalysisCharacter[];
  locations: AnalysisLocation[];
  acts: AnalysisAct[];
  // 新增统计字段
  totalChapters?: number;
  totalPages?: number;
  totalProps?: number;
}

function ThumbnailPlaceholder({ 
  label, 
  imageUrl,
  onUpload,
  onClick,
  size = "medium"
}: { 
  label: string; 
  imageUrl?: string;
  onUpload?: (file: File) => void;
  onClick?: () => void;
  size?: "small" | "medium" | "large";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  const sizeClasses = {
    small: "w-16 h-20",
    medium: "w-24 h-32",
    large: "w-36 h-48"
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpload(file);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative group">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={() => {
          if (onClick) {
            onClick();
          } else {
            inputRef.current?.click();
          }
        }}
        className={`${sizeClasses[size]} rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-600 flex flex-col items-center justify-center overflow-hidden transition-all hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer bg-zinc-100 dark:bg-zinc-800`}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
        ) : (
          <>
            <svg className="w-6 h-6 text-zinc-400 dark:text-zinc-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center px-1">{label}</span>
          </>
        )}
      </button>
      {imageUrl && !onClick && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
        >
          ×
        </button>
      )}
      {imageUrl && onClick && (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center pointer-events-none">
          <span className="text-[10px] text-white bg-black/60 px-2 py-1 rounded">点击编辑</span>
        </div>
      )}
    </div>
  );
}

export default function ReviewAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "characters" | "locations" | "acts">("overview");
  const [optimizing, setOptimizing] = useState<string | null>(null);

  // Generate Panel States
  const [characterPanelIdx, setCharacterPanelIdx] = useState<number | null>(null);
  const [locationPanelIdx, setLocationPanelIdx] = useState<number | null>(null);
  const [scenePanelActIdx, setScenePanelActIdx] = useState<number | null>(null);
  const [scenePanelSceneIdx, setScenePanelSceneIdx] = useState<number | null>(null);

  const [analysisData, setAnalysisData] = useState<AnalysisData>({
    title: "",
    logline: "",
    synopsis: "",
    genre: "",
    targetDuration: 60,
    characters: [],
    locations: [],
    acts: [],
    totalChapters: 0,
    totalPages: 0,
    totalProps: 0,
  });

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error("Failed to fetch project");
      const data = await response.json();
      setProject(data.project);

      if (data.project.stage_progress?.planning?.data) {
        const pd = data.project.stage_progress.planning.data;
        setAnalysisData(prev => ({
          ...prev,
          title: pd.title || prev.title || data.project.title || "",
          logline: pd.logline || prev.logline || "",
          synopsis: pd.synopsis || prev.synopsis || "",
          genre: pd.genre || prev.genre || "",
          targetDuration: pd.targetDuration || prev.targetDuration || 60,
        }));
      }

      const storedAnalysis = sessionStorage.getItem(`analysis_${projectId}`);
      if (storedAnalysis) {
        try {
          const parsed = JSON.parse(storedAnalysis);
          setAnalysisData(prev => ({
            ...prev,
            ...parsed,
            characters: parsed.characters || [],
            locations: parsed.locations || [],
            acts: parsed.acts || [],
          }));
        } catch {}
      }
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAIoptimize = async (field: string, index?: number) => {
    setOptimizing(`${field}-${index || 0}`);

    try {
      let contentToOptimize = "";

      switch (field) {
        case "logline":
          contentToOptimize = analysisData.logline;
          break;
        case "synopsis":
          contentToOptimize = analysisData.synopsis;
          break;
        case "character":
          if (index !== undefined && analysisData.characters[index]) {
            contentToOptimize = JSON.stringify(analysisData.characters[index]);
          }
          break;
        case "scene":
          if (index !== undefined) {
            for (const act of analysisData.acts) {
              const scene = act.scenes.find((s, i) => i === index);
              if (scene) {
                contentToOptimize = JSON.stringify(scene);
                break;
              }
            }
          }
          break;
      }

      if (!contentToOptimize) return;

      const response = await fetch("/api/ai/optimize-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field,
          content: contentToOptimize,
          context: {
            title: analysisData.title,
            genre: analysisData.genre,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();

        switch (field) {
          case "logline":
            setAnalysisData(prev => ({ ...prev, logline: result.optimized }));
            break;
          case "synopsis":
            setAnalysisData(prev => ({ ...prev, synopsis: result.optimized }));
            break;
          case "character":
            if (index !== undefined) {
              setAnalysisData(prev => {
                const newChars = [...prev.characters];
                newChars[index] = { ...newChars[index], ...result.optimized };
                return { ...prev, characters: newChars };
              });
            }
            break;
          case "scene":
            if (index !== undefined) {
              setAnalysisData(prev => {
                const newActs = [...prev.acts];
                let sceneFound = false;
                for (let i = 0; i < newActs.length && !sceneFound; i++) {
                  for (let j = 0; j < newActs[i].scenes.length; j++) {
                    if (j === index) {
                      newActs[i].scenes[j] = { ...newActs[i].scenes[j], ...result.optimized };
                      sceneFound = true;
                      break;
                    }
                  }
                }
                return { ...prev, acts: newActs };
              });
            }
            break;
        }
      }
    } catch (error) {
      console.error("Error optimizing:", error);
      alert("优化失败，请重试");
    } finally {
      setOptimizing(null);
    }
  };

  const handleApplyAndContinue = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/apply-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(analysisData),
      });

      if (!response.ok) throw new Error("Failed to apply");

      sessionStorage.removeItem(`analysis_${projectId}`);

      router.push(`/projects/${projectId}/storyboard`);
    } catch (error) {
      console.error("Error applying:", error);
      alert("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  };

  const handleCharacterImageUpload = (idx: number, file: File | null) => {
    if (!file) {
      updateCharacter(idx, { thumbnailUrl: undefined });
      return;
    }
    const url = URL.createObjectURL(file);
    updateCharacter(idx, { thumbnailUrl: url });
  };

  const handleLocationImageUpload = (idx: number, file: File | null) => {
    if (!file) {
      updateLocation(idx, { thumbnailUrl: undefined });
      return;
    }
    const url = URL.createObjectURL(file);
    updateLocation(idx, { thumbnailUrl: url });
  };

  const handleSceneImageUpload = (actIdx: number, sceneIdx: number, file: File | null) => {
    if (!file) {
      updateScene(actIdx, sceneIdx, { thumbnailUrl: undefined });
      return;
    }
    const url = URL.createObjectURL(file);
    updateScene(actIdx, sceneIdx, { thumbnailUrl: url });
  };

  const updateCharacter = (index: number, updates: Partial<AnalysisCharacter>) => {
    setAnalysisData(prev => {
      const newCharacters = [...prev.characters];
      newCharacters[index] = { ...newCharacters[index], ...updates };
      return { ...prev, characters: newCharacters };
    });
    setHasUnsavedChanges(true);
  };

  const addCharacter = () => {
    setAnalysisData(prev => ({
      ...prev,
      characters: [
        ...prev.characters,
        {
          id: `char_${Date.now()}`,
          name: "新角色",
          description: "",
          role: "supporting",
          appearance: "",
        },
      ],
    }));
    setHasUnsavedChanges(true);
  };

  const removeCharacter = (index: number) => {
    setAnalysisData(prev => ({
      ...prev,
      characters: prev.characters.filter((_, i) => i !== index),
    }));
    setHasUnsavedChanges(true);
  };

  const updateLocation = (index: number, updates: Partial<AnalysisLocation>) => {
    setAnalysisData(prev => {
      const newLocations = [...prev.locations];
      newLocations[index] = { ...newLocations[index], ...updates };
      return { ...prev, locations: newLocations };
    });
    setHasUnsavedChanges(true);
  };

  const addLocation = () => {
    setAnalysisData(prev => ({
      ...prev,
      locations: [
        ...prev.locations,
        {
          id: `loc_${Date.now()}`,
          name: "新地点",
          description: "",
        },
      ],
    }));
    setHasUnsavedChanges(true);
  };

  const removeLocation = (index: number) => {
    setAnalysisData(prev => ({
      ...prev,
      locations: prev.locations.filter((_, i) => i !== index),
    }));
    setHasUnsavedChanges(true);
  };

  const updateAct = (actIndex: number, updates: Partial<AnalysisAct>) => {
    setAnalysisData(prev => {
      const newActs = [...prev.acts];
      newActs[actIndex] = { ...newActs[actIndex], ...updates };
      return { ...prev, acts: newActs };
    });
    setHasUnsavedChanges(true);
  };

  const updateScene = (actIndex: number, sceneIndex: number, updates: Partial<AnalysisScene>) => {
    setAnalysisData(prev => {
      const newActs = [...prev.acts];
      const newScenes = [...newActs[actIndex].scenes];
      newScenes[sceneIndex] = { ...newScenes[sceneIndex], ...updates };
      newActs[actIndex] = { ...newActs[actIndex], scenes: newScenes };
      return { ...prev, acts: newActs };
    });
    setHasUnsavedChanges(true);
  };

  const addAct = () => {
    setAnalysisData(prev => ({
      ...prev,
      acts: [
        ...prev.acts,
        {
          id: `act_${Date.now()}`,
          title: `第${prev.acts.length + 1}幕`,
          description: "",
          scenes: [],
        },
      ],
    }));
    setHasUnsavedChanges(true);
  };

  const addScene = (actIndex: number) => {
    setAnalysisData(prev => {
      const newActs = [...prev.acts];
      newActs[actIndex] = {
        ...newActs[actIndex],
        scenes: [
          ...newActs[actIndex].scenes,
          {
            id: `scene_${Date.now()}`,
            title: `新场景`,
            description: "",
            location: "",
            characters: [],
          },
        ],
      };
      return { ...prev, acts: newActs };
    });
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaveStatus("保存中...");

    try {
      sessionStorage.setItem(`analysis_${projectId}`, JSON.stringify(analysisData));

      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: analysisData.title,
          stage_progress: {
            planning: {
              status: "in_progress",
              updatedAt: new Date().toISOString(),
              data: {
                logline: analysisData.logline,
                synopsis: analysisData.synopsis,
                genre: analysisData.genre,
                targetDuration: analysisData.targetDuration,
              },
            },
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to save");

      setHasUnsavedChanges(false);
      setSaveStatus("已保存");

      setTimeout(() => setSaveStatus(""), 2000);
    } catch (error) {
      console.error("Error saving:", error);
      setError("保存失败，请重试");
      setSaveStatus("");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <StageNavigator project={project!} currentStage="planning" />

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                确认分析结果
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                请检查并编辑 AI 分析的内容，确认无误后进入分镜设计
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

          {/* Tabs */}
          <div className="px-6 pt-4">
            <div className="flex gap-6 border-b border-zinc-200 dark:border-zinc-700">
              {[
                { key: "overview", label: "概览" },
                { key: "characters", label: `角色 (${analysisData.characters.length})` },
                { key: "locations", label: `地点 (${analysisData.locations.length})` },
                { key: "acts", label: `分幕 (${analysisData.acts.length})` },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`pb-3 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                {/* 左侧：基本信息 + 统计；右侧：图表 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* 左侧列 */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* 项目标题 */}
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">项目标题</label>
                      <input
                        type="text"
                        value={analysisData.title}
                        onChange={(e) => setAnalysisData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* 一句话概括 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">一句话概括</label>
                        <button
                          onClick={() => handleAIoptimize("logline")}
                          disabled={optimizing !== null}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                        >
                          {optimizing === "logline-0" ? <Spinner size="sm" /> : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          )}
                          AI优化
                        </button>
                      </div>
                      <textarea
                        value={analysisData.logline}
                        onChange={(e) => setAnalysisData(prev => ({ ...prev, logline: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    {/* 详细概要 */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">详细概要</label>
                        <button
                          onClick={() => handleAIoptimize("synopsis")}
                          disabled={optimizing !== null}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                        >
                          {optimizing === "synopsis-0" ? <Spinner size="sm" /> : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                          )}
                          AI优化
                        </button>
                      </div>
                      <textarea
                        value={analysisData.synopsis}
                        onChange={(e) => setAnalysisData(prev => ({ ...prev, synopsis: e.target.value }))}
                        rows={5}
                        className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    {/* 题材类型 + 预估时长 */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">题材类型</label>
                        <input
                          type="text"
                          value={analysisData.genre}
                          onChange={(e) => setAnalysisData(prev => ({ ...prev, genre: e.target.value }))}
                          placeholder="如：古装、悬疑、动作、历史"
                          className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">预估时长（分钟）</label>
                        <input
                          type="number"
                          value={analysisData.targetDuration}
                          onChange={(e) => setAnalysisData(prev => ({ ...prev, targetDuration: parseInt(e.target.value) || 60 }))}
                          className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* 详细统计卡片 */}
                    <div>
                      <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">故事统计</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {/* 角色 */}
                        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-700">
                          <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                            {analysisData.characters.filter(c => c.role === "protagonist").length}
                          </div>
                          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">主角</div>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-700">
                          <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                            {analysisData.characters.filter(c => c.role === "supporting").length}
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400 mt-1">配角</div>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20 rounded-xl border border-red-200 dark:border-red-700">
                          <div className="text-3xl font-bold text-red-700 dark:text-red-300">
                            {analysisData.characters.filter(c => c.role === "antagonist").length}
                          </div>
                          <div className="text-xs text-red-600 dark:text-red-400 mt-1">反派</div>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800/30 dark:to-zinc-700/20 rounded-xl border border-zinc-200 dark:border-zinc-700">
                          <div className="text-3xl font-bold text-zinc-700 dark:text-zinc-300">
                            {analysisData.characters.filter(c => c.role === "minor").length}
                          </div>
                          <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">龙套</div>
                        </div>

                        {/* 其他 */}
                        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-700">
                          <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">{analysisData.locations.length}</div>
                          <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">地点</div>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 rounded-xl border border-amber-200 dark:border-amber-700">
                          <div className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                            {analysisData.acts.reduce((acc, act) => acc + act.scenes.length, 0)}
                          </div>
                          <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">场景</div>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/30 dark:to-cyan-800/20 rounded-xl border border-cyan-200 dark:border-cyan-700">
                          <div className="text-3xl font-bold text-cyan-700 dark:text-cyan-300">{analysisData.acts.length}</div>
                          <div className="text-xs text-cyan-600 dark:text-cyan-400 mt-1">幕</div>
                        </div>
                        <div className="p-4 bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-900/30 dark:to-rose-800/20 rounded-xl border border-rose-200 dark:border-rose-700">
                          <div className="text-3xl font-bold text-rose-700 dark:text-rose-300">{analysisData.totalProps || 0}</div>
                          <div className="text-xs text-rose-600 dark:text-rose-400 mt-1">道具</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 右侧列：图表 */}
                  <div className="space-y-6">
                    {/* 故事结构饼图 */}
                    <div className="p-5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-4">故事结构</h3>
                      <div className="flex items-center justify-center">
                        <div className="relative w-48 h-48">
                          {/* 简易饼图占位 - 使用CSS */}
                          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="20" strokeDasharray="75 251" />
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" strokeWidth="20" strokeDasharray="126 251" strokeDashoffset="-75" />
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="20" strokeDasharray="50 251" strokeDashoffset="-201" />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{analysisData.acts.length}</div>
                              <div className="text-xs text-zinc-500">幕</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        {analysisData.acts.map((act, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${
                                idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-green-500' : idx === 2 ? 'bg-amber-500' : 'bg-purple-500'
                              }`} />
                              <span className="text-zinc-600 dark:text-zinc-400">{act.title}</span>
                            </div>
                            <span className="text-zinc-500">{act.scenes.length} 场景</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 叙事节奏折线图 */}
                    <div className="p-5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-4">叙事节奏</h3>
                      <div className="h-32 flex items-end justify-around gap-1 px-2">
                        {[30, 45, 35, 60, 75, 55, 80, 95].map((height, idx) => (
                          <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                            <div 
                              className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm transition-all hover:from-blue-600 hover:to-blue-500"
                              style={{ height: `${height}%` }}
                            />
                            <span className="text-[10px] text-zinc-500">{idx + 1}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 flex justify-between text-[10px] text-zinc-500">
                        <span>开端</span>
                        <span>发展</span>
                        <span>高潮</span>
                        <span>结局</span>
                      </div>
                    </div>

                    {/* 核心人物关系图 */}
                    <div className="p-5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-4">核心人物关系</h3>
                      <div className="relative h-40">
                        {/* 中心人物 */}
                        {analysisData.characters.filter(c => c.role === "protagonist").length > 0 ? (
                          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 border-white dark:border-zinc-800">
                              {analysisData.characters.filter(c => c.role === "protagonist")[0].name.slice(0, 2)}
                            </div>
                          </div>
                        ) : null}

                        {/* 周围人物 */}
                        {analysisData.characters.filter(c => c.role !== "protagonist").slice(0, 6).map((char, idx) => {
                          const angle = (idx * 60) * Math.PI / 180;
                          const x = 50 + 35 * Math.cos(angle);
                          const y = 50 + 35 * Math.sin(angle);
                          return (
                            <div 
                              key={char.id || idx}
                              className="absolute w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-medium shadow-md border border-white dark:border-zinc-800"
                              style={{
                                left: `${x}%`,
                                top: `${y}%`,
                                transform: 'translate(-50%, -50%)',
                                backgroundColor: char.role === 'antagonist' ? '#ef4444' : char.role === 'supporting' ? '#22c55e' : '#71717a'
                              }}
                              title={char.name}
                            >
                              {char.name.slice(0, 1)}
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 justify-center">
                        <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          <span>主角</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span>配角</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <span>反派</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Characters Tab */}
            {activeTab === "characters" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-100">角色列表</h3>
                  <button
                    onClick={addCharacter}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    添加角色
                  </button>
                </div>

                <div className="space-y-4">
                  {analysisData.characters.map((char, idx) => (
                    <div key={char.id || idx} className="p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                      <div className="flex gap-5">
                        {/* Thumbnail */}
                        <ThumbnailPlaceholder
                          label="角色图"
                          imageUrl={char.thumbnailUrl}
                          onUpload={(f) => handleCharacterImageUpload(idx, f)}
                          onClick={() => setCharacterPanelIdx(idx)}
                          size="medium"
                        />

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 grid grid-cols-3 gap-3">
                              <input
                                type="text"
                                value={char.name}
                                onChange={(e) => updateCharacter(idx, { name: e.target.value })}
                                placeholder="角色名称"
                                className="px-3 py-2 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                              />
                              <select
                                value={char.role}
                                onChange={(e) => updateCharacter(idx, { role: e.target.value })}
                                className="px-3 py-2 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                              >
                                <option value="protagonist">主角</option>
                                <option value="antagonist">反派</option>
                                <option value="supporting">配角</option>
                                <option value="minor">龙套</option>
                              </select>
                              <input
                                type="text"
                                value={char.appearance}
                                onChange={(e) => updateCharacter(idx, { appearance: e.target.value })}
                                placeholder="外貌特征"
                                className="px-3 py-2 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                              />
                            </div>
                            <button
                              onClick={() => removeCharacter(idx)}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded shrink-0 mt-1"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>

                          <textarea
                            value={char.description}
                            onChange={(e) => updateCharacter(idx, { description: e.target.value })}
                            placeholder="角色描述"
                            rows={3}
                            className="w-full px-3 py-2 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 resize-none"
                          />

                          <div className="flex justify-end">
                            <button
                              onClick={() => handleAIoptimize("character", idx)}
                              disabled={optimizing !== null}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                            >
                              {optimizing === `character-${idx}` ? <Spinner size="sm" /> : (
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                              )}
                              AI优化描述
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {analysisData.characters.length === 0 && (
                  <div className="text-center py-12 text-zinc-400">
                    <p>暂无角色，点击上方按钮添加</p>
                  </div>
                )}
              </div>
            )}

            {/* Locations Tab */}
            {activeTab === "locations" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-100">场景地点</h3>
                  <button
                    onClick={addLocation}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    添加地点
                  </button>
                </div>

                <div className="space-y-4">
                  {analysisData.locations.map((loc, idx) => (
                    <div key={loc.id || idx} className="p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                      <div className="flex gap-5">
                        {/* Thumbnail */}
                        <ThumbnailPlaceholder
                          label="场景图"
                          imageUrl={loc.thumbnailUrl}
                          onUpload={(f) => handleLocationImageUpload(idx, f)}
                          onClick={() => setLocationPanelIdx(idx)}
                          size="large"
                        />

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-3">
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <input
                                type="text"
                                value={loc.name}
                                onChange={(e) => updateLocation(idx, { name: e.target.value })}
                                placeholder="地点名称"
                                className="w-full px-3 py-2 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                              />
                              <textarea
                                value={loc.description}
                                onChange={(e) => updateLocation(idx, { description: e.target.value })}
                                placeholder="地点描述"
                                rows={3}
                                className="w-full mt-2 px-3 py-2 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 resize-none"
                              />
                            </div>
                            <button
                              onClick={() => removeLocation(idx)}
                              className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded shrink-0 mt-1"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {analysisData.locations.length === 0 && (
                  <div className="text-center py-12 text-zinc-400">
                    <p>暂无地点，点击上方按钮添加</p>
                  </div>
                )}
              </div>
            )}

            {/* Acts Tab */}
            {activeTab === "acts" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-zinc-900 dark:text-zinc-100">分幕结构</h3>
                  <button
                    onClick={addAct}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    添加一幕
                  </button>
                </div>

                <div className="space-y-6">
                  {analysisData.acts.map((act, actIdx) => (
                    <div key={act.id || actIdx} className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                      {/* Act Header */}
                      <div className="p-4 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-between">
                        <input
                          type="text"
                          value={act.title}
                          onChange={(e) => updateAct(actIdx, { title: e.target.value })}
                          className="flex-1 px-3 py-1.5 text-base font-medium bg-transparent border-none text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                        />
                        <span className="text-sm text-zinc-500 ml-4">{act.scenes.length} 场景</span>
                      </div>

                      {/* Act Description */}
                      <div className="px-4 pb-3">
                        <textarea
                          value={act.description}
                          onChange={(e) => updateAct(actIdx, { description: e.target.value })}
                          placeholder="幕描述"
                          rows={2}
                          className="w-full px-3 py-2 text-sm rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 resize-none"
                        />
                      </div>

                      {/* Scenes */}
                      <div className="px-4 pb-4 space-y-4">
                        {act.scenes.map((scene, sceneIdx) => (
                          <div key={scene.id || sceneIdx} className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
                            <div className="flex gap-4">
                              {/* Scene Thumbnail */}
                              <ThumbnailPlaceholder
                                label="场景图"
                                imageUrl={scene.thumbnailUrl}
                                onUpload={(f) => handleSceneImageUpload(actIdx, sceneIdx, f)}
                                onClick={() => { setScenePanelActIdx(actIdx); setScenePanelSceneIdx(sceneIdx); }}
                                size="small"
                              />

                              {/* Scene Content */}
                              <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex items-start gap-2">
                                  <input
                                    type="text"
                                    value={scene.title}
                                    onChange={(e) => updateScene(actIdx, sceneIdx, { title: e.target.value })}
                                    placeholder="场景标题"
                                    className="flex-1 px-2 py-1 text-sm font-medium bg-transparent border-none text-zinc-900 dark:text-zinc-100 focus:outline-none rounded"
                                  />
                                  <select
                                    value={scene.location}
                                    onChange={(e) => updateScene(actIdx, sceneIdx, { location: e.target.value })}
                                    className="px-2 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 shrink-0"
                                  >
                                    <option value="">选择地点</option>
                                    {analysisData.locations.map(loc => (
                                      <option key={loc.id || loc.name} value={loc.name}>{loc.name}</option>
                                    ))}
                                  </select>
                                </div>

                                <textarea
                                  value={scene.description}
                                  onChange={(e) => updateScene(actIdx, sceneIdx, { description: e.target.value })}
                                  placeholder="场景描述"
                                  rows={2}
                                  className="w-full px-2 py-1.5 text-xs rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 resize-none"
                                />

                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-zinc-400">
                                    角色: {scene.characters.join(", ") || "无"}
                                  </span>
                                  <button
                                    onClick={() => handleAIoptimize("scene", sceneIdx)}
                                    disabled={optimizing !== null}
                                    className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded hover:bg-blue-100 disabled:opacity-50"
                                  >
                                    {optimizing === `scene-${sceneIdx}` ? <Spinner size="sm" /> : "AI优化"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                        <button
                          onClick={() => addScene(actIdx)}
                          className="w-full py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded border border-dashed border-zinc-300 dark:border-zinc-600"
                        >
                          + 添加场景
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {analysisData.acts.length === 0 && (
                  <div className="text-center py-12 text-zinc-400">
                    <p>暂无分幕结构，点击上方按钮添加</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
            <div className="flex gap-3">
              <button
                onClick={handleSave}
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
              <button
                onClick={() => router.push(`/projects/${projectId}/planning`)}
                disabled={saving}
                className="px-5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-sm"
              >
                返回上一步
              </button>
            </div>
            <button
              onClick={handleApplyAndContinue}
              disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              {saving ? (
                <>
                  <Spinner size="sm" />
                  保存中...
                </>
              ) : (
                <>
                  确认并进入分镜设计
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Generate Panels */}
        {characterPanelIdx !== null && (
          <CharacterGeneratePanel
            character={analysisData.characters[characterPanelIdx]}
            isOpen={characterPanelIdx !== null}
            onClose={() => setCharacterPanelIdx(null)}
            onUpdate={(updates) => {
              updateCharacter(characterPanelIdx, updates);
            }}
          />
        )}

        {locationPanelIdx !== null && (
          <LocationGeneratePanel
            location={analysisData.locations[locationPanelIdx]}
            isOpen={locationPanelIdx !== null}
            onClose={() => setLocationPanelIdx(null)}
            onUpdate={(updates) => {
              updateLocation(locationPanelIdx, updates);
            }}
          />
        )}

        {scenePanelActIdx !== null && scenePanelSceneIdx !== null && (
          <SceneGeneratePanel
            scene={analysisData.acts[scenePanelActIdx].scenes[scenePanelSceneIdx]}
            actTitle={analysisData.acts[scenePanelActIdx]?.title}
            actCharacters={analysisData.characters}
            actLocations={analysisData.locations}
            isOpen={true}
            onClose={() => { setScenePanelActIdx(null); setScenePanelSceneIdx(null); }}
            onUpdate={(updates) => {
              updateScene(scenePanelActIdx, scenePanelSceneIdx, updates);
            }}
          />
        )}
      </div>
    </div>
  );
}
