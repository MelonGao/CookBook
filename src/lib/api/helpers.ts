// Snake_case ↔ camelCase 转换，用于 Supabase 行 ↔ 前端业务类型
import type { Recipe, RecipeVersion, WeekPlan } from '@/types/recipe';
import type { RecipeRow, VersionRow, WeekPlanRow } from '@/types/database';

/* ---------- Recipe ---------- */

export function recipeFromRow(row: RecipeRow): Recipe {
  return {
    id: row.id,
    title: row.title,
    cover: row.cover_url ?? undefined,
    tags: row.tags ?? [],
    source: {
      type: row.source_type,
      url: row.source_url ?? undefined,
      note: row.source_note ?? undefined,
      author: row.source_author ?? undefined,
    },
    bodyMd: row.body_md,
    rootVersionId: row.root_version_id ?? '',
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    cookCount: row.cook_count,
    lastCookedAt: row.last_cooked_at ? new Date(row.last_cooked_at).getTime() : undefined,
  };
}

/* ---------- Version ---------- */

export function versionFromRow(row: VersionRow): RecipeVersion {
  return {
    id: row.id,
    recipeId: row.recipe_id,
    parentVersionId: row.parent_version_id ?? null,
    label: row.label,
    bodyMd: row.body_md,
    ingredients: (row.ingredients as RecipeVersion['ingredients']) ?? [],
    changeNote: row.change_note ?? undefined,
    rating: (row.rating as RecipeVersion['rating']) ?? undefined,
    createdAt: new Date(row.created_at).getTime(),
  };
}

/* ---------- WeekPlan ---------- */

export function planFromRow(row: WeekPlanRow): WeekPlan {
  return {
    weekStart: row.week_start,
    slots: (row.slots as WeekPlan['slots']) ?? [],
  };
}
