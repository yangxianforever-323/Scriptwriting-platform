"use client";

import { useState, useEffect } from "react";
import type { Story, Character, CharacterRole } from "@/types/story";
import { characterDb } from "@/lib/db/story";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { AIGenerateImage } from "@/components/ai/AIGenerateImage";

interface CharactersTabProps {
  story: Story;
}

const ROLE_OPTIONS: { value: CharacterRole; label: string; color: string }[] = [
  { value: "protagonist", label: "主角", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  { value: "antagonist", label: "反派", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  { value: "supporting", label: "配角", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  { value: "minor", label: "次要角色", color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400" },
];

export function CharactersTab({ story }: CharactersTabProps) {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [dialogTab, setDialogTab] = useState<"edit" | "ai-generate">("edit");
  const [formData, setFormData] = useState<Partial<Character>>({
    name: "",
    role: "supporting",
    age: "",
    gender: "",
    appearance: "",
    personality: "",
    background: "",
    motivation: "",
    arc: "",
  });

  const loadCharacters = () => {
    const chars = characterDb.getByProjectId(story.projectId);
    setCharacters(chars);
  };

  useEffect(() => {
    loadCharacters();
    
    const handleFocus = () => {
      loadCharacters();
    };
    window.addEventListener("focus", handleFocus);
    
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [story.projectId]);

  const handleSave = () => {
    if (editingCharacter) {
      characterDb.update(editingCharacter.id, formData);
    } else {
      characterDb.create(story.projectId, formData);
    }
    loadCharacters();
    setIsDialogOpen(false);
    setEditingCharacter(null);
    setFormData({
      name: "",
      role: "supporting",
      age: "",
      gender: "",
      appearance: "",
      personality: "",
      background: "",
      motivation: "",
      arc: "",
    });
  };

  const handleEdit = (character: Character) => {
    setEditingCharacter(character);
    setFormData(character);
    setDialogTab("edit");
    setIsDialogOpen(true);
  };

  const handleDelete = (characterId: string) => {
    if (confirm("确定要删除这个角色吗？")) {
      characterDb.delete(characterId);
      loadCharacters();
    }
  };

  const handleAdd = () => {
    setEditingCharacter(null);
    setFormData({
      name: "",
      role: "supporting",
      age: "",
      gender: "",
      appearance: "",
      personality: "",
      background: "",
      motivation: "",
      arc: "",
    });
    setDialogTab("edit");
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">角色管理</h2>
          <p className="text-sm text-zinc-500">管理故事中的所有角色</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadCharacters}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            刷新
          </Button>
          <Button onClick={handleAdd}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加角色
          </Button>
        </div>
      </div>

      {characters.length === 0 ? (
        <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
          <svg className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-zinc-500 mb-2">还没有角色</p>
          <p className="text-xs text-zinc-400 mb-4">如果您在规划阶段导入了小说，角色会自动显示在这里</p>
          <Button onClick={handleAdd}>添加第一个角色</Button>
        </div>
      ) : (
        <>
          {characters.length > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>已识别 {characters.length} 个角色，点击角色卡片可编辑详细信息</span>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {characters.map((character) => (
              <div
                key={character.id}
                className="bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleEdit(character)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{character.name}</h3>
                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full mt-1 ${ROLE_OPTIONS.find(r => r.value === character.role)?.color}`}>
                      {ROLE_OPTIONS.find(r => r.value === character.role)?.label}
                    </span>
                  </div>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEdit(character)}
                      className="p-1 text-zinc-400 hover:text-blue-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(character.id)}
                      className="p-1 text-zinc-400 hover:text-red-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {character.age && (
                    <p className="text-zinc-600 dark:text-zinc-400">
                      <span className="text-zinc-400">年龄:</span> {character.age}
                    </p>
                  )}
                  {character.gender && (
                    <p className="text-zinc-600 dark:text-zinc-400">
                      <span className="text-zinc-400">性别:</span> {character.gender}
                    </p>
                  )}
                  {character.appearance && (
                    <p className="text-zinc-600 dark:text-zinc-400 line-clamp-2">
                      <span className="text-zinc-400">外表:</span> {character.appearance}
                    </p>
                  )}
                  {character.personality && (
                    <p className="text-zinc-600 dark:text-zinc-400 line-clamp-2">
                      <span className="text-zinc-400">性格:</span> {character.personality}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>
                {editingCharacter ? "角色编辑" : "添加角色"}
              </DialogTitle>
              <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                <button
                  onClick={() => setDialogTab("edit")}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    dialogTab === "edit"
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-700"
                  }`}
                >
                  编辑信息
                </button>
                <button
                  onClick={() => setDialogTab("ai-generate")}
                  disabled={!formData.name?.trim() || !formData.appearance}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    dialogTab === "ai-generate"
                      ? "bg-green-500 text-white shadow-sm"
                      : "text-zinc-500 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  }`}
                >
                  AI生图
                </button>
              </div>
            </div>
          </DialogHeader>

          {dialogTab === "edit" ? (
            <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">角色名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  placeholder="输入角色名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">角色类型</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as CharacterRole })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">年龄</label>
                <input
                  type="text"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  placeholder="例如：25岁"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">性别</label>
                <input
                  type="text"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  placeholder="例如：男/女"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">外表描述</label>
              <textarea
                value={formData.appearance}
                onChange={(e) => setFormData({ ...formData, appearance: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                placeholder="描述角色的外貌特征..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">性格特点</label>
              <textarea
                value={formData.personality}
                onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                placeholder="描述角色的性格特征..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">背景故事</label>
              <textarea
                value={formData.background}
                onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                placeholder="描述角色的背景故事..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">动机/目标</label>
              <textarea
                value={formData.motivation}
                onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                placeholder="描述角色的动机和目标..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">角色弧线</label>
              <textarea
                value={formData.arc}
                onChange={(e) => setFormData({ ...formData, arc: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                placeholder="描述角色在故事中的成长和变化..."
              />
            </div>
          </div>

          {dialogTab === "ai-generate" && (
            <AIGenerateImage
              type="character"
              data={{
                name: formData.name,
                appearance: formData.appearance,
                personality: formData.personality,
              }}
              onImageGenerated={(images) => {
                console.log("Generated character images:", images);
              }}
            />
          )}

          {dialogTab === "edit" && (
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={!formData.name?.trim()}>
                保存
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
