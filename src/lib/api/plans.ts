// 周计划 API
import { supabase } from '../supabase';
import { planFromRow } from './helpers';
import type { WeekPlan } from '@/types/recipe';

export async function fetchPlan(ownerId: string, weekStart: string): Promise<WeekPlan | null> {
  const { data, error } = await supabase
    .from('week_plans')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('week_start', weekStart)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return planFromRow(data);
}

export async function upsertPlan(plan: WeekPlan, ownerId: string): Promise<void> {
  const existing = await fetchPlan(ownerId, plan.weekStart);

  if (existing) {
    const { error } = await supabase
      .from('week_plans')
      .update({ slots: plan.slots } as any)
      .eq('owner_id', ownerId)
      .eq('week_start', plan.weekStart);
    if (error) throw error;
  } else {
    const row = {
      owner_id: ownerId,
      week_start: plan.weekStart,
      slots: plan.slots,
    };
    const { error } = await supabase.from('week_plans').insert(row as any);
    if (error) throw error;
  }
}
