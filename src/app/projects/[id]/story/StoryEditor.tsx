"use client";

import { useState } from "react";
import type { Story } from "@/types/story";
import { CharactersTab } from "./tabs/CharactersTab";
import { LocationsTab } from "./tabs/LocationsTab";
import { PropsTab } from "./tabs/PropsTab";
import { ActsTab } from "./tabs/ActsTab";
import { StoryOverviewTab } from "./tabs/StoryOverviewTab";

type TabType = "overview" | "acts" | "characters" | "locations" | "props";

interface StoryEditorProps {
  story: Story;
  onUpdate: (story: Story) => void;
}

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: "overview", label: "概览", icon: "📋" },
  { id: "acts", label: "分幕/场景", icon: "🎬" },
  { id: "characters", label: "角色", icon: "👤" },
  { id: "locations", label: "场景地点", icon: "🏞️" },
  { id: "props", label: "道具", icon: "🎭" },
];

export function StoryEditor({ story, onUpdate }: StoryEditorProps) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <nav className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "overview" && (
          <StoryOverviewTab story={story} onUpdate={onUpdate} />
        )}
        {activeTab === "acts" && (
          <ActsTab story={story} />
        )}
        {activeTab === "characters" && (
          <CharactersTab story={story} />
        )}
        {activeTab === "locations" && (
          <LocationsTab story={story} />
        )}
        {activeTab === "props" && (
          <PropsTab story={story} />
        )}
      </div>
    </div>
  );
}
