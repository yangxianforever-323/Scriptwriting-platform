"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";

interface AIGenerateImageProps {
  type: "character" | "location" | "prop" | "scene";
  data: {
    name?: string;
    appearance?: string;
    description?: string;
    personality?: string;
    atmosphere?: string;
    importance?: string;
    characters?: string[];
    location?: string;
    props?: string[];
    mood?: string;
    shotType?: string;
  };
  /** Called when user confirms applying a generated/uploaded image to the project */
  onApplyImage?: (url: string) => void;
  /** Called with all generated image URLs */
  onImageGenerated?: (images: Array<{ url: string; view?: string }>) => void;
}

const STYLE_OPTIONS = [
  { value: "realistic", label: "写实风", icon: "📷" },
  { value: "anime", label: "动漫风", icon: "🎨" },
  { value: "cinematic", label: "电影质感", icon: "🎬" },
  { value: "watercolor", label: "水彩画", icon: "🖼️" },
  { value: "cyberpunk", label: "赛博朋克", icon: "🌆" },
  { value: "fantasy", label: "奇幻风格", icon: "✨" },
];

const ASPECT_RATIOS = [
  { value: "1:1", label: "1:1", size: "1024x1024" },
  { value: "3:4", label: "3:4", size: "HD(1024*1536)" },
  { value: "16:9", label: "16:9", size: "1536x1024" },
];

export function AIGenerateImage({ type, data, onApplyImage, onImageGenerated }: AIGenerateImageProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("realistic");
  const [aspectRatio, setAspectRatio] = useState(type === "character" ? "3:4" : "16:9");
  const [count, setCount] = useState(4);
  const [customPrompt, setCustomPrompt] = useState("");
  const [generatedImages, setGeneratedImages] = useState<Array<{ url: string; view?: string; fileName?: string }>>([]);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getDefaultPrompt = (): string => {
    switch (type) {
      case "character":
        return `${data.name || "角色"}，${data.appearance || data.description || ""}，${data.personality || ""}`;
      case "location":
        return `${data.name || "场景"}，${data.description || ""}，${data.atmosphere || ""}`;
      case "prop":
        return `${data.name || "道具"}，${data.description || ""}，${data.importance || ""}`;
      case "scene":
        return `${data.description || ""}${data.characters?.length ? `，角色：${data.characters.join("、")}` : ""}${data.location ? `，地点：${data.location}` : ""}${data.mood ? `，氛围：${data.mood}` : ""}`;
      default:
        return customPrompt;
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setSelectedUrl(null);

    try {
      const prompt = customPrompt.trim() || getDefaultPrompt();
      const selectedSize = ASPECT_RATIOS.find((ar) => ar.value === aspectRatio)?.size || "1024x1024";

      const response = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          prompt,
          style: selectedStyle,
          size: selectedSize,
          n: count,
          ...data,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "生成失败");

      let images: Array<{ url: string; view?: string; fileName?: string }> = [];
      if (result.images) {
        images = result.images.map((img: { url: string; view?: string; fileName?: string }) => ({
          url: img.url,
          view: img.view,
          fileName: img.fileName,
        }));
      } else if (result.url) {
        images = [{ url: result.url, fileName: result.fileName }];
      }

      setGeneratedImages(images);
      onImageGenerated?.(images);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败，请重试");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload-image", { method: "POST", body: fd });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "上传失败");

      const newImage = { url: result.url };
      setGeneratedImages((prev) => [newImage, ...prev]);
      setSelectedUrl(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleApply = () => {
    if (selectedUrl && onApplyImage) {
      onApplyImage(selectedUrl);
    }
  };

  const handleDownload = (url: string, fileName?: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || `image-${Date.now()}.png`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-green-500">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="font-medium">AI图像生成</span>
        <span className="text-xs text-zinc-500">
          基于{type === "character" ? "角色描述" : type === "location" ? "场景设定" : type === "prop" ? "道具细节" : "分镜内容"}生成参考形象
        </span>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Prompt */}
      <div>
        <label className="block text-sm font-medium mb-1.5">
          生成提示词
          <span className="text-zinc-400 font-normal ml-2 text-xs">
            ({(customPrompt || getDefaultPrompt()).length} 字符)
          </span>
        </label>
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder={getDefaultPrompt()}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm resize-none"
        />
        {!customPrompt && (
          <p className="mt-1 text-xs text-zinc-400">留空将自动根据信息生成提示词</p>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1 text-zinc-600 dark:text-zinc-400">比例</label>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
          >
            {ASPECT_RATIOS.map((ar) => (
              <option key={ar.value} value={ar.value}>{ar.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1 text-zinc-600 dark:text-zinc-400">数量</label>
          <div className="flex items-center gap-1">
            {[2, 4, 6, 8].map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`flex-1 h-8 rounded text-sm font-medium transition-colors ${
                  count === n
                    ? "bg-blue-500 text-white"
                    : "bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1 text-zinc-600 dark:text-zinc-400">风格</label>
          <select
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
          >
            {STYLE_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.icon} {s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button onClick={handleGenerate} disabled={isGenerating} className="flex-1">
          {isGenerating ? (
            <>
              <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              生成中...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI生成图片
            </>
          )}
        </Button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
        <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading} title="上传本地图片">
          {isUploading ? (
            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          )}
          <span className="ml-1 text-sm">上传图片</span>
        </Button>
      </div>

      {/* Results */}
      {generatedImages.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                生成结果（{generatedImages.length} 张）
              </h3>
              {selectedUrl && (
                <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  已选中
                </span>
              )}
            </div>
            <button
              onClick={() => { setGeneratedImages([]); setSelectedUrl(null); }}
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              清除全部
            </button>
          </div>

          <p className="text-xs text-zinc-400">
            点击图片选择，再点击"应用到项目"即可保存到角色/场景
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {generatedImages.map((img, index) => (
              <div
                key={index}
                onClick={() => setSelectedUrl(img.url === selectedUrl ? null : img.url)}
                className={`group relative rounded-lg overflow-hidden cursor-pointer transition-all border-2 ${
                  selectedUrl === img.url
                    ? "border-green-500 ring-2 ring-green-500/30 shadow-md"
                    : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                }`}
              >
                <div className="aspect-square bg-zinc-100 dark:bg-zinc-800">
                  <img
                    src={img.url}
                    alt={`image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {selectedUrl === img.url && (
                  <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center pointer-events-none">
                    <div className="bg-green-500 rounded-full p-1.5 shadow">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}

                <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDownload(img.url, img.fileName); }}
                    className="p-1 bg-white/90 dark:bg-zinc-800/90 rounded-full shadow-sm hover:bg-white"
                    title="下载"
                  >
                    <svg className="w-3.5 h-3.5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                </div>

                {img.view && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 pointer-events-none">
                    <p className="text-white text-xs truncate">{img.view}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {onApplyImage && (
            <Button onClick={handleApply} disabled={!selectedUrl} className="w-full">
              {selectedUrl ? (
                <>
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  应用到项目
                </>
              ) : (
                "请先点击选择一张图片"
              )}
            </Button>
          )}
        </div>
      ) : (
        !isGenerating && (
          <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg p-8 text-center">
            <svg className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-zinc-400">点击"AI生成图片"或"上传图片"添加参考图</p>
          </div>
        )
      )}
    </div>
  );
}
