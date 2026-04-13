"use client";

import { useState } from "react";
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
  onImageGenerated?: (images: Array<{ url: string; view?: string }>) => void;
}

const CHARACTER_VIEWS = [
  { value: "front", label: "全身正面", desc: "完整展示角色外观" },
  { value: "side", label: "侧像特写", desc: "展示侧面轮廓" },
  { value: "back", label: "背面视图", desc: "展示背面造型" },
  { value: "three_quarter", label: "组合图", desc: "四分之三角度" },
  { value: "close_up", label: "特写三线", desc: "面部表情特写" },
];

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

export function AIGenerateImage({ type, data, onImageGenerated }: AIGenerateImageProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedViews, setSelectedViews] = useState<string[]>(["front", "side", "back", "three_quarter", "close_up"]);
  const [selectedStyle, setSelectedStyle] = useState("realistic");
  const [aspectRatio, setAspectRatio] = useState("3:4");
  const [count, setCount] = useState(4);
  const [customPrompt, setCustomPrompt] = useState("");
  const [generatedImages, setGeneratedImages] = useState<Array<{ url: string; view?: string; fileName?: string }>>([]);
  const [error, setError] = useState<string | null>(null);

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

  const handleToggleView = (view: string) => {
    setSelectedViews((prev) =>
      prev.includes(view) ? prev.filter((v) => v !== view) : [...prev, view]
    );
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);

    try {
      const prompt = customPrompt.trim() || getDefaultPrompt();
      const selectedSize = ASPECT_RATIOS.find((ar) => ar.value === aspectRatio)?.size || "1024x1024";

      const requestBody: Record<string, unknown> = {
        type,
        prompt,
        style: selectedStyle,
        size: selectedSize,
        n: count,
        ...data,
      };

      if (type === "character") {
        requestBody.views = selectedViews;
        requestBody.name = data.name;
        requestBody.appearance = data.appearance || data.description;
        requestBody.personality = data.personality;
      }

      console.log("Sending image generation request:", requestBody);

      const response = await fetch("/api/ai/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to generate image");
      }

      console.log("Image generation result:", result);

      let images: Array<{ url: string; view?: string; fileName?: string }> = [];

      if (type === "character" && result.images) {
        images = result.images.map((img: { url: string; view: string }) => ({
          url: img.url,
          view: img.view,
          fileName: img.fileName,
        }));
      } else if (result.url) {
        images = [{ url: result.url, fileName: result.fileName }];
      } else if (result.images) {
        images = result.images.map((img: { url: string; fileName: string }) => ({
          url: img.url,
          fileName: img.fileName,
        }));
      }

      setGeneratedImages(images);
      onImageGenerated?.(images);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Image generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (url: string, fileName?: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || `generated-image-${Date.now()}.png`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAll = async () => {
    for (const img of generatedImages) {
      handleDownload(img.url, img.fileName);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-green-500">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="font-medium">AI图像生成</span>
        <span className="text-xs text-zinc-500">基于{type === "character" ? "角色描述" : type === "location" ? "场景设定" : type === "prop" ? "道具细节" : "分镜内容"}生成参考形象</span>
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {type === "character" && (
        <div>
          <label className="block text-sm font-medium mb-2">生成类型</label>
          <div className="flex flex-wrap gap-2">
            {CHARACTER_VIEWS.map((view) => (
              <button
                key={view.value}
                onClick={() => handleToggleView(view.value)}
                className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                  selectedViews.includes(view.value)
                    ? "bg-green-500 text-white border-green-500"
                    : "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 hover:border-green-400"
                }`}
              >
                <div className="font-medium">{view.label}</div>
                <div className="text-xs opacity-75">{view.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">
          生成提示词
          <span className="text-zinc-400 font-normal ml-2">
            ({customPrompt.length || getDefaultPrompt().length} 字符)
          </span>
        </label>
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder={getDefaultPrompt()}
          rows={4}
          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm resize-none"
        />
        {!customPrompt && (
          <p className="mt-1 text-xs text-zinc-400">留空将使用默认提示词</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">分辨率</label>
          <select
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
          >
            {ASPECT_RATIOS.map((ar) => (
              <option key={ar.value} value={ar.value}>
                {ar.label} ({ar.size})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">生成数量</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={8}
              value={count}
              onChange={(e) => setCount(Math.min(8, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-20 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
            />
            <div className="flex gap-1">
              {[2, 4, 6, 8].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`w-8 h-8 rounded text-sm ${
                    count === n
                      ? "bg-blue-500 text-white"
                      : "bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">风格</label>
          <select
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
          >
            {STYLE_OPTIONS.map((style) => (
              <option key={style.value} value={style.value}>
                {style.icon} {style.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">风格预设</label>
        <div className="grid grid-cols-3 gap-2">
          {STYLE_OPTIONS.map((style) => (
            <button
              key={style.value}
              onClick={() => setSelectedStyle(style.value)}
              className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                selectedStyle === style.value
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
              }`}
            >
              {style.icon} {style.label}
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full py-3 text-lg"
      >
        {isGenerating ? (
          <>
            <div className="animate-spin -ml-1 mr-2 h-5 w-5 border-2 border-current border-t-transparent rounded-full"></div>
            正在生成中...
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            生成图片
          </>
        )}
      </Button>

      {generatedImages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">
              生成结果 ({generatedImages.length} 张)
            </h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportAll}>
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                导出全部图片
              </Button>
              <Button variant="outline" size="sm" onClick={() => {
                setGeneratedImages([]);
                onImageGenerated?.([]);
              }}>
                清除结果
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {generatedImages.map((img, index) => (
              <div
                key={index}
                className="group relative border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg overflow-hidden hover:border-green-400 transition-colors"
              >
                <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center p-2">
                  {img.url.startsWith("/uploads") ? (
                    <img
                      src={img.url}
                      alt={`${type} ${img.view || `image ${index + 1}`}`}
                      className="w-full h-full object-contain rounded"
                    />
                  ) : (
                    <div className="text-center">
                      <svg className="w-12 h-12 mx-auto text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-zinc-400 mt-2">图片加载中...</p>
                    </div>
                  )}
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs font-medium truncate">
                    {img.view || `图片 ${index + 1}`}
                  </p>
                </div>

                <button
                  onClick={() => handleDownload(img.url, img.fileName)}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                  title="下载图片"
                >
                  <svg className="w-4 h-4 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {type !== "character" && generatedImages.length > 0 && (
            <p className="text-xs text-zinc-500 text-center">
              组合图视角：{selectedStyle === "realistic" ? "写实" : selectedStyle} · 全身三线图
              左侧/右侧/背三个角度的全身形象
            </p>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-700">
        <Button variant="outline" size="sm">
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          刷新构图
        </Button>
        <Button variant="outline" size="sm">
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          风格化
        </Button>
        <Button size="sm">
          <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          确认使用
        </Button>
      </div>
    </div>
  );
}
