// "今天吃什么"推荐算法
// 1) 最近 7 天做过的降权  2) 按 cookCount 加权（熟练的可优先复刻）
// 3) 20% 概率强制从"没做过"里抽，避免无聊  4) 支持抽一道 / 抽一顿（荤素汤）
import type { Recipe } from '@/types/recipe';

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
const FRESH_PICK_CHANCE = 0.2;

function cookedRecently(r: Recipe): boolean {
  return !!r.lastCookedAt && Date.now() - r.lastCookedAt < SEVEN_DAYS;
}

/** 单个菜谱的抽取权重 */
function weightOf(r: Recipe): number {
  let w = r.cookCount + 1; // 做过越多越熟练，基础权重更高
  if (cookedRecently(r)) w *= 0.15; // 最近做过的大幅降权
  return Math.max(w, 0.05);
}

function weightedPick(pool: Recipe[], rng = Math.random): Recipe | null {
  if (pool.length === 0) return null;
  const total = pool.reduce((sum, r) => sum + weightOf(r), 0);
  let t = rng() * total;
  for (const r of pool) {
    t -= weightOf(r);
    if (t <= 0) return r;
  }
  return pool[pool.length - 1];
}

/** 抽一道菜 */
export function pickOne(recipes: Recipe[], exclude: string[] = []): Recipe | null {
  const pool = recipes.filter((r) => !exclude.includes(r.id));
  if (pool.length === 0) return null;

  // 20% 概率从"从未做过"的菜里抽，制造新鲜感
  const neverCooked = pool.filter((r) => r.cookCount === 0);
  if (neverCooked.length > 0 && Math.random() < FRESH_PICK_CHANCE) {
    return neverCooked[Math.floor(Math.random() * neverCooked.length)];
  }
  return weightedPick(pool);
}

type Dish = 'meat' | 'veg' | 'soup';

/** 按 tag 粗分荤 / 素 / 汤 */
function classify(r: Recipe): Dish {
  const t = r.tags;
  if (t.includes('汤')) return 'soup';
  if (t.includes('素') || t.includes('清淡')) return 'veg';
  return 'meat';
}

/** 抽一顿：尽量凑成"一荤一素一汤" */
export function pickThree(recipes: Recipe[]): Recipe[] {
  const buckets: Record<Dish, Recipe[]> = { meat: [], veg: [], soup: [] };
  for (const r of recipes) buckets[classify(r)].push(r);

  const chosen: Recipe[] = [];
  const used = new Set<string>();

  for (const dish of ['meat', 'veg', 'soup'] as Dish[]) {
    const pick = weightedPick(buckets[dish].filter((r) => !used.has(r.id)));
    if (pick) {
      chosen.push(pick);
      used.add(pick.id);
    }
  }
  // 某类缺菜时，用其余菜补满三道
  while (chosen.length < 3 && chosen.length < recipes.length) {
    const pick = pickOne(recipes, [...used]);
    if (!pick) break;
    chosen.push(pick);
    used.add(pick.id);
  }
  return chosen;
}

/** 为周计划批量推荐 n 道（尽量不重复） */
export function pickMany(recipes: Recipe[], n: number): Recipe[] {
  const out: Recipe[] = [];
  const used: string[] = [];
  for (let i = 0; i < n; i++) {
    const pick = pickOne(recipes, used);
    if (!pick) break;
    out.push(pick);
    used.push(pick.id);
    // 用尽后允许重复，避免格子填不满
    if (used.length >= recipes.length) used.length = 0;
  }
  return out;
}
