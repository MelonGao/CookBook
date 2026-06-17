// 认证状态：当前用户、登录状态、用户档案
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { ProfileRow } from '@/types/database';
import { fetchProfile } from '@/lib/api/profiles';

interface AuthState {
  user: User | null;
  profile: ProfileRow | null;
  loading: boolean;
  init: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,

  init: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const u = session?.user ?? null;
    const p = u ? await fetchProfile(u.id).catch(() => null) : null;
    set({ user: u, profile: p, loading: false });

    supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      const p = u ? await fetchProfile(u.id).catch(() => null) : null;
      set({ user: u, profile: p });
    });
  },
}));
