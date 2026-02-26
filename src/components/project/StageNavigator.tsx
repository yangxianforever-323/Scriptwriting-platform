"use client";

import { useRouter } from "next/navigation";
import type { Project, project_stage_v2 } from "@/types/database";

interface StageNavigatorProps {
  project: Project;
  currentStage?: project_stage_v2;
}

const STAGES: { id: project_stage_v2; label: string; icon: string }[] = [
  { id: "planning", label: "项目规划", icon: "📋" },
  { id: "story", label: "故事开发", icon: "📝" },
  { id: "storyboard", label: "分镜设计", icon: "🎬" },
  { id: "production", label: "素材创作", icon: "🎨" },
  { id: "complete", label: "项目完成", icon: "✅" },
];

export function StageNavigator({ project, currentStage }: StageNavigatorProps) {
  const router = useRouter();
  const stageProgress = project.stage_progress || {
    planning: { status: "active" },
    story: { status: "locked" },
    storyboard: { status: "locked" },
    production: { status: "locked" },
    complete: { status: "locked" },
  };

  const handleStageClick = (stageId: project_stage_v2) => {
    const stage = stageProgress[stageId];
    if (stage.status === "locked") return;
    
    router.push(`/projects/${project.id}/${stageId}`);
  };

  const getStageStatus = (stageId: project_stage_v2) => {
    return stageProgress[stageId]?.status || "locked";
  };

  const getProgressPercentage = () => {
    const completedStages = STAGES.filter(
      (s) => stageProgress[s.id]?.status === "completed"
    ).length;
    return (completedStages / STAGES.length) * 100;
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
      {/* Progress Bar */}
      <div className="px-6 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            项目进度
          </span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {Math.round(getProgressPercentage())}%
          </span>
        </div>
        <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* Stage Steps */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between">
          {STAGES.map((stage, index) => {
            const status = getStageStatus(stage.id);
            const isActive = currentStage === stage.id;
            const isLast = index === STAGES.length - 1;

            return (
              <div key={stage.id} className="flex items-center flex-1">
                {/* Stage Button */}
                <button
                  onClick={() => handleStageClick(stage.id)}
                  disabled={status === "locked"}
                  className={`
                    relative flex flex-col items-center group
                    ${status === "locked" ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                  `}
                >
                  {/* Stage Circle */}
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-lg
                      transition-all duration-300 border-2
                      ${status === "completed"
                        ? "bg-green-500 border-green-500 text-white"
                        : status === "active"
                        ? isActive
                          ? "bg-blue-500 border-blue-500 text-white ring-4 ring-blue-100 dark:ring-blue-900"
                          : "bg-white dark:bg-zinc-800 border-blue-500 text-blue-500"
                        : "bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 text-zinc-400"
                      }
                    `}
                  >
                    {status === "completed" ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span>{stage.icon}</span>
                    )}
                  </div>

                  {/* Stage Label */}
                  <span
                    className={`
                      mt-2 text-xs font-medium whitespace-nowrap
                      ${status === "completed"
                        ? "text-green-600 dark:text-green-400"
                        : status === "active"
                        ? isActive
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-zinc-600 dark:text-zinc-400"
                        : "text-zinc-400 dark:text-zinc-500"
                      }
                    `}
                  >
                    {stage.label}
                  </span>

                  {/* Status Indicator */}
                  {status === "active" && !isActive && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full animate-pulse" />
                  )}
                </button>

                {/* Connector Line */}
                {!isLast && (
                  <div className="flex-1 h-0.5 mx-2">
                    <div
                      className={`
                        h-full transition-all duration-500
                        ${status === "completed"
                          ? "bg-green-500"
                          : "bg-zinc-200 dark:bg-zinc-700"
                        }
                      `}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Stage Info */}
      {currentStage && (
        <div className="px-6 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">当前阶段</span>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {STAGES.find((s) => s.id === currentStage)?.label}
              </h2>
            </div>
            <div className="flex gap-2">
              {stageProgress[currentStage]?.status === "completed" ? (
                <span className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                  已完成
                </span>
              ) : (
                <span className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                  进行中
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
