// 版本 CRUD API
import { supabase } from '../supabase';
import { versionFromRow } from './helpers';
import type { RecipeVersion } from '@/types/recipe';

export async function fetchVersions(recipeId: string): Promise<RecipeVersion[]> {
  const { data, error } = await supabase
    .from('versions')
    .select('*')
    .eq('recipe_id', recipeId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(versionFromRow);
}

export async function fetchAllVersions(ownerId: string): Promise<RecipeVersion[]> {
  // recipes 与 versions 之间有两条外键（versions.recipe_id→recipes / recipes.root_version_id→versions），
  // 必须用外键名 versions_recipe_id_fkey 指明走哪条，否则 PostgREST 报 PGRST201 歧义错误。
  const { data, error } = await supabase
    .from('versions')
    .select('*, recipes!versions_recipe_id_fkey!inner(owner_id)')
    .eq('recipes.owner_id', ownerId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data ?? []).map(versionFromRow);
}

function versionToInsertRow(v: RecipeVersion): Record<string, unknown> {
  return {
    id: v.id,
    recipe_id: v.recipeId,
    parent_version_id: v.parentVersionId,
    label: v.label,
    body_md: v.bodyMd,
    ingredients: v.ingredients,
    change_note: v.changeNote ?? null,
    rating: v.rating ?? null,
  };
}

export async function createVersion(version: RecipeVersion): Promise<void> {
  const row = versionToInsertRow(version);
  const { error } = await supabase.from('versions').insert(row as any);
  if (error) throw error;
}

export async function updateVersion(id: string, patch: Partial<RecipeVersion>): Promise<void> {
  const updates: Record<string, unknown> = {};
  if (patch.label !== undefined) updates.label = patch.label;
  if (patch.bodyMd !== undefined) updates.body_md = patch.bodyMd;
  if (patch.ingredients !== undefined) updates.ingredients = patch.ingredients;
  if (patch.changeNote !== undefined) updates.change_note = patch.changeNote;
  if (patch.rating !== undefined) updates.rating = patch.rating;
  if (patch.parentVersionId !== undefined) updates.parent_version_id = patch.parentVersionId;

  if (Object.keys(updates).length === 0) return;

  const { error } = await supabase.from('versions').update(updates as any).eq('id', id);
  if (error) throw error;
}

export async function deleteVersion(id: string): Promise<void> {
  const { error } = await supabase.from('versions').delete().eq('id', id);
  if (error) throw error;
}
