// 认证操作：登录、退出、获取当前用户
import { supabase } from '../supabase';

/** 发送邮箱验证码（6 位数字，直接登录，无需 magic link 回调） */
export async function signInWithEmail(email: string) {
  return supabase.auth.signInWithOtp({ email });
}

/** 验证邮箱验证码，成功即建立登录会话 */
export async function verifyEmailOTP(email: string, token: string) {
  return supabase.auth.verifyOtp({ email, token, type: 'email' });
}

export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}
