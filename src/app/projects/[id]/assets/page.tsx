"use client";

import { use } from "react";
import { AssetLibrary } from "@/components/asset-library/AssetLibrary";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AssetsPage({ params }: PageProps) {
  const { id: projectId } = use(params);

  return (
    <div className="h-screen flex flex-col bg-[#0d0d1f]">
      {/* Page header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-white/10 flex items-center gap-4">
        <a
          href={`/projects/${projectId}`}
          className="text-white/40 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </a>
        <div>
          <h1 className="text-white font-semibold text-lg">素材库</h1>
          <p className="text-white/40 text-xs mt-0.5">管理项目的所有参考图、角色、场景、道具和生成素材</p>
        </div>
      </div>

      {/* Asset library - takes remaining height */}
      <div className="flex-1 overflow-hidden">
        <AssetLibrary projectId={projectId} />
      </div>
    </div>
  );
}
