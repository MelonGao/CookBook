// 从 Markdown 正文中智能识别食材：解析项目符号 / 编号列表 / 表格行，提取「名称 + 用量 + 单位」
// 重复食材按 name+unit 累加。无数字用量的（如「盐 适量」）保留为 amount=0、unit=描述。
import type { Ingredient } from '@/types/recipe';

// 模糊量词（无具体数字）→ 直接当 unit 保留
const FUZZY_QUANTITIES = [
  '适量', '少许', '一点', '一些', '若干', '酌情', '随意', '适当', '按需',
  '微量', '几粒', '一撮', '一小撮', '一大撮', '一把', '一小把', '一大把',
  '半把', '半碗', '小半碗', '大半碗', '一勺', '一小勺', '一大勺', '半勺',
  '看个人', '视情况', '随喜好', '依口味',
];

// 中文数字 → 阿拉伯数字（仅处理 0-10 + 半，覆盖菜谱里 99% 场景）
const CN_NUM: Record<string, number> = {
  零: 0, 半: 0.5, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5,
  六: 6, 七: 7, 八: 8, 九: 9, 十: 10,
};

// 把行首中文数字（"三个鸡蛋"、"两根葱"）替换成阿拉伯数字开头形式
function normalizeChineseNumerals(s: string): string {
  // "十N"、"N十"、"十" → 用整数处理（菜谱里基本不超过 20）
  s = s.replace(/^([一二两三四五六七八九])十([一二三四五六七八九])?/, (_m, a, b) => {
    const tens = CN_NUM[a] * 10;
    const ones = b ? CN_NUM[b] : 0;
    return String(tens + ones);
  });
  s = s.replace(/^十([一二三四五六七八九])?/, (_m, b) => {
    const ones = b ? CN_NUM[b] : 0;
    return String(10 + ones);
  });
  // 单字中文数字开头
  s = s.replace(/^([零半一二两三四五六七八九])/, (_m, c) => String(CN_NUM[c]));
  return s;
}

// 一行可能的格式：
//   - 牛肉 200g
//   - 牛肉 200 g
//   - 葱 2 根
//   - 盐 适量
//   - 干香菇 5-6朵（含范围，取首数字）
//   - 牛里脊肉 200g（备注：要嫩一点）— 备注会被丢掉
//   - 三个鸡蛋 / 两根葱 / 半碗米饭（中文数字、口语化量词）
//   - 1. 牛肉 200g（数字编号列表，也接受）
//   - | 牛肉 | 200g |（表格行，也接受）
export function parseIngredientLine(raw: string): Ingredient | null {
  // 去掉项目符号 / 编号 / 表格分隔符
  let stripped = raw.replace(/^\s*(?:[-*+•·]|\d+[.)、]|\|)\s+/, '').trim();
  // 表格行末尾的 | 也砍掉
  stripped = stripped.replace(/\s*\|\s*$/, '').trim();
  if (!stripped) return null;
  // 砍掉括号备注（中英文括号、方括号、书名号）
  stripped = stripped.replace(/[（(\[【].*?[）)\]】]/g, '').trim();
  // 砍掉行内逗号/句号后的注释
  stripped = stripped.split(/[。；;]/)[0].trim();
  if (!stripped) return null;
  // 过长（>50 字符）通常不是食材项
  if (stripped.length > 50) return null;
  // 全是标点 / 表格分隔行（"|---|---|"） → 跳
  if (/^[-=|\s]+$/.test(stripped)) return null;

  // 中文数字归一化（"三个鸡蛋" → "3个鸡蛋"，"半碗米饭" → "0.5碗米饭"）
  const normalized = normalizeChineseNumerals(stripped);

  // 模式 A：行首数字 + 单位 + 名称（"3 个鸡蛋"、"200g 牛肉"、"半碗米饭"）
  //   注意：数字后面紧跟的是单位（1-4 个汉字 / 字母），再后面才是名字
  const leadMatch = normalized.match(/^(\d+(?:\.\d+)?(?:[-~～]\d+(?:\.\d+)?)?)\s*([a-zA-Zμ一-龥]{1,4})\s+(.+)$/);
  if (leadMatch) {
    const amount = parseAmount(leadMatch[1].split(/[-~～]/)[0]);
    const unit = leadMatch[2].trim();
    const name = leadMatch[3].replace(/[，,:：]\s*$/, '').trim();
    if (name && Number.isFinite(amount)) return { name, amount, unit };
  }

  // 模式 B：名称 + 数字 + 单位（"牛肉 200g"、"葱 2 根"）—— 最常见
  const numMatch = normalized.match(
    /^(.+?)[\s:：]*(\d+(?:[./]\d+)?)(?:[-~～]\d+(?:\.\d+)?)?\s*([a-zA-Zμ一-龥]{0,4})\s*$/
  );
  if (numMatch) {
    const name = numMatch[1].replace(/[，,:：]\s*$/, '').trim();
    const amount = parseAmount(numMatch[2]);
    const unit = numMatch[3].trim() || 'g';
    if (name && Number.isFinite(amount)) return { name, amount, unit };
  }

  // 模式 C：无数字 —— 检查模糊量词
  for (const fuzzy of FUZZY_QUANTITIES) {
    const idx = stripped.indexOf(fuzzy);
    if (idx >= 0) {
      const name = (stripped.slice(0, idx) + stripped.slice(idx + fuzzy.length))
        .replace(/[，,:：]\s*$/, '')
        .trim();
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

// 哪些行/标题段视为"非食材区"，扫描时跳过整段
const NON_INGREDIENT_HEADING = /步骤|做法|制作|烹饪|过程|提示|tips|注意|备注|说明|心得|总结/i;

// 一行明显不是食材（即便偶然落在食材区）就跳过
function looksLikeStep(line: string): boolean {
  // 步骤行通常很长 + 含动词 + 句号
  if (line.length > 60) return true;
  return /[。！？]/.test(line); // 完整句子用句号收尾
}

// 从 Markdown 正文识别所有食材。优先扫描"## 食材"小节，没有则扫描所有列表项 / 表格行。
export function parseIngredientsFromMarkdown(md: string): Ingredient[] {
  if (!md) return [];
  const lines = md.split(/\r?\n/);
  const items: Ingredient[] = [];

  // 找到「食材」标题与下一个标题之间的区段；找不到则用全文。
  // 支持 Markdown 标题 `## 食材` 和裸标题 `食材：`。
  let start = -1;
  let end = lines.length;
  for (let i = 0; i < lines.length; i++) {
    const mdHeading = lines[i].match(/^#{1,6}\s*(.+)/);
    const plain = mdHeading ? null : lines[i].match(/^(食材|配料|材料|主料|辅料|调料)[:：]?\s*$/);
    if (!mdHeading && !plain) continue;
    const title = mdHeading ? mdHeading[1] : plain![1];
    if (start === -1 && /食材|配料|材料|主料|辅料|调料/.test(title)) {
      start = i + 1;
    } else if (start !== -1 && mdHeading) {
      // 命中"步骤/做法"或任何下一个 Markdown 标题，截断
      end = i;
      break;
    }
  }
  const section = start === -1 ? lines : lines.slice(start, end);

  for (const line of section) {
    // 列表项 / 编号 / 表格行 / 中点
    const isListLike = /^\s*([-*+•·]|\d+[.)、]|\|)\s+/.test(line);
    if (!isListLike) continue;
    if (looksLikeStep(line)) continue;
    if (NON_INGREDIENT_HEADING.test(line)) continue;
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
