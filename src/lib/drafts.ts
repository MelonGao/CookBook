// 菜谱编辑器的草稿持久化（localStorage）。
// 仅在浏览器本地保存；与 Supabase 数据库无关。
import type { Ingredient, RecipeSource } from '@/types/recipe';

export interface RecipeDraft {
  title: string;
  tags: string[];
  cover?: string; // 可能是 https://… 或 data:… (本地预览)
  bodyMd: string;
  ingredients: Ingredient[];
  source: RecipeSource;
  savedAt: number; // Date.now()
}

const PREFIX = 'cookbook:draft';

export function draftKey(id?: string): string {
  return id ? `${PREFIX}:edit:${id}` : `${PREFIX}:new`;
}

export function readDraft(id?: string): RecipeDraft | null {
  try {
    const raw = localStorage.getItem(draftKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RecipeDraft;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.savedAt !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

/** 返回 true 表示写入成功；false 表示空间不足 / 序列化失败 */
export function writeDraft(id: string | undefined, draft: RecipeDraft): boolean {
  try {
    localStorage.setItem(draftKey(id), JSON.stringify(draft));
    return true;
  } catch (err) {
    // localStorage 配额满（一般是封面 base64 太大）→ 去掉 cover 再试一次
    if (draft.cover && draft.cover.startsWith('data:')) {
      try {
        localStorage.setItem(
          draftKey(id),
          JSON.stringify({ ...draft, cover: undefined })
        );
        return true;
      } catch {
        /* fall through */
      }
    }
    console.warn('[draft] 写入失败', err);
    return false;
  }
}

export function clearDraft(id?: string): void {
  try {
    localStorage.removeItem(draftKey(id));
  } catch {
    /* ignore */
  }
}

/** data: URL → File（用于草稿恢复时重新构造可上传的 File 对象） */
export async function dataUrlToFile(dataUrl: string, filename = 'cover.jpg'): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
}
