// 从 Markdown 正文中智能识别食材：解析项目符号列表，提取「名称 + 用量 + 单位」
// 重复食材按 name+unit 累加。无数字用量的（如「盐 适量」）保留为 amount=0、unit=描述。
import type { Ingredient } from '@/types/recipe';

const FUZZY_QUANTITIES = ['适量', '少许', '一些', '若干', '酌情', '随意', '适当', '按需'];

// 一行可能的格式：
//   - 牛肉 200g
//   - 牛肉 200 g
//   - 葱 2 根
//   - 盐 适量
//   - 干香菇 5-6朵（含范围，取首数字）
//   - 牛里脊肉 200g（备注：要嫩一点）— 备注会被丢掉
export function parseIngredientLine(raw: string): Ingredient | null {
  // 去掉项目符号 / 编号
  let stripped = raw.replace(/^\s*(?:[-*+]|\d+[.、])\s+/, '').trim();
  if (!stripped) return null;
  // 砍掉括号备注，留下主体（中英文括号都处理）
  stripped = stripped.replace(/[（(].*?[）)]/g, '').trim();
  // 砍掉行内逗号/句号后的注释
  stripped = stripped.split(/[。.；;]/)[0].trim();
  if (!stripped) return null;
  // 过长（>40 字符）通常不是食材项
  if (stripped.length > 40) return null;

  // 优先匹配末尾的"数字+单位"。允许范围（5-6 取 5）和分数（1/2）
  const numMatch = stripped.match(/^(.+?)[\s:：]*(\d+(?:[./]\d+)?)(?:[-~～]\d+(?:\.\d+)?)?\s*([a-zA-Zμ一-龥]{0,4})\s*$/);
  if (numMatch) {
    const name = numMatch[1].replace(/[，,:：]\s*$/, '').trim();
    const amount = parseAmount(numMatch[2]);
    const unit = numMatch[3].trim() || 'g';
    if (name && Number.isFinite(amount)) {
      return { name, amount, unit };
    }
  }

  // 无数字：检查是否含模糊量词
  for (const fuzzy of FUZZY_QUANTITIES) {
    if (stripped.includes(fuzzy)) {
      const name = stripped.replace(fuzzy, '').replace(/[，,:：]\s*$/, '').trim();
      if (name) return { name, amount: 0, unit: fuzzy };
    }
  }

  return null;
}

function parseAmount(s: string): number {
  // 支持分数 1/2 或小数 0.5
  if (s.includes('/')) {
    const [a, b] = s.split('/').map(Number);
    if (b) return a / b;
  }
  return Number(s);
}

// 从 Markdown 正文识别所有食材。优先扫描"## 食材"小节，没有则扫描所有列表项。
export function parseIngredientsFromMarkdown(md: string): Ingredient[] {
  if (!md) return [];
  const lines = md.split(/\r?\n/);
  const items: Ingredient[] = [];

  // 找到「食材」标题与下一个标题之间的区段；找不到则用全文。
  // 支持 Markdown 标题 `## 食材` 和裸标题 `食材：`。
  let start = -1;
  let end = lines.length;
  for (let i = 0; i < lines.length; i++) {
    const md = lines[i].match(/^#{1,6}\s*(.+)/);
    const plain = md ? null : lines[i].match(/^(食材|配料|材料)[:：]?\s*$/);
    if (!md && !plain) continue;
    const title = md ? md[1] : plain![1];
    if (start === -1 && /食材|配料|材料/.test(title)) {
      start = i + 1;
    } else if (start !== -1 && md) {
      // 只有 Markdown 标题才视为结束（避免误把"步骤："以下也算入）
      if (/步骤|做法|制作|烹饪|过程/.test(md[1])) {
        end = i;
        break;
      }
      end = i;
      break;
    }
  }
  const section = start === -1 ? lines : lines.slice(start, end);

  for (const line of section) {
    if (!/^\s*[-*+]\s+/.test(line)) continue;
    const ing = parseIngredientLine(line);
    if (ing) items.push(ing);
  }
  return items;
}

// 同名同单位的合并累加；同名不同单位的并列保留
export function accumulateIngredients(items: Ingredient[]): Ingredient[] {
  const map = new Map<string, Ingredient>();
  for (const ing of items) {
    const key = `${ing.name.trim().toLowerCase()}|${ing.unit.trim().toLowerCase()}`;
    const existing = map.get(key);
    if (existing) {
      existing.amount = Math.round((existing.amount + ing.amount) * 100) / 100;
    } else {
      map.set(key, { ...ing });
    }
  }
  return Array.from(map.values());
}

// 合并解析结果与现有列表：相同 key 累加，否则追加
export function mergeIngredients(current: Ingredient[], extra: Ingredient[]): Ingredient[] {
  return accumulateIngredients([...current, ...extra]);
}
