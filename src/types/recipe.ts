// 全局数据类型定义 —— 菜谱、版本、食材、周计划

// 菜谱主干
export interface Recipe {
  id: string; // uuid
  title: string; // 菜名
  cover?: string; // 封面图（base64 或 url）
  tags: string[]; // ["川菜", "快手", "宵夜"]
  source: RecipeSource; // 来源
  bodyMd: string; // 主版本 Markdown 正文（与 rootVersion 同步）
  rootVersionId: string; // 指向 versions 中的"主干"版本
  createdAt: number;
  updatedAt: number;
  cookCount: number; // 做过几次
  lastCookedAt?: number;
}

// 菜谱来源
export interface RecipeSource {
  type: 'builtin' | 'custom' | 'imported';
  url?: string; // 导入时的原始 URL（小红书/B站/下厨房/书页扫描…）
  note?: string; // 出处备注："《家常川菜》P.42"
  author?: string;
}

// 版本（迭代）—— 一棵以 rootVersionId 为根的树
export interface RecipeVersion {
  id: string;
  recipeId: string; // 所属菜谱
  parentVersionId: string | null; // null = 主干根；否则指向父版本
  label: string; // "微辣版" / "v2 减糖" / "妈妈做法"
  bodyMd: string; // 该版本的完整 Markdown
  ingredients: Ingredient[]; // 结构化食材（便于调整用量）
  changeNote?: string; // 这次改了什么（"糖减半，加一勺豆瓣"）
  createdAt: number;
  rating?: 1 | 2 | 3 | 4 | 5; // 这版的自评
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string; // "g" | "ml" | "勺" | "个" …
}

// 周计划
export interface WeekPlan {
  weekStart: string; // ISO 周一日期 "2026-05-18"
  slots: PlanSlot[];
}

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface PlanSlot {
  id: string; // 用于 Draggable 标识
  date: string; // ISO 日期
  meal: MealType;
  recipeId?: string;
  versionId?: string;
  note?: string;
}
