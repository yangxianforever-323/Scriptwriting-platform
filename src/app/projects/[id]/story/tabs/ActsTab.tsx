"use client";

import { useState, useEffect, useRef } from "react";
import type { Story, Act, StoryScene } from "@/types/story";
import { actDb, storySceneDb } from "@/lib/db/story";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";

interface ActsTabProps {
  story: Story;
}

interface ScriptAnalysis {
  acts: {
    title: string;
    description: string;
    scenes: {
      title: string;
      description: string;
      location?: string;
      timeOfDay?: string;
      mood?: string;
      characters?: string[];
    }[];
  }[];
  characters: {
    name: string;
    description: string;
    role: "protagonist" | "antagonist" | "supporting" | "minor";
  }[];
  locations: {
    name: string;
    description: string;
  }[];
}

export function ActsTab({ story }: ActsTabProps) {
  const [acts, setActs] = useState<Act[]>([]);
  const [selectedAct, setSelectedAct] = useState<Act | null>(null);
  const [scenes, setScenes] = useState<StoryScene[]>([]);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scriptContent, setScriptContent] = useState("");
  const [analysisResult, setAnalysisResult] = useState<ScriptAnalysis | null>(null);
  const [chatMessages, setChatMessages] = useState<{role: "user" | "assistant"; content: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = () => {
    const loadedActs = actDb.getByStoryId(story.id);
    setActs(loadedActs);
    if (loadedActs.length > 0) {
      if (!selectedAct || !loadedActs.find(a => a.id === selectedAct.id)) {
        setSelectedAct(loadedActs[0]);
        const loadedScenes = storySceneDb.getByActId(loadedActs[0].id);
        setScenes(loadedScenes);
      }
    } else {
      setSelectedAct(null);
      setScenes([]);
    }
  };

  useEffect(() => {
    loadData();
    
    const handleFocus = () => {
      loadData();
    };
    window.addEventListener("focus", handleFocus);
    
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [story.id]);

  useEffect(() => {
    if (selectedAct) {
      const loadedScenes = storySceneDb.getByActId(selectedAct.id);
      setScenes(loadedScenes);
    }
  }, [selectedAct]);

  const handleSelectAct = (act: Act) => {
    setSelectedAct(act);
    const loadedScenes = storySceneDb.getByActId(act.id);
    setScenes(loadedScenes);
  };

  const handleAddAct = () => {
    actDb.create(story.id, {
      title: `第${acts.length + 1}幕`,
    });
    loadData();
  };

  const handleAddScene = () => {
    if (!selectedAct) return;
    storySceneDb.create(selectedAct.id, {
      title: `场景${scenes.length + 1}`,
    });
    const loadedScenes = storySceneDb.getByActId(selectedAct.id);
    setScenes(loadedScenes);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setScriptContent(text);
  };

  const analyzeScript = async () => {
    if (!scriptContent.trim()) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/ai/analyze-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script: scriptContent,
          storyId: story.id,
        }),
      });

      if (!response.ok) throw new Error("分析失败");

      const result = await response.json();
      setAnalysisResult(result.analysis);
      setChatMessages([{
        role: "assistant",
        content: `剧本分析完成！我识别出 ${result.analysis.acts.length} 幕，${result.analysis.characters.length} 个角色，${result.analysis.locations.length} 个场景地点。您可以在下方查看详情，或通过对话让我调整分幕结构。`
      }]);
    } catch (error) {
      console.error("Error analyzing script:", error);
      alert("分析失败，请重试");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const applyAnalysis = () => {
    if (!analysisResult) return;

    acts.forEach(act => {
      const actScenes = storySceneDb.getByActId(act.id);
      actScenes.forEach(scene => storySceneDb.delete(scene.id));
      actDb.delete(act.id);
    });

    analysisResult.acts.forEach((actData, actIndex) => {
      const newAct = actDb.create(story.id, {
        title: actData.title,
        description: actData.description,
        index: actIndex,
      });

      actData.scenes.forEach((sceneData, sceneIndex) => {
        storySceneDb.create(newAct.id, {
          title: sceneData.title,
          description: sceneData.description,
          locationId: sceneData.location,
          timeOfDay: sceneData.timeOfDay,
          mood: sceneData.mood,
          index: sceneIndex,
        });
      });
    });

    loadData();

    setIsImportDialogOpen(false);
    setScriptContent("");
    setAnalysisResult(null);
    setChatMessages([]);
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !analysisResult) return;

    const userMessage = chatInput;
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/ai/chat-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatMessages, { role: "user", content: userMessage }],
          currentAnalysis: analysisResult,
          storyId: story.id,
        }),
      });

      if (!response.ok) throw new Error("对话失败");

      const result = await response.json();
      setChatMessages(prev => [...prev, { role: "assistant", content: result.message }]);
      if (result.updatedAnalysis) {
        setAnalysisResult(result.updatedAnalysis);
      }
    } catch (error) {
      console.error("Error in chat:", error);
      setChatMessages(prev => [...prev, { role: "assistant", content: "抱歉，对话出现错误，请重试。" }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const totalScenes = acts.reduce((acc, act) => {
    const actScenes = storySceneDb.getByActId(act.id);
    return acc + actScenes.length;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">分幕与场景</h2>
          <p className="text-sm text-zinc-500">构建故事结构，管理幕和场景</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新
          </Button>
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            导入剧本
          </Button>
          <Button onClick={handleAddAct}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加幕
          </Button>
        </div>
      </div>

      {acts.length === 0 ? (
        <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <svg className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
          </svg>
          <p className="text-zinc-500 mb-2">还没有幕</p>
          <p className="text-xs text-zinc-400 mb-4">如果您在规划阶段导入了小说，分幕结构会自动显示在这里</p>
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
              导入剧本
            </Button>
            <Button onClick={handleAddAct}>创建第一幕</Button>
          </div>
        </div>
      ) : (
        <>
          {acts.length > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>已创建 {acts.length} 幕，共 {totalScenes} 个场景</span>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <h3 className="text-sm font-medium text-zinc-500 mb-3">幕列表</h3>
              <div className="space-y-2">
                {acts.map((act, index) => (
                  <button
                    key={act.id}
                    onClick={() => handleSelectAct(act)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedAct?.id === act.id
                        ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                        : "bg-white border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{act.title}</span>
                    </div>
                    {act.description && (
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-1 ml-8">{act.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2">
              {selectedAct ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium text-zinc-500">
                      {selectedAct.title} - 场景列表
                    </h3>
                    <Button size="sm" onClick={handleAddScene}>
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      添加场景
                    </Button>
                  </div>

                  {scenes.length === 0 ? (
                    <div className="text-center py-8 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                      <p className="text-zinc-500 text-sm">此幕还没有场景</p>
                      <Button size="sm" className="mt-2" onClick={handleAddScene}>
                        创建第一个场景
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {scenes.map((scene, index) => (
                        <div
                          key={scene.id}
                          className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <span className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-600 dark:text-zinc-400">
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              <h4 className="font-medium text-zinc-900 dark:text-zinc-100">{scene.title}</h4>
                              {scene.description && (
                                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">
                                  {scene.description}
                                </p>
                              )}
                              <div className="flex gap-2 mt-2">
                                {scene.timeOfDay && (
                                  <span className="text-xs px-2 py-0.5 bg-zinc-100 dark:bg-zinc-700 rounded">
                                    {scene.timeOfDay}
                                  </span>
                                )}
                                {scene.mood && (
                                  <span className="text-xs px-2 py-0.5 bg-zinc-100 dark:bg-zinc-700 rounded">
                                    {scene.mood}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <p className="text-zinc-500">选择左侧的幕查看场景</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>导入剧本并AI分析</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
            <div className="flex flex-col">
              <div className="flex gap-2 mb-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.md,.doc,.docx,.pdf,.fountain,.fdx"
                  className="hidden"
                />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  选择文件
                </Button>
                <Button 
                  onClick={analyzeScript} 
                  disabled={!scriptContent || isAnalyzing}
                >
                  {isAnalyzing ? "分析中..." : "AI分析"}
                </Button>
              </div>
              <textarea
                value={scriptContent}
                onChange={(e) => setScriptContent(e.target.value)}
                placeholder="在此粘贴剧本内容，或上传剧本文件..."
                className="flex-1 p-4 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg resize-none bg-zinc-50 dark:bg-zinc-900"
              />
            </div>

            <div className="flex flex-col h-full">
              {analysisResult ? (
                <>
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">分析结果</h4>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                      <p>📑 {analysisResult.acts.length} 幕</p>
                      <p>👤 {analysisResult.characters.length} 个角色</p>
                      <p>🏞️ {analysisResult.locations.length} 个场景地点</p>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                      {chatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded-lg text-sm ${
                            msg.role === "user"
                              ? "bg-blue-100 dark:bg-blue-900/30 ml-8"
                              : "bg-zinc-100 dark:bg-zinc-800 mr-8"
                          }`}
                        >
                          {msg.content}
                        </div>
                      ))}
                      {isChatLoading && (
                        <div className="text-center text-zinc-400 text-sm">
                          AI思考中...
                        </div>
                      )}
                    </div>
                    <div className="p-2 border-t border-zinc-200 dark:border-zinc-700 flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                        placeholder="输入指令调整分幕结构..."
                        className="flex-1 px-3 py-2 text-sm border border-zinc-200 dark:border-zinc-700 rounded-lg"
                      />
                      <Button size="sm" onClick={sendChatMessage} disabled={isChatLoading}>
                        发送
                      </Button>
                    </div>
                  </div>

                  <Button className="mt-4 w-full" onClick={applyAnalysis}>
                    应用分析结果到故事
                  </Button>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-zinc-400 text-sm">
                  {isAnalyzing ? "AI正在分析剧本..." : "输入剧本后点击AI分析"}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
