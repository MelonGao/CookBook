// 首页：「今天吃什么」抽签卡（含 GSAP 翻牌动效）+ 三个功能入口
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookMarked, CalendarDays, Check, Dices, Download, RefreshCw, Utensils } from 'lucide-react';
import type { Recipe } from '@/types/recipe';
import { useRecipeStore } from '@/stores/recipeStore';
import { usePlanStore, slotId } from '@/stores/planStore';
import { useAuthStore } from '@/stores/authStore';
import { pickOne, pickThree } from '@/lib/recommender';
import { getWeekStart, toISODate } from '@/lib/date';
import { gsap } from '@/lib/gsapSetup';
import { cn } from '@/lib/cn';
import Button from '@/components/ui/Button';
import RecipeCard from '@/components/recipe/RecipeCard';

type DrawMode = 'idle' | 'one' | 'three';

export default function Home() {
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.user?.id);
  const profile = useAuthStore((s) => s.profile);
  const recipes = useRecipeStore((s) => s.recipes);
  const ready = useRecipeStore((s) => s.ready);

  const [mode, setMode] = useState<DrawMode>('idle');
  const [result, setResult] = useState<Recipe | null>(null);
  const [trio, setTrio] = useState<Recipe[]>([]);
  const [drawId, setDrawId] = useState(0);
  const [added, setAdded] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const pressTimer = useRef<number | null>(null);
  const longFired = useRef(false);

  useEffect(() => {
    if (mode === 'idle' || !stageRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.draw-card',
        { rotationY: -100, opacity: 0, transformOrigin: '50% 50%' },
        {
          rotationY: 0,
          opacity: 1,
          duration: 0.6,
          ease: 'back.out(1.4)',
          stagger: 0.12,
        }
      );
    }, stageRef);
    return () => ctx.revert();
  }, [drawId, mode]);

  const drawOne = () => {
    if (recipes.length === 0) return;
    setResult(pickOne(recipes, result ? [result.id] : []));
    setMode('one');
    setAdded(false);
    setDrawId((n) => n + 1);
  };

  const drawThree = () => {
    if (recipes.length === 0) return;
    setTrio(pickThree(recipes));
    setMode('three');
    setAdded(false);
    setDrawId((n) => n + 1);
  };

  const onPressStart = () => {
    longFired.current = false;
    pressTimer.current = window.setTimeout(() => {
      longFired.current = true;
      drawThree();
    }, 550);
  };
  const onPressEnd = () => {
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    if (!longFired.current) drawOne();
  };
  const onPressCancel = () => {
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const addToToday = async (recipe: Recipe) => {
    if (!userId) return;
    const ws = getWeekStart();
    await usePlanStore.getState().loadWeek(ws, userId);
    const today = toISODate(new Date());
    await usePlanStore.getState().setSlotRecipe(slotId(today, 'dinner'), recipe.id, userId);
    setAdded(true);
  };

  const displayName = profile?.display_name ?? '朋友';

  return (
    <div className="space-y-12">
      <p className="font-title text-h3 text-pencil/60">
        你好，{displayName}
      </p>

      {/* 抽签卡 */}
      <section className="-rotate-1 overflow-hidden rounded-wobbly border-[3px] border-pencil bg-white shadow-hand-lg">
        <div className="bg-postit px-8 py-10">
          <p className="font-title text-meta tracking-widest text-accent">寻味 · COOKBOOK</p>
          <h1 className="mt-1 font-title text-h2 text-pencil md:text-display">今天吃什么？</h1>
          <p className="mt-2 max-w-md font-hand text-body text-pencil/70">
            把"今天到底吃啥"交给这枚按钮。单击抽一道，长按抽一桌（一荤一素一汤）。
          </p>

          <div ref={stageRef} className="mt-8" style={{ perspective: 900 }}>
            {mode === 'idle' && (
              <button
                onMouseDown={onPressStart}
                onMouseUp={onPressEnd}
                onMouseLeave={onPressCancel}
                onTouchStart={(e) => {
                  e.preventDefault();
                  onPressStart();
                }}
                onTouchEnd={onPressEnd}
                onContextMenu={(e) => e.preventDefault()}
                disabled={!ready || recipes.length === 0}
                className="group flex h-36 w-36 select-none flex-col items-center justify-center rounded-wobbly-blob border-[3px] border-pencil bg-accent text-white shadow-hand-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                <Dices size={40} strokeWidth={2.5} className="transition-transform group-hover:rotate-12" />
                <span className="mt-1.5 font-title text-body">抽一道</span>
              </button>
            )}

            {mode === 'one' && result && (
              <div className="flex flex-col items-start gap-4">
                <div className="draw-card w-60">
                  <RecipeCard recipe={result} onClick={() => navigate(`/recipes/${result.id}`)} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button onClick={() => addToToday(result)} disabled={added}>
                    {added ? <Check size={15} strokeWidth={3} /> : <Utensils size={15} strokeWidth={2.5} />}
                    {added ? '已加入今天晚餐' : '就它了'}
                  </Button>
                  <Button variant="outline" onClick={drawOne}>
                    <RefreshCw size={15} strokeWidth={2.5} />
                    换一个
                  </Button>
                  <Button variant="ghost" onClick={() => setMode('idle')}>
                    收起
                  </Button>
                </div>
              </div>
            )}

            {mode === 'three' && (
              <div className="flex flex-col gap-4">
                <p className="font-title text-h3 text-pencil">今天就这一桌 —</p>
                <div className="flex flex-wrap gap-3">
                  {trio.map((r) => (
                    <div key={r.id} className="draw-card w-48">
                      <RecipeCard recipe={r} onClick={() => navigate(`/recipes/${r.id}`)} />
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={drawThree}>
                    <RefreshCw size={15} strokeWidth={2.5} />
                    换一桌
                  </Button>
                  <Button variant="ghost" onClick={() => navigate('/planner')}>
                    去周计划安排
                  </Button>
                  <Button variant="ghost" onClick={() => setMode('idle')}>
                    收起
                  </Button>
                </div>
              </div>
            )}
          </div>

          {ready && recipes.length === 0 && (
            <p className="mt-6 font-hand text-body text-pencil/60">还没有菜谱，先去新建一道吧。</p>
          )}
        </div>
      </section>

      {/* 功能入口 */}
      <section>
        <h2 className="mb-5 font-title text-h2 text-pencil">从这里开始</h2>
        <div className="grid gap-8 sm:grid-cols-3">
          <EntryCard
            icon={<BookMarked size={22} strokeWidth={2.5} />}
            title="我的菜谱"
            desc={`${recipes.length} 道菜 · 记录每一次复刻`}
            tilt="-rotate-2"
            onClick={() => navigate('/recipes')}
          />
          <EntryCard
            icon={<CalendarDays size={22} strokeWidth={2.5} />}
            title="一周菜单"
            desc="拖拽安排，告别每天纠结"
            tilt="rotate-1"
            onClick={() => navigate('/planner')}
          />
          <EntryCard
            icon={<Download size={22} strokeWidth={2.5} />}
            title="收藏外部菜谱"
            desc="小红书 / 下厨房 / 书页都行"
            tilt="-rotate-1"
            onClick={() => navigate('/import')}
          />
        </div>
      </section>
    </div>
  );
}

function EntryCard({
  icon,
  title,
  desc,
  tilt,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  tilt: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex flex-col items-start gap-2 rounded-wobbly-md border-2 border-pencil bg-white p-5 text-left shadow-hand transition-transform duration-100 hover:-translate-y-1 hover:rotate-0 hover:shadow-hand-lg',
        tilt
      )}
    >
      <span className="rounded-wobbly-sm border-2 border-pencil bg-postit p-2.5 text-pencil transition-colors group-hover:bg-accent group-hover:text-white">
        {icon}
      </span>
      <span className="mt-1 font-title text-h3 text-pencil">{title}</span>
      <span className="font-hand text-body text-pencil/60">{desc}</span>
    </button>
  );
}
