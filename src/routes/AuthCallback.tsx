// OAuth 回调处理（Google 登录等）
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { ChefHat, MailCheck } from 'lucide-react';

type Status = 'checking' | 'verified-no-session' | 'error';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('checking');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const waitForSession = async () => {
      // supabase-js 会在页面加载时自动从 URL 解析 magic link / OAuth code 并建立 session，
      // 这个过程是异步的，轮询几次再下结论，避免过早判定失败。
      for (let i = 0; i < 10; i++) {
        const { data, error: err } = await supabase.auth.getSession();
        if (cancelled) return;
        if (err) {
          setError(err.message);
          setStatus('error');
          return;
        }
        if (data.session) {
          navigate('/', { replace: true });
          return;
        }
        await new Promise((r) => setTimeout(r, 400));
      }
      // 轮询结束仍无 session：会话建立失败或超时
      if (!cancelled) setStatus('verified-no-session');
    };

    waitForSession();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (status === 'error') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <p className="font-title text-h3 text-accent">登录失败</p>
        <p className="mt-2 font-hand text-body text-pencil/60">{error}</p>
        <button
          onClick={() => navigate('/login')}
          className="mt-4 rounded-wobbly-md border-2 border-pencil px-4 py-2 font-hand text-body hover:bg-postit"
        >
          返回登录
        </button>
      </div>
    );
  }

  if (status === 'verified-no-session') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-6">
        <div className="rounded-wobbly-blob bg-postit p-4 inline-block">
          <MailCheck size={40} strokeWidth={2.5} className="text-accent" />
        </div>
        <p className="mt-4 font-title text-h3 text-accent">登录未完成</p>
        <p className="mt-2 max-w-sm font-hand text-body text-pencil/70">
          登录流程未能完成，请返回登录页重试。
        </p>
        <button
          onClick={() => navigate('/login', { state: { justVerified: true } })}
          className="mt-5 rounded-wobbly-md border-2 border-pencil bg-accent px-5 py-2 font-hand text-body text-white shadow-hand-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-transform"
        >
          去登录
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <div className="rounded-wobbly-blob bg-postit p-4 animate-slow-bounce">
        <ChefHat size={40} strokeWidth={2.5} className="text-accent" />
      </div>
      <p className="mt-4 font-hand text-body text-pencil/60">正在验证身份…</p>
    </div>
  );
}
