"use client";

import { useState, useEffect } from "react";
import type { Story, Prop, PropImportance } from "@/types/story";
import { propDb } from "@/lib/db/story";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";

interface PropsTabProps {
  story: Story;
}

const IMPORTANCE_OPTIONS: { value: PropImportance; label: string; color: string }[] = [
  { value: "key", label: "关键道具", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  { value: "supporting", label: "辅助道具", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "background", label: "背景道具", color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400" },
];

export function PropsTab({ story }: PropsTabProps) {
  const [props, setProps] = useState<Prop[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProp, setEditingProp] = useState<Prop | null>(null);
  const [formData, setFormData] = useState<Partial<Prop>>({
    name: "",
    description: "",
    importance: "supporting",
  });

  const loadProps = () => {
    const p = propDb.getByProjectId(story.projectId);
    setProps(p);
  };

  useEffect(() => {
    loadProps();
    
    const handleFocus = () => {
      loadProps();
    };
    window.addEventListener("focus", handleFocus);
    
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [story.projectId]);

  const handleSave = () => {
    if (editingProp) {
      propDb.update(editingProp.id, formData);
    } else {
      propDb.create(story.projectId, formData);
    }
    loadProps();
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (prop: Prop) => {
    setEditingProp(prop);
    setFormData(prop);
    setIsDialogOpen(true);
  };

  const handleDelete = (propId: string) => {
    if (confirm("确定要删除这个道具吗？")) {
      propDb.delete(propId);
      loadProps();
    }
  };

  const handleAdd = () => {
    setEditingProp(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      importance: "supporting",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">道具管理</h2>
          <p className="text-sm text-zinc-500">管理故事中的重要道具</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadProps}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新
          </Button>
          <Button onClick={handleAdd}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加道具
          </Button>
        </div>
      </div>

      {props.length === 0 ? (
        <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <svg className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="text-zinc-500 mb-2">还没有道具</p>
          <p className="text-xs text-zinc-400 mb-4">如果您在规划阶段导入了小说，道具会自动显示在这里</p>
          <Button onClick={handleAdd}>添加第一个道具</Button>
        </div>
      ) : (
        <>
          {props.length > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>已识别 {props.length} 个道具，点击卡片可编辑详细信息</span>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {props.map((prop) => (
              <div
                key={prop.id}
                className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleEdit(prop)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{prop.name}</h3>
                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full mt-1 ${IMPORTANCE_OPTIONS.find(i => i.value === prop.importance)?.color}`}>
                      {IMPORTANCE_OPTIONS.find(i => i.value === prop.importance)?.label}
                    </span>
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEdit(prop)}
                      className="p-1 text-zinc-400 hover:text-blue-600"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(prop.id)}
                      className="p-1 text-zinc-400 hover:text-red-600"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">{prop.description}</p>
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProp ? "编辑道具" : "添加道具"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">道具名称 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">重要性</label>
              <select
                value={formData.importance}
                onChange={(e) => setFormData({ ...formData, importance: e.target.value as PropImportance })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
              >
                {IMPORTANCE_OPTIONS.map((opt) => (
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
                placeholder="描述道具的外观、功能、意义..."
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
