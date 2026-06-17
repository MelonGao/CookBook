// 极简 YAML frontmatter 解析器 —— 仅覆盖内置菜谱所用的有限语法。
// 支持：title 标量、tags 内联数组 [a, b]、ingredients 块（每行 "名称 | 数量 | 单位"）。
import type { Ingredient } from '@/types/recipe';

export interface ParsedRecipeFile {
  title: string;
  tags: string[];
  ingredients: Ingredient[];
  author?: string;
  note?: string;
  body: string; // frontmatter 之后的正文
}

export function parseRecipeFile(raw: string): ParsedRecipeFile {
  const text = raw.replace(/\r\n/g, '\n');
  const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { title: '未命名', tags: [], ingredients: [], body: text.trim() };
  }

  const [, fm, body] = match;
  const lines = fm.split('\n');

  let title = '未命名';
  let tags: string[] = [];
  let author: string | undefined;
  let note: string | undefined;
  const ingredients: Ingredient[] = [];
  let inIngredients = false;

  for (const line of lines) {
    if (inIngredients) {
      const item = line.match(/^\s*-\s*(.+)$/);
      if (item) {
        const parts = item[1].split('|').map((p) => p.trim());
        ingredients.push({
          name: parts[0] ?? '',
          amount: Number(parts[1] ?? 0) || 0,
          unit: parts[2] ?? '',
        });
        continue;
      }
      inIngredients = false; // 缩进结束
    }

    const kv = line.match(/^([a-zA-Z]+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, value] = kv;

    switch (key) {
      case 'title':
        title = stripQuotes(value);
        break;
      case 'author':
        author = stripQuotes(value);
        break;
      case 'note':
        note = stripQuotes(value);
        break;
      case 'tags':
        tags = parseInlineArray(value);
        break;
      case 'ingredients':
        inIngredients = true;
        break;
    }
  }

  return { title, tags, ingredients, author, note, body: body.trim() };
}

function stripQuotes(s: string): string {
  return s.trim().replace(/^["']|["']$/g, '');
}

function parseInlineArray(s: string): string[] {
  const inner = s.trim().replace(/^\[|\]$/g, '');
  if (!inner) return [];
  return inner
    .split(',')
    .map((x) => stripQuotes(x))
    .filter(Boolean);
}
