"use client";

import { useState, useEffect } from "react";
import type { Story, Location, LocationType } from "@/types/story";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { AIGenerateImage } from "@/components/ai/AIGenerateImage";

interface LocationsTabProps {
  story: Story;
}

const TYPE_OPTIONS: { value: LocationType; label: string }[] = [
  { value: "interior", label: "室内" },
  { value: "exterior", label: "室外" },
  { value: "both", label: "室内外" },
];

export function LocationsTab({ story }: LocationsTabProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [editTab, setEditTab] = useState<"edit" | "ai-generate">("edit");
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Location>>({
    name: "",
    description: "",
    type: "interior",
    atmosphere: "",
    keyFeatures: [],
    referenceImages: [],
  });

  const loadLocations = async () => {
    try {
      const res = await fetch(`/api/projects/${story.projectId}/locations`);
      if (!res.ok) return;
      const locs: Location[] = await res.json();
      setLocations(locs);
    } catch (e) {
      console.error("Failed to load locations", e);
    }
  };

  useEffect(() => {
    loadLocations();
  }, [story.projectId]);

  const handleSave = async () => {
    if (!formData.name?.trim()) return;
    setSaving(true);
    try {
      if (selectedLocation) {
        const res = await fetch(`/api/projects/${story.projectId}/locations/${selectedLocation.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const updated: Location = await res.json();
          setSelectedLocation(updated);
          setFormData({ ...updated, referenceImages: updated.referenceImages || [] });
        }
      } else {
        const res = await fetch(`/api/projects/${story.projectId}/locations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const newLoc: Location = await res.json();
          setSelectedLocation(newLoc);
          setFormData({ ...newLoc, referenceImages: newLoc.referenceImages || [] });
        }
      }
      await loadLocations();
    } catch (e) {
      console.error("Failed to save location", e);
    } finally {
      setSaving(false);
    }
  };

  const handleApplyImage = async (url: string) => {
    const current = formData.referenceImages || [];
    if (current.includes(url)) return;

    const updated = { ...formData, referenceImages: [...current, url] };
    setFormData(updated);

    if (selectedLocation) {
      try {
        const res = await fetch(`/api/projects/${story.projectId}/locations/${selectedLocation.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ referenceImages: updated.referenceImages }),
        });
        if (res.ok) {
          const saved: Location = await res.json();
          setSelectedLocation(saved);
          setFormData({ ...saved, referenceImages: saved.referenceImages || [] });
          await loadLocations();
        }
      } catch (e) {
        console.error("Failed to save image", e);
      }
    }
  };

  const handleRemoveImage = async (url: string) => {
    const newImages = (formData.referenceImages || []).filter((u) => u !== url);
    setFormData({ ...formData, referenceImages: newImages });

    if (selectedLocation) {
      try {
        const res = await fetch(`/api/projects/${story.projectId}/locations/${selectedLocation.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ referenceImages: newImages }),
        });
        if (res.ok) {
          const saved: Location = await res.json();
          setSelectedLocation(saved);
          setFormData({ ...saved, referenceImages: saved.referenceImages || [] });
          await loadLocations();
        }
      } catch (e) {
        console.error("Failed to remove image", e);
      }
    }
  };

  const handleEdit = (location: Location) => {
    setSelectedLocation(location);
    setFormData({ ...location, referenceImages: location.referenceImages || [] });
    setEditTab("edit");
  };

  const handleDelete = async (locationId: string) => {
    if (!confirm("确定要删除这个场景地点吗？")) return;
    try {
      await fetch(`/api/projects/${story.projectId}/locations/${locationId}`, { method: "DELETE" });
      if (selectedLocation?.id === locationId) {
        setSelectedLocation(null);
        setFormData({ name: "", description: "", type: "interior", atmosphere: "", keyFeatures: [], referenceImages: [] });
      }
      await loadLocations();
    } catch (e) {
      console.error("Failed to delete location", e);
    }
  };

  const handleAdd = () => {
    setSelectedLocation(null);
    setFormData({ name: "", description: "", type: "interior", atmosphere: "", keyFeatures: [], referenceImages: [] });
    setEditTab("edit");
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-280px)] min-h-[500px]">
      {/* Left Panel - Location List */}
      <div className="w-[320px] flex-shrink-0 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">场景地点管理</h2>
            <p className="text-xs text-zinc-500">管理故事中的场景和地点</p>
          </div>
          <Button size="sm" onClick={handleAdd}>
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加
          </Button>
        </div>

        {locations.length === 0 ? (
          <div className="flex-1 bg-zinc-50 dark:bg-zinc-800 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm text-zinc-500 mb-2">还没有场景地点</p>
            <p className="text-xs text-zinc-400 mb-4">点击上方按钮添加地点</p>
          </div>
        ) : (
          <>
            <div className="mb-3 p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>已识别 {locations.length} 个场景地点，点击卡片可编辑</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {locations.map((location) => (
                <div
                  key={location.id}
                  className={`bg-white dark:bg-zinc-800 rounded-lg border p-3 cursor-pointer transition-all ${
                    selectedLocation?.id === location.id
                      ? "border-blue-500 dark:border-blue-400 shadow-md"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow"
                  }`}
                  onClick={() => handleEdit(location)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      {/* Thumbnail */}
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-700 flex-shrink-0">
                        {location.referenceImages?.[0] ? (
                          <img src={location.referenceImages[0]} alt={location.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{location.name}</h3>
                        <span className="text-xs text-zinc-500">{TYPE_OPTIONS.find(t => t.value === location.type)?.label}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(location.id); }}
                      className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  {location.description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 pl-12">{location.description}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Right Panel - Editor */}
      <div className="flex-1 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden flex flex-col">
        {!selectedLocation && !formData.name ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto text-zinc-200 dark:text-zinc-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-zinc-400 dark:text-zinc-500 mb-1">选择一个地点进行编辑</p>
              <p className="text-xs text-zinc-400">或点击"添加"创建新地点</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header with Tabs */}
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {selectedLocation ? "编辑地点" : "添加地点"}
                </h3>
                <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                  <button
                    onClick={() => setEditTab("edit")}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      editTab === "edit"
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-700"
                    }`}
                  >
                    编辑信息
                  </button>
                  <button
                    onClick={() => setEditTab("ai-generate")}
                    disabled={!formData.name?.trim()}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      editTab === "ai-generate"
                        ? "bg-green-500 text-white shadow-sm"
                        : "text-zinc-500 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    }`}
                  >
                    AI生图
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {editTab === "edit" && (
                <div className="space-y-4 max-w-2xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">地点名称 *</label>
                      <input
                        type="text"
                        value={formData.name || ""}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm"
                        placeholder="输入地点名称"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">类型</label>
                      <select
                        value={formData.type || "interior"}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as LocationType })}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm"
                      >
                        {TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">描述</label>
                    <textarea
                      value={formData.description || ""}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm resize-none"
                      placeholder="描述这个场景地点..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">氛围</label>
                    <input
                      type="text"
                      value={formData.atmosphere || ""}
                      onChange={(e) => setFormData({ ...formData, atmosphere: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm"
                      placeholder="例如：神秘、温馨、紧张..."
                    />
                  </div>

                  {/* Reference Images */}
                  {(formData.referenceImages?.length ?? 0) > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                        参考图片（{formData.referenceImages!.length} 张）
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {formData.referenceImages!.map((url, i) => (
                          <div key={i} className="group relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
                            <div className="aspect-video bg-zinc-100 dark:bg-zinc-800">
                              <img src={url} alt={`参考图 ${i + 1}`} className="w-full h-full object-cover" />
                            </div>
                            <button
                              onClick={() => handleRemoveImage(url)}
                              className="absolute top-1 right-1 p-1 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                              title="删除图片"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={!formData.name?.trim() || saving}>
                      {saving ? <Spinner size="sm" /> : null}
                      保存地点信息
                    </Button>
                  </div>
                </div>
              )}

              {editTab === "ai-generate" && (
                <AIGenerateImage
                  type="location"
                  data={{
                    name: formData.name,
                    description: formData.description,
                    atmosphere: formData.atmosphere,
                  }}
                  onApplyImage={handleApplyImage}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
