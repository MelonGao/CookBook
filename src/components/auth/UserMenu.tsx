// 右上角用户菜单：头像 + 下拉（设置、退出）
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, User } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { signOut } from '@/lib/api/auth';

export default function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) return null;

  const displayName = profile?.display_name ?? user.email?.split('@')[0] ?? '我';
  const avatar = profile?.avatar_url ?? user.user_metadata?.avatar_url;

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-wobbly-sm border-2 border-pencil bg-white px-2.5 py-1.5 transition-shadow hover:shadow-hand-sm"
      >
        {avatar ? (
          <img src={avatar} alt="" className="h-6 w-6 rounded-wobbly-sm border border-pencil object-cover" />
        ) : (
          <User size={16} strokeWidth={2.5} className="text-pencil/60" />
        )}
        <span className="max-w-[100px] truncate font-hand text-meta text-pencil">{displayName}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 rounded-wobbly-md border-2 border-pencil bg-white p-2 shadow-hand">
          <button
            onClick={() => {
              setOpen(false);
              navigate('/settings');
            }}
            className="flex w-full items-center gap-2 rounded-wobbly-sm px-3 py-2 font-hand text-meta text-pencil hover:bg-postit"
          >
            <Settings size={14} strokeWidth={2.5} />
            账号设置
          </button>
          <button
            onClick={() => {
              setOpen(false);
              handleLogout();
            }}
            className="flex w-full items-center gap-2 rounded-wobbly-sm px-3 py-2 font-hand text-meta text-accent hover:bg-postit"
          >
            <LogOut size={14} strokeWidth={2.5} />
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}
