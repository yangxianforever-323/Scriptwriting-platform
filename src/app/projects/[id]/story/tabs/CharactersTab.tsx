"use client";

import { useState, useEffect } from "react";
import type { Story, Character, CharacterRole } from "@/types/story";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
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
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [dialogTab, setDialogTab] = useState<"edit" | "ai-generate">("edit");
  const [saving, setSaving] = useState(false);
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
    referenceImages: [],
  });

  const loadCharacters = async () => {
    try {
      const res = await fetch(`/api/projects/${story.projectId}/characters`);
      if (!res.ok) return;
      const chars: Character[] = await res.json();
      setCharacters(chars);
    } catch (e) {
      console.error("Failed to load characters", e);
    }
  };

  useEffect(() => {
    loadCharacters();
  }, [story.projectId]);

  const handleSave = async () => {
    if (!formData.name?.trim()) return;
    setSaving(true);
    try {
      if (selectedCharacter) {
        const res = await fetch(`/api/projects/${story.projectId}/characters/${selectedCharacter.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const updated: Character = await res.json();
          setSelectedCharacter(updated);
          setFormData(updated);
        }
      } else {
        const res = await fetch(`/api/projects/${story.projectId}/characters`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          const newChar: Character = await res.json();
          setSelectedCharacter(newChar);
          setFormData(newChar);
        }
      }
      await loadCharacters();
    } catch (e) {
      console.error("Failed to save character", e);
    } finally {
      setSaving(false);
    }
  };

  /** Apply a generated/uploaded image to the character's referenceImages */
  const handleApplyImage = async (url: string) => {
    const currentImages = formData.referenceImages || [];
    if (currentImages.includes(url)) return; // already added

    const updated = { ...formData, referenceImages: [...currentImages, url] };
    setFormData(updated);

    // Persist immediately if editing an existing character
    if (selectedCharacter) {
      try {
        const res = await fetch(`/api/projects/${story.projectId}/characters/${selectedCharacter.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ referenceImages: updated.referenceImages }),
        });
        if (res.ok) {
          const saved: Character = await res.json();
          setSelectedCharacter(saved);
          setFormData(saved);
          await loadCharacters();
        }
      } catch (e) {
        console.error("Failed to save image", e);
      }
    }
  };

  /** Remove an image from referenceImages */
  const handleRemoveImage = async (url: string) => {
    const newImages = (formData.referenceImages || []).filter((u) => u !== url);
    setFormData({ ...formData, referenceImages: newImages });

    if (selectedCharacter) {
      try {
        const res = await fetch(`/api/projects/${story.projectId}/characters/${selectedCharacter.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ referenceImages: newImages }),
        });
        if (res.ok) {
          const saved: Character = await res.json();
          setSelectedCharacter(saved);
          setFormData(saved);
          await loadCharacters();
        }
      } catch (e) {
        console.error("Failed to remove image", e);
      }
    }
  };

  const handleEdit = (character: Character) => {
    setSelectedCharacter(character);
    setFormData({ ...character, referenceImages: character.referenceImages || [] });
    setDialogTab("edit");
  };

  const handleDelete = async (characterId: string) => {
    if (!confirm("确定要删除这个角色吗？")) return;
    try {
      await fetch(`/api/projects/${story.projectId}/characters/${characterId}`, { method: "DELETE" });
      if (selectedCharacter?.id === characterId) {
        setSelectedCharacter(null);
        setFormData({ name: "", role: "supporting", age: "", gender: "", appearance: "", personality: "", background: "", motivation: "", arc: "", referenceImages: [] });
      }
      await loadCharacters();
    } catch (e) {
      console.error("Failed to delete character", e);
    }
  };

  const handleAdd = () => {
    setFormData({ name: "", role: "supporting", age: "", gender: "", appearance: "", personality: "", background: "", motivation: "", arc: "", referenceImages: [] });
    setSelectedCharacter(null);
    setDialogTab("edit");
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-280px)] min-h-[500px]">
      {/* Left Panel - Character List */}
      <div className="w-[320px] flex-shrink-0 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">角色管理</h2>
            <p className="text-xs text-zinc-500">管理故事中的所有角色</p>
          </div>
          <Button size="sm" onClick={handleAdd}>
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加
          </Button>
        </div>

        {characters.length === 0 ? (
          <div className="flex-1 bg-zinc-50 dark:bg-zinc-800 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-sm text-zinc-500 mb-2">还没有角色</p>
            <p className="text-xs text-zinc-400">点击上方按钮添加角色</p>
          </div>
        ) : (
          <>
            <div className="mb-3 p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>已识别 {characters.length} 个角色，点击角色卡片可编辑详细信息</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {characters.map((character) => (
                <div
                  key={character.id}
                  className={`bg-white dark:bg-zinc-800 rounded-lg border p-3 cursor-pointer transition-all ${
                    selectedCharacter?.id === character.id
                      ? "border-blue-500 dark:border-blue-400 shadow-md"
                      : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow"
                  }`}
                  onClick={() => handleEdit(character)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      {/* Avatar: show first reference image if available */}
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-700 flex-shrink-0">
                        {character.referenceImages?.[0] ? (
                          <img src={character.referenceImages[0]} alt={character.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm font-medium text-zinc-600 dark:text-zinc-300">
                            {character.name?.charAt(0) || "?"}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{character.name}</h3>
                        <span className={`inline-block px-1.5 py-0.5 text-[10px] rounded ${ROLE_OPTIONS.find(r => r.value === character.role)?.color}`}>
                          {ROLE_OPTIONS.find(r => r.value === character.role)?.label}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(character.id); }}
                      className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  {character.appearance && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 pl-10">
                      {character.appearance}
                    </p>
                  )}
                  {(character.referenceImages?.length ?? 0) > 0 && (
                    <div className="flex gap-1 mt-2 pl-10">
                      {character.referenceImages!.slice(0, 3).map((url, i) => (
                        <img key={i} src={url} alt="" className="w-8 h-8 rounded object-cover border border-zinc-200 dark:border-zinc-600" />
                      ))}
                      {(character.referenceImages?.length ?? 0) > 3 && (
                        <div className="w-8 h-8 rounded bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center text-xs text-zinc-500">
                          +{character.referenceImages!.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Right Panel - Editor */}
      <div className="flex-1 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden flex flex-col">
        {!selectedCharacter && !formData.name ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto text-zinc-200 dark:text-zinc-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <p className="text-zinc-400 dark:text-zinc-500 mb-1">选择一个角色进行编辑</p>
              <p className="text-xs text-zinc-400">或点击"添加"创建新角色</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header with Tabs */}
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  {selectedCharacter ? "角色编辑" : "添加角色"}
                </h3>
                <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
                  <button
                    onClick={() => setDialogTab("edit")}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      dialogTab === "edit"
                        ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-700"
                    }`}
                  >
                    编辑信息
                  </button>
                  <button
                    onClick={() => setDialogTab("ai-generate")}
                    disabled={!formData.name?.trim()}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      dialogTab === "ai-generate"
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
              {dialogTab === "edit" && (
                <div className="space-y-4 max-w-2xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">角色名称 *</label>
                      <input
                        type="text"
                        value={formData.name || ""}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm"
                        placeholder="输入角色名称"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">角色类型</label>
                      <select
                        value={formData.role || "supporting"}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as CharacterRole })}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm"
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">年龄</label>
                      <input
                        type="text"
                        value={formData.age || ""}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm"
                        placeholder="例如：25岁"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">性别</label>
                      <input
                        type="text"
                        value={formData.gender || ""}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm"
                        placeholder="例如：男/女"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">外表描述</label>
                    <textarea
                      value={formData.appearance || ""}
                      onChange={(e) => setFormData({ ...formData, appearance: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm resize-none"
                      placeholder="描述角色的外貌特征..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">性格特点</label>
                    <textarea
                      value={formData.personality || ""}
                      onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm resize-none"
                      placeholder="描述角色的性格特征..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">背景故事</label>
                    <textarea
                      value={formData.background || ""}
                      onChange={(e) => setFormData({ ...formData, background: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm resize-none"
                      placeholder="描述角色的背景故事..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">动机/目标</label>
                    <textarea
                      value={formData.motivation || ""}
                      onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm resize-none"
                      placeholder="描述角色的动机和目标..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">角色弧线</label>
                    <textarea
                      value={formData.arc || ""}
                      onChange={(e) => setFormData({ ...formData, arc: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-sm resize-none"
                      placeholder="描述角色在故事中的成长和变化..."
                    />
                  </div>

                  {/* Reference Images Section */}
                  {(formData.referenceImages?.length ?? 0) > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                        参考图片（{formData.referenceImages!.length} 张）
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {formData.referenceImages!.map((url, i) => (
                          <div key={i} className="group relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
                            <div className="aspect-square bg-zinc-100 dark:bg-zinc-800">
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
                      保存角色信息
                    </Button>
                  </div>
                </div>
              )}

              {dialogTab === "ai-generate" && (
                <AIGenerateImage
                  type="character"
                  data={{
                    name: formData.name,
                    appearance: formData.appearance,
                    personality: formData.personality,
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
