// 菜谱 CRUD API
import { supabase } from '../supabase';
import { recipeFromRow } from './helpers';
import type { Recipe } from '@/types/recipe';

export async function fetchRecipes(ownerId: string): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(recipeFromRow);
}

export async function fetchRecipe(id: string): Promise<Recipe | null> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return recipeFromRow(data);
}

function recipeToInsertRow(r: Recipe, ownerId: string): Record<string, unknown> {
  return {
    id: r.id,
    owner_id: ownerId,
    title: r.title,
    cover_url: r.cover ?? null,
    tags: r.tags,
    source_type: r.source.type,
    source_url: r.source.url ?? null,
    source_note: r.source.note ?? null,
    source_author: r.source.author ?? null,
    body_md: r.bodyMd,
    root_version_id: r.rootVersionId || null,
    cook_count: r.cookCount,
    last_cooked_at: r.lastCookedAt ? new Date(r.lastCookedAt).toISOString() : null,
    visibility: 'private',
    share_slug: null,
    fork_from_recipe_id: null,
  };
}

export async function createRecipe(recipe: Recipe, ownerId: string): Promise<void> {
  const row = recipeToInsertRow(recipe, ownerId);
  const { error } = await supabase.from('recipes').insert(row as any);
  if (error) throw error;
}

export async function updateRecipe(id: string, patch: Partial<Recipe>): Promise<void> {
  const updates: Record<string, unknown> = {};
  if (patch.title !== undefined) updates.title = patch.title;
  if (patch.cover !== undefined) updates.cover_url = patch.cover;
  if (patch.tags !== undefined) updates.tags = patch.tags;
  if (patch.bodyMd !== undefined) updates.body_md = patch.bodyMd;
  if (patch.source !== undefined) {
    updates.source_type = patch.source.type;
    updates.source_url = patch.source.url ?? null;
    updates.source_note = patch.source.note ?? null;
    updates.source_author = patch.source.author ?? null;
  }
  if (patch.rootVersionId !== undefined) updates.root_version_id = patch.rootVersionId;
  if (patch.cookCount !== undefined) updates.cook_count = patch.cookCount;
  if (patch.lastCookedAt !== undefined)
    updates.last_cooked_at = patch.lastCookedAt ? new Date(patch.lastCookedAt).toISOString() : null;

  if (Object.keys(updates).length === 0) return;

  const { error } = await supabase.from('recipes').update(updates as any).eq('id', id);
  if (error) throw error;
}

export async function deleteRecipe(id: string): Promise<void> {
  const { error } = await supabase.from('recipes').delete().eq('id', id);
  if (error) throw error;
}

/** 新用户注册后，复制内置菜谱到其名下 */
export async function copyBuiltinRecipesForUser(ownerId: string): Promise<void> {
  const { data: builtins, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('source_type', 'builtin')
    .eq('visibility', 'public');

  if (error || !builtins || builtins.length === 0) return;

  for (const b of builtins) {
    const row = {
      owner_id: ownerId,
      title: b.title,
      cover_url: b.cover_url,
      tags: b.tags,
      source_type: 'custom' as const,
      source_url: b.source_url,
      source_note: b.source_note,
      source_author: b.source_author,
      body_md: b.body_md,
      root_version_id: b.root_version_id,
      cook_count: 0,
      visibility: 'private' as const,
      share_slug: null,
      fork_from_recipe_id: null,
    };
    const { error: insertErr } = await supabase.from('recipes').insert(row as any);
    if (insertErr) console.error('[copyBuiltin] 复制菜谱失败', insertErr);
  }
}
