// 全局布局：顶部导航 + 内容区 + 用户菜单
import { NavLink, useNavigate } from 'react-router-dom';
import { BookMarked, CalendarDays, Home, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import DrawUnderline from '@/components/ui/DrawUnderline';
import UserMenu from '@/components/auth/UserMenu';
import { useAuthStore } from '@/stores/authStore';

const NAV = [
  { to: '/', label: '首页', icon: Home, end: true },
  { to: '/recipes', label: '菜谱', icon: BookMarked, end: false },
  { to: '/planner', label: '周计划', icon: CalendarDays, end: false },
];

export default function Layout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-40 border-b-2 border-pencil bg-paper">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-5 px-5">
          <button
            onClick={() => navigate('/')}
            className="flex items-baseline gap-2"
            aria-label="返回首页"
          >
            <span className="font-title text-h3 tracking-wide text-accent">寻味</span>
            <span className="text-meta font-hand text-pencil/60">Cookbook</span>
          </button>

          {user && (
            <nav className="flex items-center gap-3">
              {NAV.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} className="px-1 py-1.5 text-meta font-hand">
                  {({ isActive }) => (
                    <DrawUnderline
                      active={isActive}
                      className={cn(
                        'flex items-center gap-1.5 transition-colors',
                        isActive ? 'text-accent' : 'text-pencil/70 hover:text-pencil'
                      )}
                    >
                      <Icon size={16} strokeWidth={2.5} />
                      {label}
                    </DrawUnderline>
                  )}
                </NavLink>
              ))}
            </nav>
          )}

          <div className="ml-auto flex items-center gap-3">
            {user && (
              <button
                onClick={() => navigate('/new')}
                className="inline-flex items-center gap-1.5 rounded-wobbly-md border-[3px] border-pencil bg-accent px-3.5 py-2 text-meta font-hand text-white shadow-hand transition-transform duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-hand-hover"
              >
                <Plus size={16} strokeWidth={3} />
                新建菜谱
              </button>
            )}
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10">{children}</main>

      <footer className="mx-auto max-w-5xl px-5 pb-10 pt-4 text-center text-meta font-hand text-pencil/50">
        寻味 · 让做菜重新变得有趣 · 数据加密存储于云端 · 仅你可见
      </footer>
    </div>
  );
}
