"use client";

import { useState, useRef, useEffect } from "react";
import { Spinner } from "@/components/ui/Spinner";

// ============================================
// Character Generate Panel (Enhanced)
// ============================================

interface CharacterGeneratePanelProps {
  character: {
    id: string;
    name: string;
    description: string;
    role: string;
    appearance: string;
    thumbnailUrl?: string;
    typeImages?: {
      portrait?: string;
      fullbody?: string;
      combo?: string;
      "fullbody-threeview"?: string;
      "closeup-threeview"?: string;
    };
  };
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: any) => void;
}

const IMAGE_TYPES = [
  { key: "portrait", label: "肖像图", desc: "正面头像特写" },
  { key: "fullbody", label: "全身图", desc: "完整人物形象" },
  { key: "combo", label: "组合图", desc: "肖像+全身三视图" },
  { key: "fullbody-threeview", label: "全身三视图", desc: "正/侧/背全身" },
  { key: "closeup-threeview", label: "特写三视图", desc: "头肩正/侧/背" },
] as const;

const ASPECT_RATIOS = [
  { value: "1:1", label: "1:1" },
  { value: "3:4", label: "3:4" },
  { value: "4:3", label: "4:3" },
  { value: "9:16", label: "9:16" },
  { value: "16:9", label: "16:9" },
];

const RESOLUTIONS = [
  { value: "512x768", label: "SD (512×768)" },
  { value: "1024x1536", label: "HD (1024×1536)" },
  { value: "2048x3072", label: "2K (2048×3072)" },
  { value: "custom", label: "自定义..." },
];

export function CharacterGeneratePanel({
  character,
  isOpen,
  onClose,
  onUpdate,
}: CharacterGeneratePanelProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "generate">("generate");
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [promptHeight, setPromptHeight] = useState(120);
  const [isResizing, setIsResizing] = useState(false);
  const [selectedImageType, setSelectedImageType] = useState("combo");
  const [aspectRatio, setAspectRatio] = useState("3:4");
  const [resolution, setResolution] = useState("1024x1536");
  const [quantity, setQuantity] = useState(1);
  const [stylePreset, setStylePreset] = useState("");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [confirmedImage, setConfirmedImage] = useState<string | null>(null);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);

  const promptRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const resizeStartY = useRef(0);
  const resizeStartH = useRef(0);

  // Upload reference image handler - uploads to server for persistence
  const handleUploadReference = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload-image", { method: "POST", body: formData });
        if (!res.ok) throw new Error("上传失败");
        const { url } = await res.json();
        setReferenceImages((prev) => [...prev, url]);
      } catch (err) {
        console.error("Reference image upload error:", err);
        alert("参考图上传失败，请重试");
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Export image handler
  const handleExportImage = () => {
    const imageToExport = confirmedImage || generatedImages[0] || character.thumbnailUrl;
    if (!imageToExport) {
      alert("没有可导出的图片");
      return;
    }

    const link = document.createElement("a");
    link.href = imageToExport;
    link.download = `${character.name}_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Edit tab upload handler - uploads to server then sets as character thumbnail
  const handleEditTabUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith("image/")) {
      alert("请选择图片文件");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-image", { method: "POST", body: formData });
      if (!res.ok) throw new Error("上传失败");
      const { url } = await res.json();
      onUpdate({ thumbnailUrl: url });
    } catch (err) {
      console.error("Edit tab upload error:", err);
      alert("图片上传失败，请重试");
    }
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  // Initialize prompt with character data
  useEffect(() => {
    if (isOpen && !prompt) {
      setPrompt(`${character.name}，${character.appearance || ""}，${character.description?.substring(0, 150) || ""}`);
    }
  }, [isOpen]);

  // Resizable textarea handler
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartY.current = e.clientY;
    resizeStartH.current = promptHeight;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientY - resizeStartY.current;
      const newHeight = Math.max(80, Math.min(300, resizeStartH.current + delta));
      setPromptHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-zinc-900 rounded-xl shadow-2xl w-[95vw] max-w-[1300px] h-[90vh] flex overflow-hidden border border-zinc-700" onClick={e => e.stopPropagation()}>
        {/* Left Panel */}
        <div className="w-[420px] border-r border-zinc-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-zinc-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-white">角色编辑</h3>
              <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-zinc-800 rounded-lg p-1 mt-3">
              <button
                onClick={() => setActiveTab("edit")}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === "edit" ? "bg-zinc-600 text-white" : "text-zinc-400 hover:text-white"}`}
              >
                编辑信息
              </button>
              <button
                onClick={() => setActiveTab("generate")}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === "generate" ? "bg-green-600 text-white" : "text-zinc-400 hover:text-white"}`}
              >
                AI生成图
              </button>
            </div>
          </div>

          {/* Edit Tab Content */}
          {activeTab === "edit" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Thumbnail Upload */}
              <div className="flex justify-center gap-4">
                <div className="w-24 h-32 rounded-lg border-2 border-dashed border-zinc-600 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-zinc-800 relative group">
                  {character.thumbnailUrl ? (
                    <>
                      <img src={character.thumbnailUrl} alt={character.name} className="w-full h-full object-cover rounded-lg" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <span className="text-xs text-white">更换</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      <span className="text-[10px] text-zinc-500 mt-1">角色图</span>
                    </>
                  )}
                </div>
                
                {/* Quick Actions */}
                <div className="flex flex-col gap-2 justify-center">
                  <button
                    onClick={() => editFileInputRef.current?.click()}
                    className="px-3 py-1.5 text-[10px] bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded hover:bg-blue-600/30 transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    上传已确定图片
                  </button>
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleEditTabUpload}
                    className="hidden"
                  />
                  <button className="px-3 py-1.5 text-[10px] bg-zinc-700 text-zinc-300 border border-zinc-600 rounded hover:bg-zinc-600 transition-colors flex items-center gap-1.5 opacity-50 cursor-not-allowed">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    从素材库导入（开发中）
                  </button>
                </div>
              </div>

              {/* Name & Role */}
              <div className="space-y-3">
                <input
                  type="text"
                  value={character.name}
                  onChange={(e) => onUpdate({ name: e.target.value })}
                  placeholder="角色名称"
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                />
                <select
                  value={character.role}
                  onChange={(e) => onUpdate({ role: e.target.value })}
                  className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="protagonist">主角</option>
                  <option value="antagonist">反派</option>
                  <option value="supporting">配角</option>
                  <option value="minor">龙套</option>
                </select>
              </div>

              {/* Appearance & Description */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">外貌特征</label>
                <textarea
                  value={character.appearance}
                  onChange={(e) => onUpdate({ appearance: e.target.value })}
                  placeholder="描述角色的外貌、服装、体型等..."
                  rows={3}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">角色描述</label>
                <textarea
                  value={character.description}
                  onChange={(e) => onUpdate({ description: e.target.value })}
                  placeholder="详细的角色背景、性格、动机..."
                  rows={4}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">人物标签</label>
                <div className="flex flex-wrap gap-1.5">
                  {["男性", "女性", "青年", "中年", "老年", "威严", "温和", "冷酷", "神秘"].map(tag => (
                    <span key={tag} className="px-2 py-1 text-[10px] bg-zinc-700 text-zinc-300 rounded cursor-pointer hover:bg-zinc-600 transition-colors">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Generate Tab Content - Enhanced */}
          {activeTab === "generate" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* AI Status Banner */}
              <div className="p-3 bg-green-900/20 rounded-lg border border-green-800/30">
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  <span className="text-xs font-medium text-green-400">AI图像生成</span>
                </div>
                <p className="text-[11px] text-zinc-400">基于角色描述自动生成参考形象图</p>
              </div>

              {/* Image Type Selection */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-2">生成类型</label>
                <div className="grid grid-cols-5 gap-2">
                  {IMAGE_TYPES.map(type => (
                    <button
                      key={type.key}
                      onClick={() => setSelectedImageType(type.key)}
                      className={`p-2.5 rounded-lg border transition-all ${
                        selectedImageType === type.key
                          ? "border-green-500 bg-green-900/20"
                          : "border-zinc-700 bg-zinc-800 hover:border-zinc-500"
                      }`}
                    >
                      <div className="text-[11px] font-medium text-white text-center">{type.label}</div>
                      <div className="text-[8px] text-zinc-500 mt-0.5 text-center leading-tight">{type.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt Editor - Resizable */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-zinc-400">生成提示词</label>
                  <span className="text-[10px] text-zinc-600">拖拽底部调整大小</span>
                </div>
                <div className="relative bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden">
                  <textarea
                    ref={promptRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="输入详细的生成提示词..."
                    style={{ height: `${promptHeight}px` }}
                    className="w-full px-3 py-2.5 bg-transparent text-white text-sm focus:outline-none resize-none leading-relaxed"
                  />
                  {/* Resize Handle */}
                  <div
                    onMouseDown={handleResizeStart}
                    className="absolute bottom-0 left-0 right-0 h-2 cursor-row-resize flex items-center justify-center group"
                  >
                    <div className="w-8 h-0.5 bg-zinc-600 rounded group-hover:bg-blue-500 transition-colors"></div>
                  </div>
                </div>
                <div className="mt-1 text-right text-[10px] text-zinc-500">{prompt.length} 字符</div>
              </div>

              {/* Generation Settings Grid */}
              <div className="grid grid-cols-3 gap-3">
                {/* Aspect Ratio */}
                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">生成比例</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-xs focus:border-blue-500 focus:outline-none"
                  >
                    {ASPECT_RATIOS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>

                {/* Resolution */}
                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">分辨率</label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-white text-xs focus:border-blue-500 focus:outline-none"
                  >
                    {RESOLUTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1">生成数量</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 4, 6, 8].map(n => (
                      <button
                        key={n}
                        onClick={() => setQuantity(n)}
                        className={`flex-1 py-1.5 text-[10px] rounded transition-colors ${quantity === n ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400 hover:text-white"}`}
                      >{n}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Style Presets */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">风格预设</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {["写实风", "动漫风", "水墨风", "油画风", "赛博朋克", "古风", "电影质感", "插画风", "3D渲染"].map(style => (
                    <button
                      key={style}
                      onClick={() => setStylePreset(style)}
                      className={`px-2 py-1.5 text-[10px] rounded transition-colors ${
                        stylePreset === style
                          ? "bg-blue-600 text-white border border-blue-500"
                          : "bg-zinc-800 border border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:border-zinc-500"
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={async () => {
                  setGenerating(true);
                  setGeneratedImages([]);
                  setConfirmedImage(null);

                  try {
                    const styleMap: Record<string, string> = {
                      "写实风": "realistic", "动漫风": "anime", "水墨风": "watercolor",
                      "油画风": "oil_painting", "赛博朋克": "cyberpunk", "古风": "fantasy",
                      "电影质感": "cinematic", "插画风": "cartoon", "3D渲染": "realistic"
                    };
                    const styleValue = stylePreset ? styleMap[stylePreset] || stylePreset : "realistic";
                    const resolutionMap: Record<string, string> = {
                      "512x768": "1K",
                      "1024x1536": "2K",
                      "2048x3072": "4K",
                      "custom": "2K",
                    };
                    const resolutionValue = resolutionMap[resolution] || "2K";

                    // 根据图片类型构建不同的提示词
                    const basePrompt = prompt.trim() || `${character.name}，${character.appearance}，${character.description?.substring(0, 100) || ""}`;
                    let enhancedPrompt = basePrompt;
                    
                    // 添加纯色背景要求
                    const backgroundPrompt = "，pure white background, clean studio lighting, professional photography";
                    
                    switch (selectedImageType) {
                      case "portrait":
                        // 肖像图：正面头像特写
                        enhancedPrompt = `${basePrompt}${backgroundPrompt}，front view portrait, head and shoulders close-up, facing camera directly, clear facial features, centered composition`;
                        break;
                      case "fullbody":
                        // 全身图：完整人物形象
                        enhancedPrompt = `${basePrompt}${backgroundPrompt}，full body shot, standing pose, complete outfit visible, front view, full height`;
                        break;
                      case "combo":
                        // 组合图：左侧肖像特写 + 右侧全身三视图
                        enhancedPrompt = `${basePrompt}${backgroundPrompt}，character reference sheet, left side: front portrait close-up head and shoulders, right side: full body three views (front, side, back), multiple angles in one image, professional character design sheet`;
                        break;
                      case "fullbody-threeview":
                        // 全身三视图：正、侧、背
                        enhancedPrompt = `${basePrompt}${backgroundPrompt}，full body three views, front view, side profile, back view, standing pose, complete outfit from all angles, character turnaround sheet`;
                        break;
                      case "closeup-threeview":
                        // 特写三视图：头肩正、侧、背
                        enhancedPrompt = `${basePrompt}${backgroundPrompt}，head and shoulders three views, front face, left side profile, right side profile, close-up portrait from multiple angles`;
                        break;
                      default:
                        enhancedPrompt = `${basePrompt}${backgroundPrompt}`;
                    }

                    const response = await fetch("/api/ai/generate-image", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        prompt: enhancedPrompt,
                        style: styleValue,
                        type: "character",
                        aspectRatio: aspectRatio,
                        resolution: resolutionValue,
                        count: quantity,
                        referenceImages: referenceImages,
                      }),
                    });

                    const result = await response.json();

                    if (!response.ok) {
                      throw new Error(result.error || "图片生成失败");
                    }

                    let images: string[] = [];
                    if (result.images && Array.isArray(result.images)) {
                      images = result.images.map((img: any) => img.url || img);
                    } else if (result.url) {
                      images = [result.url];
                    }

                    if (images.length > 0) {
                      setGeneratedImages(images);
                    } else {
                      console.log("API response:", result);
                      throw new Error("未返回有效图片");
                    }
                  } catch (error) {
                    console.error("Image generation error:", error);
                    alert(`生成失败: ${error instanceof Error ? error.message : "未知错误"}`);
                  } finally {
                    setGenerating(false);
                  }
                }}
                disabled={generating}
                className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                {generating ? (
                  <>
                    <Spinner size="sm" />
                    正在生成中...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    开始生成 ({quantity}张 · {resolution})
                  </>
                )}
              </button>

              {/* Generated Results Preview */}
              {generatedImages.length > 0 && (
                <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-zinc-300">生成结果</span>
                    <span className="text-[10px] text-zinc-500">点击选择确认使用</span>
                  </div>
                  <div className={`grid gap-2 ${selectedImageType === "combo" ? "grid-cols-2" : selectedImageType === "closeup-threeview" ? "grid-cols-3" : "grid-cols-4"}`}>
                    {generatedImages.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setConfirmedImage(img)}
                        className={`rounded-lg overflow-hidden cursor-pointer border-2 transition-all relative group ${
                          confirmedImage === img ? "border-green-500 ring-2 ring-green-500/30" : "border-transparent hover:border-zinc-500"
                        } ${selectedImageType === "combo" ? "aspect-video" : selectedImageType === "closeup-threeview" ? "aspect-square" : "aspect-[2/3]"}`}
                      >
                        <img src={img} alt={`生成${idx + 1}`} className="w-full h-full object-cover" />
                        {confirmedImage === img && (
                          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                            <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </div>
                        )}
                        <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[9px] bg-black/70 text-white px-1.5 py-0.5 rounded">预览</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {confirmedImage && (
                    <button
                      onClick={() => {
                        onUpdate({ thumbnailUrl: confirmedImage });
                        setConfirmedImage(null);
                      }}
                      className="w-full mt-2 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg flex items-center justify-center gap-1"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      确认使用此图片
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bottom Actions */}
          <div className="p-4 border-t border-zinc-700 space-y-2">
            <button
              onClick={() => {
                // 保存已确认或生成的图片到对应类型
                const img = confirmedImage || generatedImages[0];
                if (img) {
                  const currentTypeImages = character.typeImages || {};
                  onUpdate({ 
                    thumbnailUrl: img,
                    typeImages: {
                      ...currentTypeImages,
                      [selectedImageType]: img,
                    }
                  });
                }
                onClose();
              }}
              className="w-full py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              完成编辑
            </button>
          </div>
        </div>

        {/* Right Panel - Preview Area */}
        <div className="flex-1 flex flex-col bg-zinc-950">
          {/* Top Bar */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-white">{character.name}</span>
              <span className="px-2 py-0.5 text-[10px] bg-zinc-700 text-zinc-300 rounded">
                {character.role === "protagonist" ? "主角" : character.role === "antagonist" ? "反派" : character.role === "supporting" ? "配角" : "龙套"}
              </span>
              {(selectedImageType === "combo" || selectedImageType === "fullbody-threeview" || selectedImageType === "closeup-threeview") && (
                <span className="px-2 py-0.5 text-[10px] bg-purple-900/30 text-purple-400 rounded border border-purple-800/30">
                  {selectedImageType === "combo" ? "组合图模式" : selectedImageType === "fullbody-threeview" ? "全身三视图" : "特写三视图"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-xs bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                上传参考图
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleUploadReference}
                className="hidden"
              />
              <button
                onClick={handleExportImage}
                className="px-3 py-1.5 text-xs bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                导出图片
              </button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 flex items-center justify-center p-8">
            {(confirmedImage || character.thumbnailUrl || generatedImages.length > 0) ? (
              <div className="relative max-h-full flex items-center justify-center w-full">
                {confirmedImage ? (
                  <img
                    src={confirmedImage}
                    alt={character.name}
                    className={`max-h-[520px] max-w-full object-contain rounded-lg shadow-2xl ${(selectedImageType === "combo" || selectedImageType === "fullbody-threeview" || selectedImageType === "closeup-threeview") ? "max-w-[900px]" : ""}`}
                  />
                ) : generatedImages.length > 0 ? (
                  <div className="flex flex-col items-center gap-4 w-full max-w-4xl">
                    <p className="text-sm text-green-400 font-medium">✓ 已生成 {generatedImages.length} 张图片，点击选择</p>
                    <div className={`grid gap-3 ${generatedImages.length <= 2 ? "grid-cols-2" : "grid-cols-4"}`}>
                      {generatedImages.map((img, idx) => (
                        <div
                          key={idx}
                          onClick={() => setConfirmedImage(img)}
                          className={`rounded-lg overflow-hidden cursor-pointer border-2 transition-all relative group border-transparent hover:border-green-500 ${selectedImageType === "combo" ? "aspect-video" : "aspect-[2/3]"}`}
                        >
                          <img src={img} alt={`生成${idx + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                            <span className="text-xs text-white opacity-0 group-hover:opacity-100 bg-green-600 px-3 py-1.5 rounded-lg">选择此图</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <img
                    src={character.thumbnailUrl}
                    alt={character.name}
                    className="max-h-[520px] max-w-full object-contain rounded-lg shadow-2xl"
                  />
                )}
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <button
                    onClick={() => {
                      const img = confirmedImage || generatedImages[0] || character.thumbnailUrl;
                      if (img) window.open(img, "_blank");
                    }}
                    className="px-3 py-1.5 text-xs bg-black/60 backdrop-blur text-white rounded hover:bg-black/80 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                    全屏预览
                  </button>
                </div>
              </div>
            ) : selectedImageType === "combo" ? (
              <div className="text-center w-full">
                <div className="inline-flex items-stretch gap-3">
                  <div className="w-44 h-56 rounded-xl border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center bg-zinc-900/50">
                    <svg className="w-10 h-10 text-zinc-600 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <span className="text-xs text-zinc-500">肖像特写</span>
                    <span className="text-[9px] text-zinc-600 mt-0.5">正面头像</span>
                  </div>
                  <div className="flex gap-2">
                    {["正面", "侧面", "背面"].map(view => (
                      <div key={view} className="w-32 h-56 rounded-xl border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center bg-zinc-900/50">
                        <svg className="w-8 h-8 text-zinc-600 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        <span className="text-[10px] text-zinc-500">{view}</span>
                        <span className="text-[8px] text-zinc-600 mt-0.5">全身</span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-zinc-400 mt-4 font-medium">组合图预览 · 肖像 + 全身三视图</p>
                <p className="text-xs text-zinc-600 mt-1">左侧角色特写肖像，右侧正/侧/背三个角度的全身形象</p>
              </div>
            ) : selectedImageType === "fullbody-threeview" ? (
              <div className="text-center">
                <div className="inline-flex gap-4">
                  {[
                    { label: "正面", sub: "Front View" },
                    { label: "侧面", sub: "Side View" },
                    { label: "背面", sub: "Back View" },
                  ].map(view => (
                    <div key={view.label} className="w-36 h-64 rounded-xl border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center bg-zinc-900/50">
                      <svg className="w-10 h-10 text-zinc-600 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      <span className="text-xs text-zinc-400 font-medium">{view.label}</span>
                      <span className="text-[9px] text-zinc-600 mt-0.5">{view.sub}</span>
                      <span className="text-[8px] text-zinc-700 mt-2 px-2 py-0.5 bg-zinc-800 rounded">全身</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-zinc-400 mt-4 font-medium">全身三视图预览</p>
                <p className="text-xs text-zinc-600 mt-1">生成包含完整服装、配饰、体型信息的正/侧/背三个角度</p>
              </div>
            ) : selectedImageType === "closeup-threeview" ? (
              <div className="text-center">
                <div className="inline-flex gap-4">
                  {["正面", "左侧45°", "右侧45°"].map(view => (
                    <div key={view} className="w-36 h-40 rounded-xl border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center bg-zinc-900/50">
                      <svg className="w-9 h-9 text-zinc-600 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      <span className="text-xs text-zinc-400 font-medium">{view}</span>
                      <span className="text-[8px] text-zinc-600 mt-0.5">头肩特写</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-zinc-400 mt-4 font-medium">特写三视图预览（头部到肩部）</p>
                <p className="text-xs text-zinc-600 mt-1">聚焦面部表情、发型、头部装饰等细节的多角度参考</p>
              </div>
            ) : selectedImageType === "portrait" ? (
              <div className="text-center">
                <div className="w-44 h-56 mx-auto rounded-xl border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center bg-zinc-900/50 mb-4">
                  <svg className="w-12 h-12 text-zinc-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <span className="text-sm text-zinc-500">角色肖像</span>
                  <span className="text-xs text-zinc-600 mt-1">正面头像特写</span>
                </div>
                <p className="text-xs text-zinc-500 mb-2">参考图库（可拖拽选择）</p>
                <div className="flex justify-center gap-2">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="w-14 h-14 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                      <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-48 h-64 mx-auto rounded-xl border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center bg-zinc-900/50 mb-4">
                  <svg className="w-12 h-12 text-zinc-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  <span className="text-sm text-zinc-500">角色形象</span>
                  <span className="text-xs text-zinc-600 mt-1">完整全身图</span>
                </div>
                <p className="text-xs text-zinc-500 mb-2">参考图库（可拖拽选择）</p>
                <div className="flex justify-center gap-2">
                  {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="w-14 h-14 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors">
                      <svg className="w-5 h-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Toolbar */}
          <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => { setConfirmedImage(null); setGeneratedImages([]); }}
                className="px-3 py-1.5 text-xs bg-red-900/20 text-red-400 rounded hover:bg-red-900/30 transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                删除重做
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setActiveTab("generate"); setConfirmedImage(null); setGeneratedImages([]); }}
                className="px-3 py-1.5 text-xs bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 014.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                重新构图
              </button>
              <button
                onClick={() => setActiveTab("generate")}
                className="px-3 py-1.5 text-xs bg-zinc-800 text-zinc-300 rounded hover:bg-zinc-700 transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                风格化
              </button>
              <button
                onClick={() => {
                  const img = confirmedImage || generatedImages[0];
                  if (img) {
                    // 保存到对应类型的图片
                    const currentTypeImages = character.typeImages || {};
                    onUpdate({ 
                      thumbnailUrl: img,
                      typeImages: {
                        ...currentTypeImages,
                        [selectedImageType]: img,
                      }
                    });
                    onClose();
                  }
                  else alert("请先选择或生成图片");
                }}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                确认使用
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Location Generate Panel (Enhanced)
// ============================================

interface ReferenceImage {
  id: string;
  url: string;
  tags: string[];
}

interface LocationGeneratePanelProps {
  location: {
    id: string;
    name: string;
    description: string;
    atmosphere?: string;
    thumbnailUrl?: string;
    viewImages?: {
      wide?: string;
      medium?: string;
      closeup?: string;
      aerial?: string;
    };
  };
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: any) => void;
}

// View type mapping: index -> view key
const VIEW_TYPE_MAP: Record<number, keyof LocationGeneratePanelProps['location']['viewImages']> = {
  0: 'wide',
  1: 'medium',
  2: 'closeup',
  3: 'aerial',
};

const REFERENCE_TAGS = [
  { key: "composition", label: "构图", color: "blue" },
  { key: "lighting", label: "光影", color: "amber" },
  { key: "subject", label: "主体", color: "green" },
  { key: "comprehensive", label: "综合", color: "purple" },
  { key: "color", label: "色调", color: "rose" },
  { key: "atmosphere", label: "氛围", color: "cyan" },
  { key: "texture", label: "材质", color: "orange" },
  { key: "perspective", label: "透视", color: "teal" },
];

const ANGLE_LABELS = ["广角全景", "中景构图", "特写细节", "俯视/仰视"];

export function LocationGeneratePanel({
  location,
  isOpen,
  onClose,
  onUpdate,
}: LocationGeneratePanelProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "generate">("edit");
  const [selectedAngle, setSelectedAngle] = useState(0);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [activeImageId, setActiveImageId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [confirmedImage, setConfirmedImage] = useState<string | null>(null);
  const [locationPrompt, setLocationPrompt] = useState("");
  
  // 分辨率选择状态
  // 普通场景图分辨率: 1K (1920x1080), 2K (2048x1080)
  const [sceneResolution, setSceneResolution] = useState<"1K" | "2K">("2K");
  // 全景图分辨率: 1K (1500x750), 2K (2000x1000), 3K (3000x1500)
  const [panoramaResolution, setPanoramaResolution] = useState<"1K" | "2K" | "3K">("2K");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // 分辨率配置
  const SCENE_RESOLUTIONS = {
    "1K": { label: "1K", width: 1920, height: 1080, desc: "1920×1080" },
    "2K": { label: "2K", width: 2048, height: 1080, desc: "2048×1080" },
  };
  
  const PANORAMA_RESOLUTIONS = {
    "1K": { label: "1K", width: 1500, height: 750, desc: "1500×750" },
    "2K": { label: "2K", width: 2000, height: 1000, desc: "2000×1000" },
    "3K": { label: "3K", width: 3000, height: 1500, desc: "3000×1500" },
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/upload-image", { method: "POST", body: formData });
        if (!res.ok) throw new Error("上传失败");
        const { url } = await res.json();
        const newImg: ReferenceImage = {
          id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          url,
          tags: [],
        };
        setReferenceImages(prev => [...prev, newImg]);
      } catch (err) {
        console.error("Reference upload error:", err);
        alert("参考图上传失败，请重试");
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleTag = (imgId: string, tagKey: string) => {
    setReferenceImages(prev => prev.map(img => {
      if (img.id !== imgId) return img;
      const hasTag = img.tags.includes(tagKey);
      return { ...img, tags: hasTag ? img.tags.filter(t => t !== tagKey) : [...img.tags, tagKey] };
    }));
  };

  const removeImage = (imgId: string) => {
    setReferenceImages(prev => prev.filter(img => img.id !== imgId));
    if (activeImageId === imgId) setActiveImageId(null);
  };

  const activeImage = referenceImages.find(img => img.id === activeImageId);

  // Edit tab upload handler - upload to server then save as thumbnailUrl
  const handleEditTabUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith("image/")) {
      alert("请选择图片文件");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-image", { method: "POST", body: formData });
      if (!res.ok) throw new Error("上传失败");
      const { url } = await res.json();
      onUpdate({ thumbnailUrl: url });
    } catch (err) {
      console.error("Edit tab upload error:", err);
      alert("图片上传失败，请重试");
    }
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-zinc-900 rounded-xl shadow-2xl w-[95vw] max-w-[1400px] h-[90vh] flex overflow-hidden border border-zinc-700" onClick={e => e.stopPropagation()}>
        {/* Left Panel */}
        <div className="w-[380px] border-r border-zinc-700 flex flex-col">
          <div className="p-4 border-b border-zinc-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-white">场景地点</h3>
              <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-zinc-800 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("edit")}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === "edit" ? "bg-zinc-600 text-white" : "text-zinc-400 hover:text-white"}`}
              >
                编辑信息
              </button>
              <button
                onClick={() => setActiveTab("generate")}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === "generate" ? "bg-green-600 text-white" : "text-zinc-400 hover:text-white"}`}
              >
                AI生成图
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Edit Tab Content */}
            {activeTab === "edit" && (
              <>
                {/* Thumbnail Upload */}
                <div className="flex justify-center">
                  <div className="w-32 h-24 rounded-lg border-2 border-dashed border-zinc-600 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors bg-zinc-800 relative group overflow-hidden">
                    {location.thumbnailUrl ? (
                      <>
                        <img src={location.thumbnailUrl} alt={location.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-xs text-white">更换</span>
                        </div>
                      </>
                    ) : referenceImages.length > 0 ? (
                      <>
                        <img src={referenceImages[0].url} alt={location.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-xs text-white">更换</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <svg className="w-8 h-8 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-[10px] text-zinc-500 mt-1">场景图</span>
                      </>
                    )}
                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleEditTabUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => editFileInputRef.current?.click()}
                    className="flex-1 px-3 py-2 text-[10px] bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-600/30 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    上传已确定图片
                  </button>
                  <button className="flex-1 px-3 py-2 text-[10px] bg-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-600 opacity-50 cursor-not-allowed flex items-center justify-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    素材库（开发中）
                  </button>
                </div>

                {/* Name Input */}
                <input type="text" value={location.name} onChange={(e) => onUpdate({ name: e.target.value })} placeholder="地点名称" className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none" />

                {/* Description */}
                <textarea value={location.description} onChange={(e) => onUpdate({ description: e.target.value })} placeholder="描述这个场景的环境、氛围、时间..." rows={4} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none resize-none" />

                {/* Atmosphere */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">氛围关键词</label>
                  <input type="text" value={location.atmosphere || ""} onChange={(e) => onUpdate({ atmosphere: e.target.value })} placeholder="如：阴森、明亮、压抑、温暖..." className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none" />
                </div>
              </>
            )}

            {/* Generate Tab Content */}
            {activeTab === "generate" && (
              <>
                {/* Name Input */}
                <input type="text" value={location.name} onChange={(e) => onUpdate({ name: e.target.value })} placeholder="地点名称" className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none" />

            {/* Description */}
            <textarea value={location.description} onChange={(e) => onUpdate({ description: e.target.value })} placeholder="描述这个场景的环境、氛围、时间..." rows={4} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none resize-none" />

            {/* Atmosphere */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">氛围关键词</label>
              <input type="text" value={location.atmosphere || ""} onChange={(e) => onUpdate({ atmosphere: e.target.value })} placeholder="如：阴森、明亮、压抑、温暖..." className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none" />
            </div>

            {/* Upload Reference Images */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-zinc-400">参考图上传</label>
                <span className="text-[10px] text-zinc-600">{referenceImages.length} 张</span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-3 border-2 border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-blue-500 hover:bg-blue-500/5 transition-all group"
              >
                <svg className="w-6 h-6 text-zinc-500 group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span className="text-xs text-zinc-400 group-hover:text-blue-300">点击或拖拽上传参考图</span>
                <span className="text-[10px] text-zinc-600">支持 JPG / PNG / WebP，可多选</span>
              </button>

              {/* Reference Image List */}
              {referenceImages.length > 0 && (
                <div className="mt-3 space-y-2">
                  {referenceImages.map((img, idx) => (
                    <div
                      key={img.id}
                      onClick={() => setActiveImageId(img.id)}
                      className={`flex gap-2.5 p-2 rounded-lg border cursor-pointer transition-all ${
                        activeImageId === img.id ? "border-blue-500 bg-blue-900/10" : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                      }`}
                    >
                      <div className="w-14 h-14 rounded-md overflow-hidden flex-shrink-0 bg-zinc-700 relative group/img">
                        <img src={img.url} alt={`参考${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                          className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-600/80 rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity"
                        >
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-zinc-300 mb-1">参考图 {idx + 1}</div>
                        <div className="flex flex-wrap gap-1">
                          {img.tags.length > 0 ? (
                            img.tags.map(tagKey => {
                              const tag = REFERENCE_TAGS.find(t => t.key === tagKey);
                              return tag ? (
                                <span key={tagKey} className={`px-1.5 py-0.5 text-[9px] rounded bg-${tag.color}-900/30 text-${tag.color}-400 border border-${tag.color}-800/30`}>
                                  {tag.label}
                                </span>
                              ) : null;
                            })
                          ) : (
                            <span className="text-[9px] text-zinc-600">点击添加标签</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tags for Active Image */}
            {activeImage && (
              <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-medium text-zinc-400">图片标签</label>
                  <span className="text-[9px] text-zinc-600">标记此图的参考用途</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {REFERENCE_TAGS.map(tag => (
                    <button
                      key={tag.key}
                      onClick={() => toggleTag(activeImage.id, tag.key)}
                      className={`px-2 py-1 text-[10px] rounded-md border transition-all ${
                        activeImage.tags.includes(tag.key)
                          ? `bg-${tag.color}-600/20 text-${tag.color}-300 border-${tag.color}-500/40`
                          : "bg-zinc-700/50 text-zinc-400 border-zinc-600 hover:border-zinc-500"
                      }`}
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Generate Buttons - Only in generate tab */}
            {activeTab === "generate" && (
              <div className="space-y-3">
                {/* Scene Resolution Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-zinc-400">场景图分辨率</label>
                    <span className="text-[10px] text-zinc-500">{SCENE_RESOLUTIONS[sceneResolution].desc}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(SCENE_RESOLUTIONS) as Array<"1K" | "2K">).map((res) => (
                      <button
                        key={res}
                        onClick={() => setSceneResolution(res)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                          sceneResolution === res
                            ? "bg-green-600 text-white"
                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                        }`}
                      >
                        {SCENE_RESOLUTIONS[res].label}
                        <span className="block text-[9px] opacity-70">{SCENE_RESOLUTIONS[res].desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Normal Generate Button */}
                <button
                  onClick={async () => {
                    setGenerating(true);
                    setGeneratedImages([]);
                    setConfirmedImage(null);
                    try {
                      const angleLabel = ANGLE_LABELS[selectedAngle] || "广角全景";
                      const prompt = locationPrompt.trim() ||
                        `${location.name}，${location.description?.substring(0, 100) || ""}，${location.atmosphere || ""}，${angleLabel}`;
                      const refUrls = referenceImages.map(img => img.url);
                      const response = await fetch("/api/ai/generate-image", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          prompt,
                          style: "realistic",
                          type: "location",
                          aspectRatio: "16:9",
                          resolution: sceneResolution,
                          count: 2,
                          referenceImages: refUrls,
                        }),
                      });
                      const result = await response.json();
                      if (!response.ok) throw new Error(result.error || "图片生成失败");
                      let images: string[] = [];
                      if (result.images && Array.isArray(result.images)) {
                        images = result.images.map((img: any) => img.url || img);
                      } else if (result.url) {
                        images = [result.url];
                      }
                      if (images.length > 0) {
                        setGeneratedImages(images);
                      } else {
                        throw new Error("未返回有效图片");
                      }
                    } catch (error) {
                      console.error("Location image generation error:", error);
                      alert(`生成失败: ${error instanceof Error ? error.message : "未知错误"}`);
                    } finally {
                      setGenerating(false);
                    }
                  }}
                  disabled={generating}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  {generating ? (
                    <>
                      <Spinner size="sm" />
                      正在生成中...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      开始生成 ({sceneResolution})
                    </>
                  )}
                </button>

                {/* Panorama Resolution Selector */}
                <div className="pt-2 border-t border-zinc-700">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium text-zinc-400">全景图分辨率</label>
                    <span className="text-[10px] text-zinc-500">{PANORAMA_RESOLUTIONS[panoramaResolution].desc}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(PANORAMA_RESOLUTIONS) as Array<"1K" | "2K" | "3K">).map((res) => (
                      <button
                        key={res}
                        onClick={() => setPanoramaResolution(res)}
                        className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                          panoramaResolution === res
                            ? "bg-purple-600 text-white"
                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                        }`}
                      >
                        {PANORAMA_RESOLUTIONS[res].label}
                        <span className="block text-[9px] opacity-70">{PANORAMA_RESOLUTIONS[res].desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 360 Panorama Generate Button */}
                <button
                  onClick={async () => {
                    setGenerating(true);
                    setGeneratedImages([]);
                    setConfirmedImage(null);
                    try {
                      // 获取当前视角已确认或已保存的图片作为参考
                      const viewKey = VIEW_TYPE_MAP[selectedAngle];
                      const currentViewImage = location.viewImages?.[viewKey];
                      const sourceImage = confirmedImage || currentViewImage || location.thumbnailUrl;
                      
                      // 构建参考图列表：优先使用已确认的图片，其次是上传的参考图
                      const refUrls: string[] = [];
                      if (sourceImage) {
                        refUrls.push(sourceImage);
                      }
                      // 添加用户上传的参考图
                      referenceImages.forEach(img => {
                        if (!refUrls.includes(img.url)) {
                          refUrls.push(img.url);
                        }
                      });
                      
                      // 构建全景图提示词 - 基于已有图片扩展
                      const basePrompt = locationPrompt.trim() ||
                        `${location.name}，${location.description?.substring(0, 100) || ""}，${location.atmosphere || ""}`;
                      
                      // 如果有参考图，使用扩展提示词；否则使用标准提示词
                      const panoramaPrompt = sourceImage 
                        ? `${basePrompt}，extend this scene into a seamless 360 degree panoramic view, equirectangular projection, maintain consistent style and lighting, expand the environment in all directions, continuous wrap-around view, no visible seams, HDR lighting, spherical panorama`
                        : `${basePrompt}，360 degree panoramic view, equirectangular projection, seamless spherical panorama, immersive environment, continuous wrap-around view, high dynamic range, HDR lighting`;
                      
                      console.log("Panorama generation request:", {
                        prompt: panoramaPrompt.substring(0, 100) + "...",
                        referenceImagesCount: refUrls.length,
                        aspectRatio: "2:1",
                      });
                      
                      const response = await fetch("/api/ai/generate-image", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          prompt: panoramaPrompt,
                          style: "realistic",
                          type: "location",
                          aspectRatio: "2:1",  // 全景图标准比例
                          resolution: panoramaResolution,
                          count: 1,
                          referenceImages: refUrls,
                        }),
                      });
                      const result = await response.json();
                      console.log("Panorama generation response:", result);
                      
                      if (!response.ok) throw new Error(result.error || "全景图生成失败");
                      
                      let images: string[] = [];
                      if (result.images && Array.isArray(result.images)) {
                        images = result.images.map((img: any) => img.url || img);
                      } else if (result.url) {
                        images = [result.url];
                      }
                      
                      console.log("Extracted images:", images);
                      
                      if (images.length > 0) {
                        setGeneratedImages(images);
                        // 标记为全景图类型
                        alert(`360度全景图生成成功！${sourceImage ? '\n\n已基于当前视角图片进行扩展生成。' : ''}\n\n提示：\n1. 右键点击图片可保存\n2. 可在VR/3D软件中使用等距圆柱投影格式\n3. 建议使用专业软件转换为HDR格式`);
                      } else {
                        throw new Error(`未返回有效图片。API响应: ${JSON.stringify(result)}`);
                      }
                    } catch (error) {
                      console.error("Panorama generation error:", error);
                      alert(`全景图生成失败: ${error instanceof Error ? error.message : "未知错误"}`);
                    } finally {
                      setGenerating(false);
                    }
                  }}
                  disabled={generating}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all"
                >
                  {generating ? (
                    <>
                      <Spinner size="sm" />
                      生成全景图中...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      生成360°全景图 ({panoramaResolution})
                    </>
                  )}
                </button>
                <p className="text-[10px] text-zinc-500 text-center">全景图采用2:1等距圆柱投影格式，适用于VR/3D场景</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 px-3 py-2 text-xs bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-600/30 transition-colors flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                上传参考图
              </button>
              <button className="flex-1 px-3 py-2 text-xs bg-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-600 opacity-50 cursor-not-allowed flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                素材库（开发中）
              </button>
            </div>
              </>
            )}
          </div>

          <div className="p-4 border-t border-zinc-700">
            <button
              onClick={() => {
                // 保存已确认或生成的图片到对应视角
                const img = confirmedImage || generatedImages[0];
                if (img) {
                  const viewKey = VIEW_TYPE_MAP[selectedAngle];
                  const currentViewImages = location.viewImages || {};
                  onUpdate({ 
                    thumbnailUrl: img,
                    viewImages: {
                      ...currentViewImages,
                      [viewKey]: img,
                    }
                  });
                }
                onClose();
              }}
              className="w-full py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              完成编辑
            </button>
          </div>
        </div>

        {/* Right Panel - Preview Area */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h4 className="text-white font-medium">{location.name}</h4>
                <p className="text-[11px] text-zinc-500">场景地点编辑面板</p>
              </div>
              {activeImage && (
                <span className="px-2 py-0.5 text-[10px] bg-blue-900/30 text-blue-400 rounded border border-blue-800/30">
                  已选参考图 · {activeImage.tags.length}个标签
                </span>
              )}
            </div>

          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Active Reference Image Preview */}
            {activeImage ? (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-white">参考图预览</span>
                  <div className="flex gap-1">
                    {activeImage.tags.map(tagKey => {
                      const tag = REFERENCE_TAGS.find(t => t.key === tagKey);
                      return tag ? (
                        <span key={tagKey} className={`px-2 py-0.5 text-[10px] rounded-full bg-${tag.color}-900/40 text-${tag.color}-300 border border-${tag.color}-700/30`}>
                          {tag.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
                <div className="relative max-h-[360px] rounded-xl overflow-hidden border border-zinc-700 bg-zinc-950">
                  <img src={activeImage.url} alt="参考图预览" className="max-h-[360px] w-full object-contain" />
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <button className="px-2.5 py-1 text-[10px] bg-black/60 backdrop-blur text-white rounded hover:bg-black/80 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                      放大
                    </button>
                    <button
                      onClick={() => setActiveImageId(null)}
                      className="px-2.5 py-1 text-[10px] bg-black/60 backdrop-blur text-white rounded hover:bg-black/80"
                    >
                      关闭预览
                    </button>
                  </div>
                </div>
              </div>
            ) : referenceImages.length > 0 ? (
              <div className="mb-6 p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50">
                <p className="text-sm text-zinc-400 text-center">点击左侧参考图查看详情和添加标签</p>
              </div>
            ) : null}

            {/* Angle Selection Grid */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-white">生成视角</span>
                <span className="text-[10px] text-zinc-500">选择需要生成的场景角度</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {ANGLE_LABELS.map((label, i) => {
                  // 获取对应视角已保存的图片
                  const viewKey = VIEW_TYPE_MAP[i];
                  const viewImages = location.viewImages || {};
                  const savedViewImage = viewImages[viewKey];
                  // 当前选中视角显示 confirmedImage，其他视角显示保存的图片
                  const displayImage = i === selectedAngle 
                    ? (confirmedImage || savedViewImage)
                    : savedViewImage;
                  const hasImage = !!displayImage;
                  
                  return (
                    <div
                      key={i}
                      onClick={() => setSelectedAngle(i)}
                      className={`aspect-video rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative ${
                        selectedAngle === i
                          ? "border-green-500 bg-green-900/15"
                          : "border-zinc-700 bg-zinc-800 hover:border-zinc-500"
                      }`}
                    >
                      {hasImage ? (
                        <>
                          <img src={displayImage!} alt={label} className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/30"></div>
                          <div className="relative z-10 flex flex-col items-center">
                            <span className={`text-[10px] ${selectedAngle === i ? "text-green-400 font-medium" : "text-white"}`}>{label}</span>
                            {selectedAngle === i && (
                              <svg className="w-3.5 h-3.5 text-green-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <svg className={`w-7 h-7 mb-1 ${selectedAngle === i ? "text-green-400" : "text-zinc-600"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <span className={`text-[10px] ${selectedAngle === i ? "text-green-400 font-medium" : "text-zinc-500"}`}>{label}</span>
                          {selectedAngle === i && (
                            <svg className="w-3.5 h-3.5 text-green-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Generated Results */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white">生成结果</span>
                {generating && (
                  <span className="text-[10px] text-green-400 flex items-center gap-1">
                    <Spinner size="xs" /> 正在生成...
                  </span>
                )}
                {generatedImages.length > 0 && !generating && (
                  <span className="text-[10px] text-zinc-500">点击图片选择</span>
                )}
              </div>
              {generatedImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {generatedImages.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setConfirmedImage(img)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        // 创建右键菜单
                        const menu = document.createElement('div');
                        menu.className = 'fixed bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl py-1 z-50 min-w-[140px]';
                        menu.style.left = `${e.clientX}px`;
                        menu.style.top = `${e.clientY}px`;
                        
                        // 安全移除菜单的辅助函数
                        const safeRemoveMenu = () => {
                          if (document.body.contains(menu)) {
                            document.body.removeChild(menu);
                          }
                        };
                        
                        // 标记菜单是否已移除，防止重复移除
                        let menuRemoved = false;
                        
                        // 安全移除菜单的辅助函数
                        const safeRemoveMenu = () => {
                          if (!menuRemoved && document.body.contains(menu)) {
                            menuRemoved = true;
                            document.body.removeChild(menu);
                          }
                          document.removeEventListener('click', closeMenu);
                        };
                        
                        // 点击其他地方关闭菜单
                        const closeMenu = (event?: MouseEvent) => {
                          // 如果点击的是菜单内部，不关闭
                          if (event && menu.contains(event.target as Node)) {
                            return;
                          }
                          safeRemoveMenu();
                        };
                        
                        // 保存图片选项
                        const saveItem = document.createElement('button');
                        saveItem.className = 'w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors flex items-center gap-2';
                        saveItem.innerHTML = `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>保存图片`;
                        saveItem.onclick = (e) => {
                          e.stopPropagation();
                          const link = document.createElement('a');
                          link.href = img;
                          link.download = `${location.name || 'image'}_${ANGLE_LABELS[selectedAngle]}_${idx + 1}.png`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          safeRemoveMenu();
                        };
                        
                        // 复制图片地址选项
                        const copyItem = document.createElement('button');
                        copyItem.className = 'w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors flex items-center gap-2';
                        copyItem.innerHTML = `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>复制图片地址`;
                        copyItem.onclick = (e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(img);
                          safeRemoveMenu();
                        };
                        
                        // 在新标签页打开
                        const openItem = document.createElement('button');
                        openItem.className = 'w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors flex items-center gap-2';
                        openItem.innerHTML = `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>在新标签页打开`;
                        openItem.onclick = (e) => {
                          e.stopPropagation();
                          window.open(img, '_blank');
                          safeRemoveMenu();
                        };
                        
                        menu.appendChild(saveItem);
                        menu.appendChild(copyItem);
                        menu.appendChild(openItem);
                        document.body.appendChild(menu);
                        
                        // 延迟添加点击事件监听，避免立即触发
                        setTimeout(() => document.addEventListener('click', closeMenu), 100);
                      }}
                      className={`aspect-video rounded-lg overflow-hidden cursor-pointer border-2 transition-all relative group ${
                        confirmedImage === img ? "border-green-500 ring-2 ring-green-500/30" : "border-transparent hover:border-zinc-500"
                      }`}
                    >
                      <img src={img} alt={`生成${idx + 1}`} className="w-full h-full object-cover" />
                      {confirmedImage === img && (
                        <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                          <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2].map(i => (
                    <div key={i} className="aspect-video rounded-lg border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center bg-zinc-900/30">
                      <svg className="w-8 h-8 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span className="text-[10px] text-zinc-600 mt-1">{ANGLE_LABELS[selectedAngle]} #{i}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Toolbar */}
          <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500">
                参考图: {referenceImages.length}张
                {activeImage && <> · 已选: {activeImage.tags.length}个标签</>}
                {confirmedImage && <span className="text-green-400"> · 已选图片</span>}
              </span>
            </div>
            <div className="flex gap-2">
              {confirmedImage && (
                <button
                  onClick={() => { setConfirmedImage(null); setGeneratedImages([]); }}
                  className="px-3 py-1.5 text-xs bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/30 flex items-center gap-1"
                >
                  重新生成
                </button>
              )}
              <button
                onClick={() => {
                  const img = confirmedImage || generatedImages[0];
                  if (!img) { alert("请先生成并选择图片"); return; }
                  
                  // 获取当前选中的视角类型
                  const viewKey = VIEW_TYPE_MAP[selectedAngle];
                  const currentViewImages = location.viewImages || {};
                  
                  // 更新对应视角的图片，同时更新 thumbnailUrl 为当前图片
                  onUpdate({ 
                    thumbnailUrl: img,
                    viewImages: {
                      ...currentViewImages,
                      [viewKey]: img,
                    }
                  });
                  onClose();
                }}
                disabled={generating}
                className="px-4 py-2 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                确认使用
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Act Visual Effects Editor (分幕效果编辑)
// ============================================

interface PropItem {
  name: string;
  type: "weapon" | "item" | "tool" | "accessory" | "other";
  description: string;
  holder?: string;
}

interface VisualEffectDef {
  style: string;
  colorTone: string;
  lighting: string;
  cameraAngle?: string;
}

interface ActVisualEditorProps {
  scene: {
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
    visualEffect?: VisualEffectDef;
    props?: PropItem[];
    atmosphereRef?: string;
    notes?: string;
  };
  actTitle?: string;
  actCharacters?: { id: string; name: string; role: string; appearance: string }[];
  actLocations?: { id: string; name: string; description: string }[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updates: any) => void;
}

const PROP_TYPE_OPTIONS = [
  { value: "weapon", label: "武器", icon: "⚔️" },
  { value: "item", label: "物品", icon: "📦" },
  { value: "tool", label: "工具", icon: "🔧" },
  { value: "accessory", label: "配饰", icon: "💍" },
  { value: "other", label: "其他", icon: "📌" },
];

const VISUAL_STYLES = [
  "写实电影感", "动漫渲染", "水墨国风", "赛博朋克", "暗黑哥特",
  "温暖治愈", "冷峻科幻", "复古胶片", "油画质感", "3D卡通",
];

const COLOR_TONES = [
  "暖色调", "冷色调", "高对比", "低饱和", "莫兰迪",
  "黑白", "复古黄", "青蓝调", "橙红暖", "紫罗兰",
];

const LIGHTING_PRESETS = [
  "自然光", "侧光/伦勃朗", "逆光剪影", "顶光戏剧性", "柔光散射",
  "霓虹灯光", "烛光温暖", "月光清冷", "工业冷光", "黄金时刻",
];

export function SceneGeneratePanel({
  scene,
  actTitle,
  actCharacters = [],
  actLocations = [],
  isOpen,
  onClose,
  onUpdate,
}: ActVisualEditorProps) {
  const [activeSection, setActiveSection] = useState<"visual" | "characters" | "locations" | "props" | "atmosphere">("visual");
  const [newPropName, setNewPropName] = useState("");
  const [newPropType, setNewPropType] = useState<PropItem["type"]>("item");
  const [newPropDesc, setNewPropDesc] = useState("");
  const [newPropHolder, setNewPropHolder] = useState("");
  const [sceneGenerating, setSceneGenerating] = useState(false);
  const sceneUploadRef = useRef<HTMLInputElement>(null);

  const handleSceneUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-image", { method: "POST", body: formData });
      if (!res.ok) throw new Error("上传失败");
      const { url } = await res.json();
      onUpdate({ thumbnailUrl: url });
    } catch (err) {
      console.error("Scene upload error:", err);
      alert("图片上传失败，请重试");
    }
    if (sceneUploadRef.current) sceneUploadRef.current.value = "";
  };

  const handleGenerateSceneImage = async () => {
    setSceneGenerating(true);
    try {
      const prompt = [
        scene.title,
        scene.description?.substring(0, 100),
        scene.location,
        scene.timeOfDay,
        scene.atmosphereRef?.substring(0, 80),
        scene.visualEffect?.style,
        scene.visualEffect?.colorTone,
        scene.visualEffect?.lighting,
      ].filter(Boolean).join("，");

      const response = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          style: scene.visualEffect?.style ? "cinematic" : "realistic",
          type: "scene",
          aspectRatio: "16:9",
          resolution: "2K",
          count: 1,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "图片生成失败");
      const img = result.images?.[0]?.url || result.images?.[0] || result.url;
      if (img) onUpdate({ thumbnailUrl: img });
      else throw new Error("未返回有效图片");
    } catch (error) {
      console.error("Scene image generation error:", error);
      alert(`生成失败: ${error instanceof Error ? error.message : "未知错误"}`);
    } finally {
      setSceneGenerating(false);
    }
  };

  const addProp = () => {
    if (!newPropName.trim()) return;
    const newProp: PropItem = {
      name: newPropName.trim(),
      type: newPropType,
      description: newPropDesc.trim(),
      holder: newPropHolder.trim() || undefined,
    };
    const currentProps = scene.props || [];
    onUpdate({ props: [...currentProps, newProp] });
    setNewPropName("");
    setNewPropDesc("");
    setNewPropHolder("");
  };

  const removeProp = (index: number) => {
    const currentProps = scene.props || [];
    onUpdate({ props: currentProps.filter((_, i) => i !== index) });
  };

  const updateProp = (index: number, updates: Partial<PropItem>) => {
    const currentProps = scene.props || [];
    const updated = [...currentProps];
    updated[index] = { ...updated[index], ...updates };
    onUpdate({ props: updated });
  };

  if (!isOpen) return null;

  const sections = [
    { key: "visual" as const, label: "视觉效果", icon: "🎨", count: (scene.visualEffect?.style ? 1 : 0) },
    { key: "characters" as const, label: "角色", icon: "👤", count: scene.characters?.length || 0 },
    { key: "locations" as const, label: "场景", icon: "📍", count: scene.location ? 1 : 0 },
    { key: "props" as const, label: "道具", icon: "🎭", count: scene.props?.length || 0 },
    { key: "atmosphere" as const, label: "氛围", icon: "✨", count: scene.atmosphereRef ? 1 : 0 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-zinc-900 rounded-xl shadow-2xl w-[95vw] max-w-[1440px] h-[90vh] flex overflow-hidden border border-zinc-700" onClick={e => e.stopPropagation()}>
        {/* Left Panel - Editor */}
        <div className="w-[420px] border-r border-zinc-700 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-zinc-700">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold text-white">分幕效果编辑</h3>
              <button onClick={onClose} className="text-zinc-400 hover:text-white p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {actTitle && <p className="text-[11px] text-zinc-500">{actTitle} · {scene.title}</p>}
          </div>

          {/* Section Tabs */}
          <div className="px-4 pt-3 pb-2 border-b border-zinc-800">
            <div className="flex gap-1">
              {sections.map(sec => (
                <button
                  key={sec.key}
                  onClick={() => setActiveSection(sec.key)}
                  className={`flex-1 py-2 px-1.5 text-[10px] font-medium rounded-lg transition-all flex flex-col items-center gap-0.5 ${
                    activeSection === sec.key
                      ? "bg-blue-600/20 text-blue-300 border border-blue-600/30"
                      : "bg-zinc-800/50 text-zinc-400 hover:text-white border border-transparent"
                  }`}
                >
                  <span className="text-sm">{sec.icon}</span>
                  <span>{sec.label}</span>
                  {sec.count > 0 && (
                    <span className={`px-1.5 py-0 text-[8px] rounded-full ${activeSection === sec.key ? "bg-blue-500 text-white" : "bg-zinc-700 text-zinc-400"}`}>
                      {sec.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Section Content */}
          <div className="flex-1 overflow-y-auto p-4">

            {/* ===== 视觉效果 ===== */}
            {activeSection === "visual" && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-900/10 rounded-lg border border-blue-800/20">
                  <p className="text-[11px] text-blue-300">定义此幕的视觉风格，生成分镜时自动应用</p>
                </div>

                {/* Style */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">视觉风格</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {VISUAL_STYLES.map(style => (
                      <button
                        key={style}
                        onClick={() => onUpdate({ visualEffect: { ...(scene.visualEffect || {} as VisualEffectDef), style } })}
                        className={`px-2 py-1.5 text-[10px] rounded-md border transition-all text-left ${
                          scene.visualEffect?.style === style
                            ? "border-blue-500 bg-blue-900/20 text-blue-300"
                            : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500"
                        }`}
                      >{style}</button>
                    ))}
                  </div>
                </div>

                {/* Color Tone */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">色彩基调</label>
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_TONES.map(tone => (
                      <button
                        key={tone}
                        onClick={() => onUpdate({ visualEffect: { ...(scene.visualEffect || {} as VisualEffectDef), colorTone: tone } })}
                        className={`px-2.5 py-1 text-[10px] rounded-full border transition-all ${
                          scene.visualEffect?.colorTone === tone
                            ? "border-purple-500 bg-purple-900/20 text-purple-300"
                            : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500"
                        }`}
                      >{tone}</button>
                    ))}
                  </div>
                </div>

                {/* Lighting */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">光影预设</label>
                  <div className="flex flex-wrap gap-1.5">
                    {LIGHTING_PRESETS.map(light => (
                      <button
                        key={light}
                        onClick={() => onUpdate({ visualEffect: { ...(scene.visualEffect || {} as VisualEffectDef), lighting: light } })}
                        className={`px-2 py-1 text-[10px] rounded-md border transition-all ${
                          scene.visualEffect?.lighting === light
                            ? "border-amber-500 bg-amber-900/20 text-amber-300"
                            : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500"
                        }`}
                      >{light}</button>
                    ))}
                  </div>
                </div>

                {/* Camera Angle */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">镜头角度偏好</label>
                  <input
                    type="text"
                    value={scene.visualEffect?.cameraAngle || ""}
                    onChange={(e) => onUpdate({ visualEffect: { ...(scene.visualEffect || {} as VisualEffectDef), cameraAngle: e.target.value } })}
                    placeholder="如：低角度仰拍、主观视角、航拍俯瞰..."
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Current Selection Summary */}
                {scene.visualEffect && (
                  <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                    <div className="text-[10px] text-zinc-500 mb-1.5">当前设定</div>
                    <div className="flex flex-wrap gap-1.5">
                      {scene.visualEffect.style && <span className="px-2 py-0.5 text-[9px] rounded bg-blue-900/30 text-blue-400 border border-blue-800/30">{scene.visualEffect.style}</span>}
                      {scene.visualEffect.colorTone && <span className="px-2 py-0.5 text-[9px] rounded bg-purple-900/30 text-purple-400 border border-purple-800/30">{scene.visualEffect.colorTone}</span>}
                      {scene.visualEffect.lighting && <span className="px-2 py-0.5 text-[9px] rounded bg-amber-900/30 text-amber-400 border border-amber-800/30">{scene.visualEffect.lighting}</span>}
                      {scene.visualEffect.cameraAngle && <span className="px-2 py-0.5 text-[9px] rounded bg-zinc-700 text-zinc-300">{scene.visualEffect.cameraAngle}</span>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== 角色 ===== */}
            {activeSection === "characters" && (
              <div className="space-y-4">
                <div className="p-3 bg-green-900/10 rounded-lg border border-green-800/20">
                  <p className="text-[11px] text-green-300">此幕出现的角色，用于生成分镜时自动匹配角色形象</p>
                </div>

                {/* Characters from this scene */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-2">场景角色列表</label>
                  {(scene.characters?.length > 0) ? (
                    <div className="space-y-2">
                      {scene.characters.map((charName, idx) => {
                        const charDetail = actCharacters.find(c => c.name === charName);
                        return (
                          <div key={idx} className="flex items-center gap-3 p-2.5 bg-zinc-800/50 rounded-lg border border-zinc-700">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600/30 to-purple-600/30 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-blue-300">{charName.charAt(0)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-white font-medium">{charName}</div>
                              {charDetail && (
                                <div className="flex gap-1 mt-0.5">
                                  <span className="text-[9px] text-zinc-500">{charDetail.role === "protagonist" ? "主角" : charDetail.role === "antagonist" ? "反派" : charDetail.role === "supporting" ? "配角" : "龙套"}</span>
                                  {charDetail.appearance && <span className="text-[9px] text-zinc-600 truncate">{charDetail.appearance.substring(0, 30)}...</span>}
                                </div>
                              )}
                            </div>
                            <span className="text-[9px] text-green-400 bg-green-900/20 px-1.5 py-0.5 rounded">已关联</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center border-2 border-dashed border-zinc-700 rounded-lg">
                      <p className="text-sm text-zinc-500">暂无角色分配到此场景</p>
                      <p className="text-[10px] text-zinc-600 mt-1">在概览页为场景添加角色</p>
                    </div>
                  )}
                </div>

                {/* All available characters for quick add reference */}
                {actCharacters.length > 0 && (
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1.5">可用角色（全部）</label>
                    <div className="flex flex-wrap gap-1.5">
                      {actCharacters.map(char => (
                        <span
                          key={char.id}
                          className={`px-2 py-1 text-[10px] rounded-md border transition-colors ${
                            scene.characters?.includes(char.name)
                              ? "border-green-600/40 bg-green-900/15 text-green-400"
                              : "border-zinc-700 bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {char.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== 场景地点 ===== */}
            {activeSection === "locations" && (
              <div className="space-y-4">
                <div className="p-3 bg-cyan-900/10 rounded-lg border border-cyan-800/20">
                  <p className="text-[11px] text-cyan-300">此幕的场景地点，用于匹配背景和环境参考图</p>
                </div>

                {/* Current Location */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">当前地点</label>
                  <input
                    type="text"
                    value={scene.location || ""}
                    onChange={(e) => onUpdate({ location: e.target.value })}
                    placeholder="设置场景发生地点..."
                    className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {/* Available Locations */}
                {actLocations.length > 0 && (
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1.5">可选地点（从分析结果中读取）</label>
                    <div className="space-y-1.5">
                      {actLocations.map(loc => (
                        <button
                          key={loc.id}
                          onClick={() => onUpdate({ location: loc.name })}
                          className={`w-full p-2.5 rounded-lg border text-left transition-all flex items-center gap-2.5 ${
                            scene.location === loc.name
                              ? "border-cyan-500 bg-cyan-900/10"
                              : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-500"
                          }`}
                        >
                          <div className="w-7 h-7 rounded bg-cyan-900/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs font-medium ${scene.location === loc.name ? "text-cyan-300" : "text-white"}`}>{loc.name}</div>
                            {loc.description && <div className="text-[9px] text-zinc-500 truncate mt-0.5">{loc.description}</div>}
                          </div>
                          {scene.location === loc.name && (
                            <svg className="w-4 h-4 text-cyan-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Time of Day */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">时间设定</label>
                  <input
                    type="text"
                    value={scene.timeOfDay || ""}
                    onChange={(e) => onUpdate({ timeOfDay: e.target.value })}
                    placeholder="如：黄昏、深夜、黎明、正午..."
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* ===== 道具物品 ===== */}
            {activeSection === "props" && (
              <div className="space-y-4">
                <div className="p-3 bg-rose-900/10 rounded-lg border border-rose-800/20">
                  <p className="text-[11px] text-rose-300">定义此幕中的特殊道具、武器、物品，分镜生成时自动引用</p>
                </div>

                {/* Add New Prop Form */}
                <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700 space-y-2.5">
                  <div className="text-[10px] font-medium text-zinc-400">添加新道具</div>
                  <input
                    type="text"
                    value={newPropName}
                    onChange={(e) => setNewPropName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addProp()}
                    placeholder="道具名称（如：青龙偃月刀、玉佩、密信）"
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded-lg text-white text-xs focus:border-rose-500 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <select
                      value={newPropType}
                      onChange={(e) => setNewPropType(e.target.value as PropItem["type"])}
                      className="flex-1 px-2 py-1.5 bg-zinc-900 border border-zinc-600 rounded text-white text-[10px] focus:border-rose-500"
                    >
                      {PROP_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>)}
                    </select>
                    <input
                      type="text"
                      value={newPropHolder}
                      onChange={(e) => setNewPropHolder(e.target.value)}
                      placeholder="持有者（选填）"
                      className="flex-1 px-2 py-1.5 bg-zinc-900 border border-zinc-600 rounded text-white text-[10px] focus:border-rose-500"
                    />
                  </div>
                  <textarea
                    value={newPropDesc}
                    onChange={(e) => setNewPropDesc(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && e.ctrlKey && addProp()}
                    placeholder="描述道具外观、用途、特殊之处..."
                    rows={2}
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-600 rounded-lg text-white text-[10px] focus:border-rose-500 focus:outline-none resize-none"
                  />
                  <button
                    onClick={addProp}
                    disabled={!newPropName.trim()}
                    className="w-full py-2 bg-rose-600/20 hover:bg-rose-600/30 disabled:opacity-30 text-rose-300 border border-rose-600/30 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    添加道具
                  </button>
                </div>

                {/* Props List */}
                {(scene.props && scene.props.length > 0) ? (
                  <div className="space-y-2">
                    <div className="text-[10px] text-zinc-500 flex items-center justify-between">
                      <span>已添加 {scene.props.length} 个道具</span>
                    </div>
                    {scene.props.map((prop, idx) => {
                      const typeOpt = PROP_TYPE_OPTIONS.find(o => o.value === prop.type);
                      return (
                        <div key={idx} className="p-2.5 bg-zinc-800/50 rounded-lg border border-zinc-700 group">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm">{typeOpt?.icon || "📌"}</span>
                              <div className="min-w-0">
                                <div className="text-xs font-medium text-white truncate">{prop.name}</div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[9px] px-1.5 py-0 rounded bg-zinc-700 text-zinc-400">{typeOpt?.label || prop.type}</span>
                                  {prop.holder && <span className="text-[9px] text-amber-400/80">👤 {prop.holder}</span>}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => removeProp(idx)}
                              className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded bg-red-900/30 flex items-center justify-center transition-opacity hover:bg-red-900/50"
                            >
                              <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                          {prop.description && (
                            <p className="text-[10px] text-zinc-500 mt-1.5 pl-6">{prop.description}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center border-2 border-dashed border-zinc-700 rounded-lg">
                    <p className="text-sm text-zinc-500">暂无道具</p>
                    <p className="text-[10px] text-zinc-600 mt-1">添加此幕中的特殊物品、武器等</p>
                  </div>
                )}
              </div>
            )}

            {/* ===== 氛围参考 ===== */}
            {activeSection === "atmosphere" && (
              <div className="space-y-4">
                <div className="p-3 bg-purple-900/10 rounded-lg border border-purple-800/20">
                  <p className="text-[11px] text-purple-300">定义情绪基调和氛围关键词，影响AI生成的整体感觉</p>
                </div>

                {/* Mood / Atmosphere Input */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">氛围描述</label>
                  <textarea
                    value={scene.atmosphereRef || ""}
                    onChange={(e) => onUpdate({ atmosphereRef: e.target.value })}
                    placeholder="描述这一幕的整体氛围感受...&#10;&#10;例如：&#10;- 压抑紧张，乌云密布的前奏&#10;- 温馨治愈，阳光透过树叶的午后&#10;- 肃杀凝重，大战前的寂静"
                    rows={5}
                    className="w-full px-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Quick Mood Tags */}
                <div>
                  <label className="block text-[10px] text-zinc-500 mb-1.5">快捷情绪标签</label>
                  <div className="flex flex-wrap gap-1.5">
                    {["紧张", "轻松", "压抑", "温馨", "神秘", "激烈", "悲伤", "欢快", "恐怖", "浪漫", "庄严", "混乱"].map(mood => (
                      <button
                        key={mood}
                        onClick={() => {
                          const current = scene.atmosphereRef || "";
                          const newVal = current.includes(mood)
                            ? current.replace(new RegExp(`[,，]?${mood}`, "g"), "").replace(/^[,，\s]+/, "")
                            : current ? `${current}，${mood}` : mood;
                          onUpdate({ atmosphereRef: newVal });
                        }}
                        className={`px-2 py-1 text-[10px] rounded-full border transition-all ${
                          scene.atmosphereRef?.includes(mood)
                            ? "border-purple-500 bg-purple-900/25 text-purple-300"
                            : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-500"
                        }`}
                      >{mood}</button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">备注说明</label>
                  <textarea
                    value={scene.notes || ""}
                    onChange={(e) => onUpdate({ notes: e.target.value })}
                    placeholder="其他需要记录的注意事项..."
                    rows={3}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-xs focus:border-purple-500 focus:outline-none resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-zinc-700 space-y-2">
            <div className="flex gap-2">
              <button
                onClick={() => sceneUploadRef.current?.click()}
                className="flex-1 px-3 py-2 text-xs bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-600/30 transition-colors flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                上传参考图
              </button>
              <input ref={sceneUploadRef} type="file" accept="image/*" onChange={handleSceneUpload} className="hidden" />
              <button className="flex-1 px-3 py-2 text-xs bg-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-600 opacity-50 cursor-not-allowed flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                素材库
              </button>
            </div>
            <button
              onClick={() => {
                // 分幕编辑面板的图片已经通过 onUpdate 实时保存，这里只需关闭
                onClose();
              }}
              className="w-full py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              完成编辑
            </button>
          </div>
        </div>

        {/* Right Panel - Preview & Summary */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h4 className="text-white font-medium">{scene.title}</h4>
                <p className="text-[11px] text-zinc-500">{actTitle || "未命名分幕"} · 分幕效果总览</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleGenerateSceneImage}
                disabled={sceneGenerating}
                className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-800 disabled:opacity-70 flex items-center gap-1"
              >
                {sceneGenerating ? <><Spinner size="sm" /> 生成中...</> : <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> 生成场景图</>}
              </button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Visual Summary Cards Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Visual Effect Card */}
              <div className="p-4 bg-zinc-800/40 rounded-xl border border-zinc-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">🎨</span>
                  <span className="text-xs font-medium text-zinc-300">视觉效果</span>
                </div>
                {scene.visualEffect ? (
                  <div className="space-y-1.5">
                    {scene.visualEffect.style && <div className="text-[10px]"><span className="text-zinc-500">风格：</span><span className="text-blue-300">{scene.visualEffect.style}</span></div>}
                    {scene.visualEffect.colorTone && <div className="text-[10px]"><span className="text-zinc-500">色调：</span><span className="text-purple-300">{scene.visualEffect.colorTone}</span></div>}
                    {scene.visualEffect.lighting && <div className="text-[10px]"><span className="text-zinc-500">光影：</span><span className="text-amber-300">{scene.visualEffect.lighting}</span></div>}
                    {scene.visualEffect.cameraAngle && <div className="text-[10px]"><span className="text-zinc-500">镜头：</span><span className="text-zinc-300">{scene.visualEffect.cameraAngle}</span></div>}
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-600">未设置视觉效果</p>
                )}
              </div>

              {/* Atmosphere Card */}
              <div className="p-4 bg-zinc-800/40 rounded-xl border border-zinc-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">✨</span>
                  <span className="text-xs font-medium text-zinc-300">氛围参考</span>
                </div>
                {scene.atmosphereRef ? (
                  <p className="text-[10px] text-zinc-300 leading-relaxed line-clamp-4">{scene.atmosphereRef}</p>
                ) : (
                  <p className="text-[10px] text-zinc-600">未设置氛围描述</p>
                )}
              </div>

              {/* Characters Card */}
              <div className="p-4 bg-zinc-800/40 rounded-xl border border-zinc-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">👤</span>
                  <span className="text-xs font-medium text-zinc-300">出场角色 ({scene.characters?.length || 0})</span>
                </div>
                {scene.characters?.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {scene.characters.map((name, i) => (
                      <span key={i} className="px-2 py-0.5 text-[10px] rounded-full bg-green-900/20 text-green-400 border border-green-800/20">{name}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-600">暂无角色</p>
                )}
              </div>

              {/* Props Card */}
              <div className="p-4 bg-zinc-800/40 rounded-xl border border-zinc-700/50">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">🎭</span>
                  <span className="text-xs font-medium text-zinc-300">道具物品 ({scene.props?.length || 0})</span>
                </div>
                {scene.props && scene.props.length > 0 ? (
                  <div className="space-y-1">
                    {scene.props.slice(0, 4).map((prop, i) => {
                      const typeOpt = PROP_TYPE_OPTIONS.find(o => o.value === prop.type);
                      return (
                        <div key={i} className="flex items-center gap-1.5 text-[10px]">
                          <span>{typeOpt?.icon || "📌"}</span>
                          <span className="text-zinc-300 truncate">{prop.name}</span>
                          {prop.holder && <span className="text-zinc-600">({prop.holder})</span>}
                        </div>
                      );
                    })}
                    {scene.props.length > 4 && <p className="text-[9px] text-zinc-600">...还有 {scene.props.length - 4} 项</p>}
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-600">暂无道具</p>
                )}
              </div>
            </div>

            {/* Location & Time */}
            <div className="p-4 bg-zinc-800/40 rounded-xl border border-zinc-700/50 mb-6">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span>📍</span>
                  <span className="text-xs text-zinc-400">地点：</span>
                  <span className="text-xs text-cyan-300 font-medium">{scene.location || "未设置"}</span>
                </div>
                {scene.timeOfDay && (
                  <div className="flex items-center gap-2">
                    <span>🕐</span>
                    <span className="text-xs text-zinc-400">时间：</span>
                    <span className="text-xs text-amber-300">{scene.timeOfDay}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Scene Description */}
            {scene.description && (
              <div className="p-4 bg-zinc-800/30 rounded-xl border border-zinc-700/30 mb-6">
                <div className="text-[10px] text-zinc-500 mb-1.5">场景描述</div>
                <p className="text-xs text-zinc-300 leading-relaxed">{scene.description}</p>
              </div>
            )}

            {/* Thumbnail Preview */}
            <div className="flex items-center justify-center">
              {!scene.thumbnailUrl ? (
                <div className="text-center max-w-md">
                  <div className="w-56 h-36 mx-auto rounded-lg border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center bg-zinc-900/30 mb-3">
                    <svg className="w-10 h-10 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-sm text-zinc-500 mt-1">场景画面</span>
                  </div>
                  <p className="text-xs text-zinc-500">点击"生成场景图"创建此幕的视觉参考</p>
                </div>
              ) : (
                <img src={scene.thumbnailUrl} alt={scene.title} className="max-h-[360px] max-w-full object-contain rounded-lg shadow-xl" />
              )}
            </div>
          </div>

          {/* Bottom Toolbar */}
          <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3 text-[10px] text-zinc-500">
              <span>地点：{scene.location || "—"}</span>
              <span>|</span>
              <span>角色：{scene.characters?.length || 0}人</span>
              <span>|</span>
              <span>道具：{scene.props?.length || 0}件</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  if (!scene.description && !scene.atmosphereRef) { alert("请先填写场景描述或氛围"); return; }
                  try {
                    const res = await fetch("/api/ai/optimize-text", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ text: scene.description || scene.atmosphereRef, type: "scene" }),
                    });
                    if (res.ok) {
                      const { result } = await res.json();
                      if (result) onUpdate({ description: result });
                    }
                  } catch { /* ignore */ }
                }}
                className="px-3 py-1.5 text-xs bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700"
              >AI优化</button>
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >确认使用</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
