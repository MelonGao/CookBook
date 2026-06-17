// JSON 数据导出：获取用户全部数据并触发浏览器下载
import { supabase } from './supabase';

export async function exportUserData(userId: string, email: string): Promise<void> {
  const [recipesRes, versionsRes, plansRes, profileRes] = await Promise.all([
    supabase.from('recipes').select('*').eq('owner_id', userId),
    supabase.from('versions').select('*, recipes!inner(owner_id)')
      .eq('recipes.owner_id', userId),
    supabase.from('week_plans').select('*').eq('owner_id', userId),
    supabase.from('profiles').select('*').eq('id', userId).single(),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    appVersion: '1.1',
    userEmail: email,
    profile: profileRes.data,
    recipes: recipesRes.data,
    versions: versionsRes.data,
    weekPlans: plansRes.data,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cookbook-export-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
