"use client";

import { useState } from "react";
import { DeleteProjectButton } from "@/components/project/DeleteProjectButton";

interface ProjectActionsProps {
  projectId: string;
  projectTitle: string;
}

export function ProjectActions({ projectId, projectTitle }: ProjectActionsProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setIsEditing(!isEditing)}
        className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        {isEditing ? "取消编辑" : "编辑项目"}
      </button>
      <DeleteProjectButton projectId={projectId} projectTitle={projectTitle} />
    </div>
  );
}
