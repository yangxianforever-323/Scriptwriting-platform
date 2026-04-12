export type TaskType = "image" | "video" | "analyze_novel" | "analyze_script" | "generate_storyboard" | "optimize_content";

export type TaskStatus = "pending" | "queued" | "processing" | "completed" | "failed" | "cancelled";

export interface GenerationTask {
  id: string;
  projectId: string;
  sceneId?: string;
  type: TaskType;
  status: TaskStatus;
  priority: number;
  progress: number;
  error?: string;
  result?: unknown;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  metadata: Record<string, unknown>;
}

export interface TaskQueueState {
  tasks: GenerationTask[];
  isProcessing: boolean;
  currentTaskId: string | null;
}
