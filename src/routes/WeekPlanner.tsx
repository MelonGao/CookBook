// 一周菜单规划：7 天 × 3 餐网格 + 可拖拽菜谱抽屉
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search, Sparkles, X } from 'lucide-react';
import { useRecipeStore } from '@/stores/recipeStore';
import {
  usePlanStore,
  applyWeekSlots,
  slotId,
  MEALS,
  MEAL_LABELS,
} from '@/stores/planStore';
import { useAuthStore } from '@/stores/authStore';
import { addWeeks, formatMonthDay, getWeekStart, isThisWeek, toISODate, weekDates, WEEKDAY_LABELS } from '@/lib/date';
import { pickMany } from '@/lib/recommender';
import { gsap } from '@/lib/gsapSetup';
import DraggableCard from '@/components/draggable/DraggableCard';
import Button from '@/components/ui/Button';
import Tag from '@/components/ui/Tag';
import { cn } from '@/lib/cn';

export default function WeekPlanner() {
  const navigate = useNavigate();
  const userId = useAuthStore((s) => s.user?.id);
  const recipes = useRecipeStore((s) => s.recipes);
  const getRecipe = useRecipeStore((s) => s.getRecipe);
  const ready = useRecipeStore((s) => s.ready);

  const weekStart = usePlanStore((s) => s.weekStart);
  const plan = usePlanStore((s) => s.plan);
  const loadWeek = usePlanStore((s) => s.loadWeek);
  const setSlotRecipe = usePlanStore((s) => s.setSlotRecipe);
  const clearSlot = usePlanStore((s) => s.clearSlot);
  const swapSlots = usePlanStore((s) => s.swapSlots);

  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    if (userId) void loadWeek(getWeekStart(), userId);
  }, [loadWeek, userId]);

  const dates = useMemo(() => weekDates(weekStart), [weekStart]);
  const today = toISODate(new Date());

  const slotMap = useMemo(() => {
    const m = new Map<string, (typeof plan.slots)[number]>();
    plan.slots.forEach((s) => m.set(s.id, s));
    return m;
  }, [plan]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    recipes.forEach((r) => r.tags.forEach((t) => set.add(t)));
    return [...set].sort();
  }, [recipes]);

  const drawerRecipes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recipes
      .filter((r) => (q ? r.title.toLowerCase().includes(q) : true))
      .filter((r) => (activeTag ? r.tags.includes(activeTag) : true));
  }, [recipes, query, activeTag]);

  const pop = (el: HTMLElement) => {
    gsap.fromTo(
      el,
      { backgroundColor: 'rgba(255,77,77,0.35)' },
      {
        backgroundColor: 'rgba(255,77,77,0)',
        duration: 0.7,
        ease: 'power2.out',
        onComplete: () => gsap.set(el, { clearProps: 'backgroundColor' }),
      }
    );
  };

  const slotTilt = (id: string): number => {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
    return (Math.abs(h) % 5) - 2;
  };

  const handleDrop = (dragId: string, targetEl: HTMLElement) => {
    const targetSlotId = targetEl.dataset.slotId;
    if (!targetSlotId || !userId) return;
    if (dragId.startsWith('recipe:')) {
      void setSlotRecipe(targetSlotId, dragId.slice(7), userId);
      pop(targetEl);
    } else if (dragId.startsWith('slot:')) {
      const from = dragId.slice(5);
      if (from !== targetSlotId) {
        void swapSlots(from, targetSlotId, userId);
        pop(targetEl);
      }
    }
  };

  const handleAutoFill = async () => {
    if (!userId) return;
    const empties = plan.slots.filter((s) => !s.recipeId);
    if (empties.length === 0 || recipes.length === 0) return;
    const picks = pickMany(recipes, empties.length);
    let i = 0;
    const filled = plan.slots.map((s) => {
      if (s.recipeId) return s;
      const p = picks[i++];
      return p ? { ...s, recipeId: p.id } : s;
    });
    await applyWeekSlots(filled, userId);
  };

  const weekLabel = `${formatMonthDay(dates[0])} – ${formatMonthDay(dates[6])}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-title text-h1 text-pencil">一周菜单</h1>
          <p className="mt-1 font-hand text-body text-pencil/60">从左侧把菜谱拖进格子 · 已填的格子可互相拖拽交换</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-wobbly-sm border-2 border-pencil bg-white px-1 py-1">
            <button
              onClick={() => userId && loadWeek(addWeeks(weekStart, -1), userId)}
              className="rounded-wobbly-sm p-1 text-pencil hover:bg-postit"
              aria-label="上一周"
            >
              <ChevronLeft size={18} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => userId && loadWeek(getWeekStart(), userId)}
              className={cn(
                'rounded-wobbly-sm px-2 py-0.5 font-hand text-meta',
                isThisWeek(weekStart) ? 'text-accent' : 'text-pencil/60 hover:text-accent'
              )}
            >
              {weekLabel}
            </button>
            <button
              onClick={() => userId && loadWeek(addWeeks(weekStart, 1), userId)}
              className="rounded-wobbly-sm p-1 text-pencil hover:bg-postit"
              aria-label="下一周"
            >
              <ChevronRight size={18} strokeWidth={2.5} />
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={handleAutoFill}>
            <Sparkles size={14} strokeWidth={2.5} />
            一键生成本周
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-3">
          <div className="relative">
            <Search size={15} strokeWidth={2.5} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-pencil/50" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索菜谱…"
              className="input pl-8 text-sm"
            />
          </div>
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((t) => (
                <Tag
                  key={t}
                  label={t}
                  active={activeTag === t}
                  onClick={() => setActiveTag(activeTag === t ? null : t)}
                />
              ))}
            </div>
          )}
          <div className="space-y-2">
            {drawerRecipes.length === 0 ? (
              <p className="rounded-wobbly-md border-2 border-dashed border-pencil px-3 py-6 text-center font-hand text-body text-pencil/60">
                {recipes.length === 0 ? '还没有菜谱可安排' : '没有匹配的菜谱'}
              </p>
            ) : (
              drawerRecipes.map((r) => (
                <DraggableCard
                  key={r.id}
                  dragId={`recipe:${r.id}`}
                  onDrop={handleDrop}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <div className="flex items-center gap-2 rounded-wobbly-sm border-2 border-pencil bg-white px-3 py-2 shadow-hand-sm">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-wobbly-blob bg-accent" />
                    <span className="truncate font-hand text-body text-pencil">{r.title}</span>
                  </div>
                </DraggableCard>
              ))
            )}
          </div>
          <p className="font-hand text-meta text-pencil/50">提示：按住卡片拖到右侧任意格子。</p>
        </aside>

        <div className="overflow-x-auto">
          <div
            className="min-w-[640px]"
            style={{ display: 'grid', gridTemplateColumns: '44px repeat(7, 1fr)', gap: 6 }}
          >
            <div />
            {dates.map((d, i) => (
              <div
                key={d}
                className={cn(
                  'rounded-wobbly-sm px-1 py-1.5 text-center',
                  d === today ? 'border-2 border-pencil bg-postit' : ''
                )}
              >
                <div
                  className={cn(
                    'font-title text-body',
                    d === today ? 'text-accent' : 'text-pencil'
                  )}
                >
                  {WEEKDAY_LABELS[i]}
                </div>
                <div className="font-hand text-[11px] text-pencil/60">{formatMonthDay(d)}</div>
              </div>
            ))}

            {MEALS.map((meal) => (
              <FragmentRow key={meal}>
                <div className="flex items-center justify-center">
                  <span className="font-title text-body text-accent">
                    {MEAL_LABELS[meal]}
                  </span>
                </div>
                {dates.map((date) => {
                  const id = slotId(date, meal);
                  const slot = slotMap.get(id);
                  const recipe = slot?.recipeId ? getRecipe(slot.recipeId) : undefined;
                  return (
                    <div
                      key={id}
                      data-drop-cell
                      data-slot-id={id}
                      className={cn(
                        'relative flex min-h-[82px] items-stretch rounded-wobbly-sm p-1',
                        recipe ? '' : 'border-2 border-dashed border-pencil/40 bg-white/30'
                      )}
                    >
                      {recipe ? (
                        <DraggableCard
                          dragId={`slot:${id}`}
                          onDrop={handleDrop}
                          className="flex w-full cursor-grab active:cursor-grabbing"
                        >
                          <div
                            style={{ transform: `rotate(${slotTilt(id)}deg)` }}
                            className="group flex w-full flex-col justify-between rounded-wobbly-sm border-2 border-pencil bg-postit p-1.5 shadow-hand"
                          >
                            <span
                              className="line-clamp-2 cursor-pointer font-hand text-xs leading-snug text-pencil hover:text-accent"
                              onClick={() => navigate(`/recipes/${recipe.id}`)}
                            >
                              {recipe.title}
                            </span>
                            <button
                              onClick={() => userId && clearSlot(id, userId)}
                              className="mt-1 self-end rounded-wobbly-sm p-0.5 text-pencil/50 opacity-0 transition-opacity hover:text-accent group-hover:opacity-100"
                              aria-label="移除"
                            >
                              <X size={13} strokeWidth={3} />
                            </button>
                          </div>
                        </DraggableCard>
                      ) : (
                        <span className="m-auto font-hand text-[11px] text-pencil/30">（拖一张菜过来）</span>
                      )}
                    </div>
                  );
                })}
              </FragmentRow>
            ))}
          </div>
          {ready && recipes.length === 0 && (
            <p className="mt-4 font-hand text-body text-pencil/60">
              先去{' '}
              <button onClick={() => navigate('/new')} className="text-ballpoint underline hover:text-accent">
                新建菜谱
              </button>
              ，再来安排一周吧。
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
