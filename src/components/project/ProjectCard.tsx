"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectWithPreview } from "@/lib/db/projects-list";

/**
 * Stage display configuration - New stage system
 */
const stageConfig: Record<
  string,
  { label: string; className: string }
> = {
  // Old stages (for backward compatibility)
  draft: { label: "草稿", className: "bg-zinc-100 text-zinc-600" },
  scenes: { label: "分镜", className: "bg-blue-100 text-blue-700" },
  images: { label: "图片", className: "bg-purple-100 text-purple-700" },
  videos: { label: "视频", className: "bg-orange-100 text-orange-700" },
  completed: { label: "完成", className: "bg-green-100 text-green-700" },
  // New stages
  planning: { label: "规划中", className: "bg-zinc-100 text-zinc-600" },
  story: { label: "故事开发", className: "bg-blue-100 text-blue-700" },
  storyboard: { label: "分镜设计", className: "bg-purple-100 text-purple-700" },
  production: { label: "素材创作", className: "bg-orange-100 text-orange-700" },
  complete: { label: "已完成", className: "bg-green-100 text-green-700" },
};

/**
 * Style display names
 */
const styleNames: Record<string, string> = {
  realistic: "写实风格",
  anime: "动漫风格",
  cartoon: "卡通风格",
  cinematic: "电影风格",
  watercolor: "水彩风格",
  oil_painting: "油画风格",
  sketch: "素描风格",
  cyberpunk: "赛博朋克",
  fantasy: "奇幻风格",
  scifi: "科幻风格",
};

interface ProjectCardProps {
  project: ProjectWithPreview;
}

/**
 * Project card component for displaying in the project list.
 */
export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Use current_stage if available, fallback to stage
  const stageKey = (project as { current_stage?: string }).current_stage || project.stage;
  const stage = stageConfig[stageKey] || { label: "未知", className: "bg-gray-100 text-gray-600" };
  const styleName = project.style
    ? styleNames[project.style] ?? project.style
    : null;
  const createdDate = new Date(project.created_at).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "删除失败");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("删除失败，请重试");
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowConfirm(false);
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700">
      {/* Delete Button */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className={`absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
          showConfirm
            ? "bg-red-500 text-white hover:bg-red-600"
            : "bg-red-100 text-red-600 opacity-0 group-hover:opacity-100 hover:bg-red-200"
        }`}
        title={showConfirm ? "确认删除" : "删除项目"}
      >
        {isDeleting ? (
          <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        )}
        {showConfirm ? "确认删除" : "删除"}
      </button>

      {/* Cancel Delete Button */}
      {showConfirm && (
        <button
          onClick={handleCancelDelete}
          className="absolute right-20 top-2 z-10 flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 transition-all hover:bg-zinc-200"
        >
          取消
        </button>
      )}

      <Link href={`/projects/${project.id}`}>
        {/* Preview Image */}
        <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          {project.preview_image_url ? (
            <Image
              src={project.preview_image_url}
              alt={project.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <svg
                className="h-12 w-12 text-zinc-300 dark:text-zinc-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
          {/* Stage Badge */}
          <div
            className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-xs font-medium ${stage.className}`}
          >
            {stage.label}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-4">
          <h3 className="mb-1 line-clamp-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {project.title}
          </h3>

          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            {styleName && (
              <span className="rounded-md bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
                {styleName}
              </span>
            )}
            {project.scene_count > 0 && (
              <span>{project.scene_count} 个分镜</span>
            )}
          </div>

          <p className="mb-3 line-clamp-2 flex-1 text-sm text-zinc-600 dark:text-zinc-400">
            {project.story ?? "暂无故事内容"}
          </p>

          <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
            <span>创建于 {createdDate}</span>
            <svg
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </Link>
    </div>
  );
}
