"use client";

import { useState, useEffect } from "react";
import type {
  ShotType,
  CameraMovement,
  CompositionType,
  LightingType,
  CameraAngle,
  DepthOfField,
  ShotConfiguration,
  GeneratedPrompt,
} from "@/lib/shot-language/types";

interface ShotTypeOption {
  code: string;
  name: string;
  nameEn: string;
  description: string;
}

interface ShotDesignerProps {
  sceneDescription?: string;
  onConfigChange?: (config: Partial<ShotConfiguration>) => void;
  onPromptsGenerated?: (prompts: GeneratedPrompt) => void;
}

export function ShotDesigner({
  sceneDescription = "",
  onConfigChange,
  onPromptsGenerated,
}: ShotDesignerProps) {
  const [shotTypes, setShotTypes] = useState<ShotTypeOption[]>([]);
  const [cameraMovements, setCameraMovements] = useState<ShotTypeOption[]>([]);
  const [compositions, setCompositions] = useState<ShotTypeOption[]>([]);
  const [lightingTypes, setLightingTypes] = useState<ShotTypeOption[]>([]);
  const [cameraAngles, setCameraAngles] = useState<ShotTypeOption[]>([]);
  const [depthOfFieldOptions, setDepthOfFieldOptions] = useState<ShotTypeOption[]>([]);

  const [config, setConfig] = useState<Partial<ShotConfiguration>>({
    shotType: "MS",
    cameraMovement: "static",
    composition: "rule_of_thirds",
    lighting: "natural",
    cameraAngle: "eye_level",
    depthOfField: "shallow",
    duration: 3,
  });

  const [generatedPrompts, setGeneratedPrompts] = useState<GeneratedPrompt | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch("/api/shot-language?type=all")
      .then((res) => res.json())
      .then((data) => {
        if (data.shotTypes) setShotTypes(data.shotTypes);
        if (data.cameraMovements) setCameraMovements(data.cameraMovements);
        if (data.compositions) setCompositions(data.compositions);
        if (data.lighting) setLightingTypes(data.lighting);
        if (data.cameraAngles) setCameraAngles(data.cameraAngles);
        if (data.depthOfField) setDepthOfFieldOptions(data.depthOfField);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (sceneDescription && config.shotType) {
      generatePrompts();
    }
  }, [sceneDescription, config]);

  const updateConfig = <K extends keyof ShotConfiguration>(
    key: K,
    value: ShotConfiguration[K]
  ) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  const generatePrompts = async () => {
    if (!sceneDescription) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/shot-language", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          description: sceneDescription,
          options: config,
        }),
      });
      const data = await res.json();
      setGeneratedPrompts(data.prompts);
      onPromptsGenerated?.(data.prompts);
    } catch (error) {
      console.error("Failed to generate prompts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const SelectField = ({
    label,
    value,
    options,
    onChange,
  }: {
    label: string;
    value: string;
    options: ShotTypeOption[];
    onChange: (value: string) => void;
  }) => (
    <div className="space-y-1">
      <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
      >
        {options.map((opt) => (
          <option key={opt.code} value={opt.code}>
            {opt.name} ({opt.nameEn})
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        专业镜头配置
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <SelectField
          label="景别"
          value={config.shotType || "MS"}
          options={shotTypes}
          onChange={(v) => updateConfig("shotType", v as ShotType)}
        />

        <SelectField
          label="运镜"
          value={config.cameraMovement || "static"}
          options={cameraMovements}
          onChange={(v) => updateConfig("cameraMovement", v as CameraMovement)}
        />

        <SelectField
          label="构图"
          value={config.composition || "rule_of_thirds"}
          options={compositions}
          onChange={(v) => updateConfig("composition", v as CompositionType)}
        />

        <SelectField
          label="光影"
          value={config.lighting || "natural"}
          options={lightingTypes}
          onChange={(v) => updateConfig("lighting", v as LightingType)}
        />

        <SelectField
          label="角度"
          value={config.cameraAngle || "eye_level"}
          options={cameraAngles}
          onChange={(v) => updateConfig("cameraAngle", v as CameraAngle)}
        />

        <SelectField
          label="景深"
          value={config.depthOfField || "shallow"}
          options={depthOfFieldOptions}
          onChange={(v) => updateConfig("depthOfField", v as DepthOfField)}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
          时长 (秒)
        </label>
        <input
          type="number"
          min={1}
          max={30}
          value={config.duration || 3}
          onChange={(e) => updateConfig("duration", parseInt(e.target.value, 10))}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
      </div>

      {generatedPrompts && (
        <div className="space-y-3 rounded-md bg-zinc-50 p-3 dark:bg-zinc-800">
          <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            生成的Prompt
          </h4>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">图片Prompt:</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                {generatedPrompts.imagePrompt.slice(0, 200)}...
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">视频Prompt:</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                {generatedPrompts.videoPrompt.slice(0, 200)}...
              </p>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
        </div>
      )}
    </div>
  );
}
