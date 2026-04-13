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
  onImageGenerated?: (images: Array&lt;{ url: string; view?: string }&gt;) =&gt; void;
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
  const [selectedViews, setSelectedViews] = useState&lt;string[]&gt;(["front", "side", "back", "three_quarter", "close_up"]);
  const [selectedStyle, setSelectedStyle] = useState("realistic");
  const [aspectRatio, setAspectRatio] = useState("3:4");
  const [count, setCount] = useState(4);
  const [customPrompt, setCustomPrompt] = useState("");
  const [generatedImages, setGeneratedImages] = useState&lt;Array&lt;{ url: string; view?: string; fileName?: string }&gt;&gt;([]);
  const [error, setError] = useState&lt;string | null&gt;(null);

  const getDefaultPrompt = (): string =&gt; {
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

  const handleToggleView = (view: string) =&gt; {
    setSelectedViews((prev) =&gt;
      prev.includes(view) ? prev.filter((v) =&gt; v !== view) : [...prev, view]
    );
  };

  const handleGenerate = async () =&gt; {
    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);

    try {
      const prompt = customPrompt.trim() || getDefaultPrompt();
      const selectedSize = ASPECT_RATIOS.find((ar) =&gt; ar.value === aspectRatio)?.size || "1024x1024";

      const requestBody: Record&lt;string, unknown&gt; = {
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

      let images: Array&lt;{ url: string; view?: string; fileName?: string }&gt; = [];

      if (type === "character" &amp;&amp; result.images) {
        images = result.images.map((img: { url: string; view: string }) =&gt; ({
          url: img.url,
          view: img.view,
          fileName: img.fileName,
        }));
      } else if (result.url) {
        images = [{ url: result.url, fileName: result.fileName }];
      } else if (result.images) {
        images = result.images.map((img: { url: string; fileName: string }) =&gt; ({
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

  const handleDownload = (url: string, fileName?: string) =&gt; {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName || `generated-image-${Date.now()}.png`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAll = async () =&gt; {
    for (const img of generatedImages) {
      handleDownload(img.url, img.fileName);
    }
  };

  return (
    &lt;div className="space-y-6"&gt;
      &lt;div className="flex items-center gap-2 text-green-500"&gt;
        &lt;svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"&gt;
          &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /&gt;
        &lt;/svg&gt;
        &lt;span className="font-medium"&gt;AI图像生成&lt;/span&gt;
        &lt;span className="text-xs text-zinc-500"&gt;基于{type === "character" ? "角色描述" : type === "location" ? "场景设定" : type === "prop" ? "道具细节" : "分镜内容"}生成参考形象&lt;/span&gt;
      &lt;/div&gt;

      {error &amp;&amp; (
        &lt;div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400"&gt;
          &lt;div className="flex items-center gap-2"&gt;
            &lt;svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"&gt;
              &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /&gt;
            &lt;/svg&gt;
            {error}
          &lt;/div&gt;
        &lt;/div&gt;
      )}

      {type === "character" &amp;&amp; (
        &lt;div&gt;
          &lt;label className="block text-sm font-medium mb-2"&gt;生成类型&lt;/label&gt;
          &lt;div className="flex flex-wrap gap-2"&gt;
            {CHARACTER_VIEWS.map((view) =&gt; (
              &lt;button
                key={view.value}
                onClick={() =&gt; handleToggleView(view.value)}
                className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                  selectedViews.includes(view.value)
                    ? "bg-green-500 text-white border-green-500"
                    : "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 hover:border-green-400"
                }`}
              &gt;
                &lt;div className="font-medium"&gt;{view.label}&lt;/div&gt;
                &lt;div className="text-xs opacity-75"&gt;{view.desc}&lt;/div&gt;
              &lt;/button&gt;
            ))}
          &lt;/div&gt;
        &lt;/div&gt;
      )}

      &lt;div&gt;
        &lt;label className="block text-sm font-medium mb-2"&gt;
          生成提示词
          &lt;span className="text-zinc-400 font-normal ml-2"&gt;
            ({customPrompt.length || getDefaultPrompt().length} 字符)
          &lt;/span&gt;
        &lt;/label&gt;
        &lt;textarea
          value={customPrompt}
          onChange={(e) =&gt; setCustomPrompt(e.target.value)}
          placeholder={getDefaultPrompt()}
          rows={4}
          className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm resize-none"
        /&gt;
        {!customPrompt &amp;&amp; (
          &lt;p className="mt-1 text-xs text-zinc-400"&gt;留空将使用默认提示词&lt;/p&gt;
        )}
      &lt;/div&gt;

      &lt;div className="grid grid-cols-3 gap-4"&gt;
        &lt;div&gt;
          &lt;label className="block text-sm font-medium mb-2"&gt;分辨率&lt;/label&gt;
          &lt;select
            value={aspectRatio}
            onChange={(e) =&gt; setAspectRatio(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
          &gt;
            {ASPECT_RATIOS.map((ar) =&gt; (
              &lt;option key={ar.value} value={ar.value}&gt;
                {ar.label} ({ar.size})
              &lt;/option&gt;
            ))}
          &lt;/select&gt;
        &lt;/div&gt;

        &lt;div&gt;
          &lt;label className="block text-sm font-medium mb-2"&gt;生成数量&lt;/label&gt;
          &lt;div className="flex items-center gap-2"&gt;
            &lt;input
              type="number"
              min={1}
              max={8}
              value={count}
              onChange={(e) =&gt; setCount(Math.min(8, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-20 px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
            /&gt;
            &lt;div className="flex gap-1"&gt;
              {[2, 4, 6, 8].map((n) =&gt; (
                &lt;button
                  key={n}
                  onClick={() =&gt; setCount(n)}
                  className={`w-8 h-8 rounded text-sm ${
                    count === n
                      ? "bg-blue-500 text-white"
                      : "bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200"
                  }`}
                &gt;
                  {n}
                &lt;/button&gt;
              ))}
            &lt;/div&gt;
          &lt;/div&gt;
        &lt;/div&gt;

        &lt;div&gt;
          &lt;label className="block text-sm font-medium mb-2"&gt;风格&lt;/label&gt;
          &lt;select
            value={selectedStyle}
            onChange={(e) =&gt; setSelectedStyle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
          &gt;
            {STYLE_OPTIONS.map((style) =&gt; (
              &lt;option key={style.value} value={style.value}&gt;
                {style.icon} {style.label}
              &lt;/option&gt;
            ))}
          &lt;/select&gt;
        &lt;/div&gt;
      &lt;/div&gt;

      &lt;div&gt;
        &lt;label className="block text-sm font-medium mb-2"&gt;风格预设&lt;/label&gt;
        &lt;div className="grid grid-cols-3 gap-2"&gt;
          {STYLE_OPTIONS.map((style) =&gt; (
            &lt;button
              key={style.value}
              onClick={() =&gt; setSelectedStyle(style.value)}
              className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                selectedStyle === style.value
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300"
              }`}
            &gt;
              {style.icon} {style.label}
            &lt;/button&gt;
          ))}
        &lt;/div&gt;
      &lt;/div&gt;

      &lt;Button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full py-3 text-lg"
      &gt;
        {isGenerating ? (
          &lt;&gt;
            &lt;div className="animate-spin -ml-1 mr-2 h-5 w-5 border-2 border-current border-t-transparent rounded-full"&gt;&lt;/div&gt;
            正在生成中...
          &lt;/&gt;
        ) : (
          &lt;&gt;
            &lt;svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"&gt;
              &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /&gt;
            &lt;/svg&gt;
            生成图片
          &lt;/&gt;
        )}
      &lt;/Button&gt;

      {generatedImages.length &gt; 0 &amp;&amp; (
        &lt;div className="space-y-4"&gt;
          &lt;div className="flex items-center justify-between"&gt;
            &lt;h3 className="font-medium"&gt;
              生成结果 ({generatedImages.length} 张)
            &lt;/h3&gt;
            &lt;div className="flex gap-2"&gt;
              &lt;Button variant="outline" size="sm" onClick={handleExportAll}&gt;
                &lt;svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"&gt;
                  &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /&gt;
                &lt;/svg&gt;
                导出全部图片
              &lt;/Button&gt;
              &lt;Button variant="outline" size="sm" onClick={() =&gt; {
                setGeneratedImages([]);
                onImageGenerated?.([]);
              }}&gt;
                清除结果
              &lt;/Button&gt;
            &lt;/div&gt;
          &lt;/div&gt;

          &lt;div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"&gt;
            {generatedImages.map((img, index) =&gt; (
              &lt;div
                key={index}
                className="group relative border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg overflow-hidden hover:border-green-400 transition-colors"
              &gt;
                &lt;div className="aspect-square bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center p-2"&gt;
                  {img.url.startsWith("/uploads") ? (
                    &lt;img
                      src={img.url}
                      alt={`${type} ${img.view || `image ${index + 1}`}`}
                      className="w-full h-full object-contain rounded"
                    /&gt;
                  ) : (
                    &lt;div className="text-center"&gt;
                      &lt;svg className="w-12 h-12 mx-auto text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"&gt;
                        &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /&gt;
                      &lt;/svg&gt;
                      &lt;p className="text-xs text-zinc-400 mt-2"&gt;图片加载中...&lt;/p&gt;
                    &lt;/div&gt;
                  )}
                &lt;/div&gt;
                
                &lt;div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity"&gt;
                  &lt;p className="text-white text-xs font-medium truncate"&gt;
                    {img.view || `图片 ${index + 1}`}
                  &lt;/p&gt;
                &lt;/div&gt;

                &lt;button
                  onClick={() =&gt; handleDownload(img.url, img.fileName)}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                  title="下载图片"
                &gt;
                  &lt;svg className="w-4 h-4 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"&gt;
                    &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /&gt;
                  &lt;/svg&gt;
                &lt;/button&gt;
              &lt;/div&gt;
            ))}
          &lt;/div&gt;

          {type !== "character" &amp;&amp; generatedImages.length &gt; 0 &amp;&amp; (
            &lt;p className="text-xs text-zinc-500 text-center"&gt;
              组合图视角：{selectedStyle === "realistic" ? "写实" : selectedStyle} · 全身三线图
              左侧/右侧/背三个角度的全身形象
            &lt;/p&gt;
          )}
        &lt;/div&gt;
      )}

      &lt;div className="flex justify-end gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-700"&gt;
        &lt;Button variant="outline" size="sm"&gt;
          &lt;svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"&gt;
            &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /&gt;
          &lt;/svg&gt;
          刷新构图
        &lt;/Button&gt;
        &lt;Button variant="outline" size="sm"&gt;
          &lt;svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"&gt;
            &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /&gt;
          &lt;/svg&gt;
          风格化
        &lt;/Button&gt;
        &lt;Button size="sm"&gt;
          &lt;svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"&gt;
            &lt;path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /&gt;
          &lt;/svg&gt;
          确认使用
        &lt;/Button&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  );
}
