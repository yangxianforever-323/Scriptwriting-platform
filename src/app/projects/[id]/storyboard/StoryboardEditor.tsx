"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Storyboard, Shot } from "@/types/storyboard";
import type { Story } from "@/types/story";
import { ShotList } from "./components/ShotList";
import { ShotEditor } from "./components/ShotEditor";
import { StoryboardToolbar } from "./components/StoryboardToolbar";
import { VersionManager } from "./components/VersionManager";

interface StoryboardEditorProps {
  storyboard: Storyboard;
  shots: Shot[];
  story: Story | null;
  onUpdate: (storyboard: Storyboard, shots: Shot[]) => void;
}

export function StoryboardEditor({ storyboard, shots, story, onUpdate }: StoryboardEditorProps) {
  const router = useRouter();
  const [selectedShotId, setSelectedShotId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "timeline">("grid");
  const [showVersionManager, setShowVersionManager] = useState(false);

  const selectedShot = shots.find((s) => s.id === selectedShotId) || null;

  const handleShotSelect = (shot: Shot) => {
    setSelectedShotId(shot.id);
  };

  const handleShotDoubleClick = (shot: Shot) => {
    router.push(`/projects/${storyboard.projectId}/storyboard/${shot.id}`);
  };

  const handleShotUpdate = (updatedShot: Shot) => {
    const updatedShots = shots.map((s) =>
      s.id === updatedShot.id ? updatedShot : s
    );
    onUpdate(storyboard, updatedShots);
  };

  const handleShotsUpdate = (updatedShots: Shot[]) => {
    onUpdate(storyboard, updatedShots);
  };

  const handleAddShot = () => {
    // This will be handled by the ShotList component
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <StoryboardToolbar
        storyboard={storyboard}
        shots={shots}
        story={story}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onAddShot={handleAddShot}
        onOpenVersionManager={() => setShowVersionManager(true)}
        onShotsGenerated={(newShots) => {
          onUpdate(storyboard, newShots);
        }}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shot List */}
        <div className="lg:col-span-2">
          <ShotList
            shots={shots}
            story={story}
            viewMode={viewMode}
            selectedShotId={selectedShotId}
            onSelectShot={handleShotSelect}
            onShotDoubleClick={handleShotDoubleClick}
            onUpdateShots={handleShotsUpdate}
          />
        </div>

        {/* Shot Editor Panel */}
        <div className="lg:col-span-1">
          <ShotEditor
            shot={selectedShot}
            story={story}
            onUpdate={handleShotUpdate}
            onEditFull={() => {
              if (selectedShot) {
                router.push(`/projects/${storyboard.projectId}/storyboard/${selectedShot.id}`);
              }
            }}
          />
        </div>
      </div>

      {/* Version Manager Modal */}
      {showVersionManager && (
        <VersionManager
          projectId={storyboard.projectId}
          currentStoryboard={storyboard}
          onClose={() => setShowVersionManager(false)}
          onSwitchVersion={(newStoryboard, newShots) => {
            onUpdate(newStoryboard, newShots);
            setShowVersionManager(false);
          }}
        />
      )}
    </div>
  );
}
