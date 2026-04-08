"use client";

import { useState, useEffect } from "react";
import type { Story, Location, LocationType } from "@/types/story";
import { locationDb } from "@/lib/db/story";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState<Partial<Location>>({
    name: "",
    description: "",
    type: "interior",
    atmosphere: "",
    keyFeatures: [],
  });

  const loadLocations = () => {
    const locs = locationDb.getByProjectId(story.projectId);
    setLocations(locs);
  };

  useEffect(() => {
    loadLocations();
    
    const handleFocus = () => {
      loadLocations();
    };
    window.addEventListener("focus", handleFocus);
    
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [story.projectId]);

  const handleSave = () => {
    if (editingLocation) {
      locationDb.update(editingLocation.id, formData);
    } else {
      locationDb.create(story.projectId, formData);
    }
    loadLocations();
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData(location);
    setIsDialogOpen(true);
  };

  const handleDelete = (locationId: string) => {
    if (confirm("确定要删除这个场景地点吗？")) {
      locationDb.delete(locationId);
      loadLocations();
    }
  };

  const handleAdd = () => {
    setEditingLocation(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "interior",
      atmosphere: "",
      keyFeatures: [],
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">场景地点管理</h2>
          <p className="text-sm text-zinc-500">管理故事中的场景和地点</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadLocations}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新
          </Button>
          <Button onClick={handleAdd}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加地点
          </Button>
        </div>
      </div>

      {locations.length === 0 ? (
        <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <svg className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-zinc-500 mb-2">还没有场景地点</p>
          <p className="text-xs text-zinc-400 mb-4">如果您在规划阶段导入了小说，场景地点会自动显示在这里</p>
          <Button onClick={handleAdd}>添加第一个地点</Button>
        </div>
      ) : (
        <>
          {locations.length > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>已识别 {locations.length} 个场景地点，点击卡片可编辑详细信息</span>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {locations.map((location) => (
              <div
                key={location.id}
                className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleEdit(location)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{location.name}</h3>
                    <span className="inline-block px-2 py-0.5 text-xs rounded-full mt-1 bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">
                      {TYPE_OPTIONS.find(t => t.value === location.type)?.label}
                    </span>
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEdit(location)}
                      className="p-1 text-zinc-400 hover:text-blue-600"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(location.id)}
                      className="p-1 text-zinc-400 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">{location.description}</p>
                {location.atmosphere && (
                  <p className="text-xs text-zinc-400 mt-2">氛围: {location.atmosphere}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLocation ? "编辑地点" : "添加地点"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">地点名称 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">类型</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as LocationType })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">氛围</label>
              <input
                type="text"
                value={formData.atmosphere}
                onChange={(e) => setFormData({ ...formData, atmosphere: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                placeholder="例如：神秘、温馨、紧张..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave} disabled={!formData.name?.trim()}>保存</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
