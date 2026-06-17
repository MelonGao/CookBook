// Supabase 客户端单例
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[cookbook] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 未设置。请复制 .env.example 为 .env.local 并填入你的 Supabase 项目凭据。'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
