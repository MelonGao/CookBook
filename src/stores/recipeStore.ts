// 菜谱状态：CRUD + 版本树。数据落地 Supabase，内存中保留全量供页面读取。
import { create } from 'zustand';
import type { Ingredient, Recipe, RecipeSource, RecipeVersion } from '@/types/recipe';
import {
  fetchRecipes,
  createRecipe as apiCreateRecipe,
  updateRecipe as apiUpdateRecipe,
  deleteRecipe as apiDeleteRecipe,
  copyBuiltinRecipesForUser,
} from '@/lib/api/recipes';
import {
  fetchAllVersions,
  createVersion as apiCreateVersion,
  updateVersion as apiUpdateVersion,
  deleteVersion as apiDeleteVersion,
} from '@/lib/api/versions';

export interface NewRecipeInput {
  title: string;
  tags: string[];
  bodyMd: string;
  cover?: string;
  source: RecipeSource;
  ingredients?: Ingredient[];
}

interface RecipeState {
  recipes: Recipe[];
  versions: RecipeVersion[];
  ready: boolean;

  init: (ownerId: string) => Promise<void>;
  getRecipe: (id: string) => Recipe | undefined;
  getVersions: (recipeId: string) => RecipeVersion[];
  getVersion: (id: string) => RecipeVersion | undefined;

  createRecipe: (input: NewRecipeInput, ownerId: string) => Promise<Recipe>;
  updateRecipe: (id: string, patch: Partial<Recipe>) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  markCooked: (recipeId: string) => Promise<void>;

  createVersion: (
    recipeId: string,
    parentVersionId: string,
    data: {
      label: string;
      bodyMd: string;
      ingredients: Ingredient[];
      changeNote?: string;
      rating?: 1 | 2 | 3 | 4 | 5;
    }
  ) => Promise<RecipeVersion>;
  updateVersion: (id: string, patch: Partial<RecipeVersion>) => Promise<void>;
  setRootVersion: (recipeId: string, versionId: string) => Promise<void>;
}

let initPromise: Promise<void> | null = null;

export const useRecipeStore = create<RecipeState>((set, get) => ({
  recipes: [],
  versions: [],
  ready: false,

  init: async (ownerId: string) => {
    if (get().ready) return;
    if (initPromise) return initPromise;
    initPromise = (async () => {
      try {
        // 首次登录：若用户名下无菜谱，复制内置菜谱
        let recipes = await fetchRecipes(ownerId);
        if (recipes.length === 0) {
          await copyBuiltinRecipesForUser(ownerId);
          recipes = await fetchRecipes(ownerId);
        }
        // 版本加载单独兜底：万一版本查询失败，也不能拖垮整个菜谱列表
        let versions: RecipeVersion[] = [];
        try {
          versions = await fetchAllVersions(ownerId);
        } catch (err) {
          console.error('[recipeStore] 版本数据加载失败，菜谱仍照常显示', err);
        }
        set({ recipes, versions, ready: true });
      } catch (err) {
        initPromise = null; // 拉取菜谱本身失败，允许下次重试
        throw err;
      }
    })();
    return initPromise;
  },

  getRecipe: (id) => get().recipes.find((r) => r.id === id),

  getVersions: (recipeId) =>
    get()
      .versions.filter((v) => v.recipeId === recipeId)
      .sort((a, b) => a.createdAt - b.createdAt),

  getVersion: (id) => get().versions.find((v) => v.id === id),

  createRecipe: async (input, ownerId) => {
    const now = Date.now();
    const recipeId = crypto.randomUUID();
    const versionId = crypto.randomUUID();

    const rootVersion: RecipeVersion = {
      id: versionId,
      recipeId,
      parentVersionId: null,
      label: '原版',
      bodyMd: input.bodyMd,
      ingredients: input.ingredients ?? [],
      createdAt: now,
    };
    const recipe: Recipe = {
      id: recipeId,
      title: input.title,
      tags: input.tags,
      cover: input.cover,
      source: input.source,
      bodyMd: input.bodyMd,
      rootVersionId: versionId,
      createdAt: now,
      updatedAt: now,
      cookCount: 0,
    };

    // recipes 与 versions 互为外键（versions.recipe_id NOT NULL → recipes.id；
    // recipes.root_version_id → versions.id），必须分三步打破循环：
    // 1) 先插菜谱，root_version_id 暂留空（否则外键指向尚不存在的版本会报错）
    await apiCreateRecipe({ ...recipe, rootVersionId: '' }, ownerId);
    // 2) 再插根版本（此时 recipe_id 指向的菜谱已存在，外键 + RLS 都通过）
    await apiCreateVersion(rootVersion);
    // 3) 回填 root_version_id
    await apiUpdateRecipe(recipeId, { rootVersionId: versionId });
    set((s) => ({ recipes: [...s.recipes, recipe], versions: [...s.versions, rootVersion] }));
    return recipe;
  },

  updateRecipe: async (id, patch) => {
    const current = get().recipes.find((r) => r.id === id);
    if (!current) return;
    const next: Recipe = { ...current, ...patch, updatedAt: Date.now() };
    await apiUpdateRecipe(id, patch);

    let versions = get().versions;
    if (patch.bodyMd !== undefined) {
      const root = versions.find((v) => v.id === next.rootVersionId);
      if (root) {
        const updatedRoot = { ...root, bodyMd: patch.bodyMd };
        await apiUpdateVersion(updatedRoot.id, { bodyMd: patch.bodyMd });
        versions = versions.map((v) => (v.id === updatedRoot.id ? updatedRoot : v));
      }
    }
    set((s) => ({
      recipes: s.recipes.map((r) => (r.id === id ? next : r)),
      versions,
    }));
  },

  deleteRecipe: async (id) => {
    await apiDeleteRecipe(id);
    set((s) => ({
      recipes: s.recipes.filter((r) => r.id !== id),
      versions: s.versions.filter((v) => v.recipeId !== id),
    }));
  },

  markCooked: async (recipeId) => {
    const r = get().recipes.find((x) => x.id === recipeId);
    if (!r) return;
    const next: Recipe = { ...r, cookCount: r.cookCount + 1, lastCookedAt: Date.now() };
    await apiUpdateRecipe(recipeId, { cookCount: next.cookCount, lastCookedAt: next.lastCookedAt });
    set((s) => ({ recipes: s.recipes.map((x) => (x.id === recipeId ? next : x)) }));
  },

  createVersion: async (recipeId, parentVersionId, data) => {
    const version: RecipeVersion = {
      id: crypto.randomUUID(),
      recipeId,
      parentVersionId,
      label: data.label,
      bodyMd: data.bodyMd,
      ingredients: data.ingredients,
      changeNote: data.changeNote,
      rating: data.rating,
      createdAt: Date.now(),
    };
    await apiCreateVersion(version);
    set((s) => ({ versions: [...s.versions, version] }));
    return version;
  },

  updateVersion: async (id, patch) => {
    const current = get().versions.find((v) => v.id === id);
    if (!current) return;
    const next: RecipeVersion = { ...current, ...patch };
    await apiUpdateVersion(id, patch);
    set((s) => ({ versions: s.versions.map((v) => (v.id === id ? next : v)) }));
  },

  setRootVersion: async (recipeId, versionId) => {
    const recipe = get().recipes.find((r) => r.id === recipeId);
    const version = get().versions.find((v) => v.id === versionId);
    if (!recipe || !version) return;
    const next: Recipe = {
      ...recipe,
      rootVersionId: versionId,
      bodyMd: version.bodyMd,
      updatedAt: Date.now(),
    };
    await apiUpdateRecipe(recipeId, { rootVersionId: versionId, bodyMd: version.bodyMd });
    set((s) => ({ recipes: s.recipes.map((r) => (r.id === recipeId ? next : r)) }));
  },
}));

/** 删除单个版本（不允许删根）。供 VersionTree 菜单使用。 */
export async function deleteVersionSafe(versionId: string): Promise<void> {
  const { recipes, versions } = useRecipeStore.getState();
  const version = versions.find((v) => v.id === versionId);
  if (!version) return;
  const recipe = recipes.find((r) => r.id === version.recipeId);
  if (recipe && recipe.rootVersionId === versionId) return;
  if (versions.some((v) => v.parentVersionId === versionId)) return;
  await apiDeleteVersion(versionId);
  useRecipeStore.setState((s) => ({ versions: s.versions.filter((v) => v.id !== versionId) }));
}
