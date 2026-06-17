// 用户档案 API
import { supabase } from '../supabase';
import type { ProfileRow } from '@/types/database';

export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function updateProfile(
  userId: string,
  patch: { display_name?: string | null; bio?: string | null; avatar_url?: string | null }
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update(patch as any)
    .eq('id', userId);

  if (error) throw error;
}
