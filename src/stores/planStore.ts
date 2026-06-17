// 周计划状态：每周 7 天 × 3 餐的 21 个槽位，落地 Supabase。
import { create } from 'zustand';
import type { MealType, PlanSlot, WeekPlan } from '@/types/recipe';
import { fetchPlan, upsertPlan } from '@/lib/api/plans';
import { getWeekStart, weekDates } from '@/lib/date';

export const MEALS: MealType[] = ['breakfast', 'lunch', 'dinner'];
export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: '早',
  lunch: '午',
  dinner: '晚',
};

/** 槽位 id 稳定可推导：`${date}__${meal}` */
export function slotId(date: string, meal: MealType): string {
  return `${date}__${meal}`;
}

/** 为某一周生成 21 个空槽位 */
function buildEmptyWeek(weekStart: string): WeekPlan {
  const slots: PlanSlot[] = [];
  for (const date of weekDates(weekStart)) {
    for (const meal of MEALS) {
      slots.push({ id: slotId(date, meal), date, meal });
    }
  }
  return { weekStart, slots };
}

interface PlanState {
  weekStart: string;
  plan: WeekPlan;
  loading: boolean;

  loadWeek: (weekStart: string, ownerId: string) => Promise<void>;
  setSlotRecipe: (slotId: string, recipeId: string, ownerId: string, versionId?: string) => Promise<void>;
  clearSlot: (slotId: string, ownerId: string) => Promise<void>;
  swapSlots: (idA: string, idB: string, ownerId: string) => Promise<void>;
}

async function persist(plan: WeekPlan, ownerId: string): Promise<void> {
  await upsertPlan(plan, ownerId);
}

export const usePlanStore = create<PlanState>((set, get) => ({
  weekStart: getWeekStart(),
  plan: buildEmptyWeek(getWeekStart()),
  loading: false,

  loadWeek: async (weekStart, ownerId) => {
    set({ loading: true });
    const stored = await fetchPlan(ownerId, weekStart);
    const plan = stored ? mergeWithEmpty(weekStart, stored) : buildEmptyWeek(weekStart);
    set({ weekStart, plan, loading: false });
  },

  setSlotRecipe: async (id, recipeId, ownerId, versionId) => {
    const plan = get().plan;
    const next: WeekPlan = {
      ...plan,
      slots: plan.slots.map((s) => (s.id === id ? { ...s, recipeId, versionId } : s)),
    };
    set({ plan: next });
    await persist(next, ownerId);
  },

  clearSlot: async (id, ownerId) => {
    const plan = get().plan;
    const next: WeekPlan = {
      ...plan,
      slots: plan.slots.map((s) =>
        s.id === id ? { id: s.id, date: s.date, meal: s.meal } : s
      ),
    };
    set({ plan: next });
    await persist(next, ownerId);
  },

  swapSlots: async (idA, idB, ownerId) => {
    const plan = get().plan;
    const a = plan.slots.find((s) => s.id === idA);
    const b = plan.slots.find((s) => s.id === idB);
    if (!a || !b) return;
    const next: WeekPlan = {
      ...plan,
      slots: plan.slots.map((s) => {
        if (s.id === idA) return { ...s, recipeId: b.recipeId, versionId: b.versionId, note: b.note };
        if (s.id === idB) return { ...s, recipeId: a.recipeId, versionId: a.versionId, note: a.note };
        return s;
      }),
    };
    set({ plan: next });
    await persist(next, ownerId);
  },
}));

/** 用整批槽位内容替换并持久化 */
export async function applyWeekSlots(slots: PlanSlot[], ownerId: string): Promise<void> {
  const plan = usePlanStore.getState().plan;
  const next: WeekPlan = { ...plan, slots };
  usePlanStore.setState({ plan: next });
  await persist(next, ownerId);
}

/** 旧数据可能缺槽位，按当前网格补齐 */
function mergeWithEmpty(weekStart: string, stored: WeekPlan): WeekPlan {
  const empty = buildEmptyWeek(weekStart);
  const byId = new Map(stored.slots.map((s) => [s.id, s]));
  return {
    weekStart,
    slots: empty.slots.map((s) => byId.get(s.id) ?? s),
  };
}
