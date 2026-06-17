// 分享卡片 —— 供 html2canvas 截图导出的菜谱卡片版式
import { forwardRef } from 'react';
import type { Recipe, RecipeVersion } from '@/types/recipe';
import MarkdownView from './MarkdownView';

interface Props {
  recipe: Recipe;
  version: RecipeVersion;
}

const ShareCard = forwardRef<HTMLDivElement, Props>(({ recipe, version }, ref) => {
  return (
    <div
      ref={ref}
      style={{ width: 520, backgroundColor: '#fdfbf7' }}
      className="overflow-hidden rounded-wobbly border-[3px] border-pencil shadow-hand-lg"
    >
      {recipe.cover && (
        <img src={recipe.cover} alt="" className="h-48 w-full border-b-2 border-pencil object-cover" />
      )}
      <div className="p-7">
        <p className="font-title text-meta tracking-[0.2em] text-accent">寻味 · COOKBOOK</p>
        <h2 className="mt-1 font-title text-h2 text-pencil">{recipe.title}</h2>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {recipe.tags.map((t) => (
            <span
              key={t}
              className="rounded-wobbly-sm border-2 border-pencil bg-postit px-2 py-0.5 text-xs font-hand text-pencil"
            >
              {t}
            </span>
          ))}
        </div>

        <p className="mt-2 text-meta font-hand text-pencil/60">
          版本「{version.label}」· 已复刻 {recipe.cookCount} 次
        </p>

        <div className="my-4 border-t-2 border-dashed border-pencil" />

        <MarkdownView content={version.bodyMd} />

        <div className="mt-5 border-t-2 border-dashed border-pencil pt-3 text-meta font-hand text-pencil/60">
          {recipe.source.note && <span>出处：{recipe.source.note} · </span>}
          {recipe.source.author && <span>作者：{recipe.source.author} · </span>}
          由「寻味」记录
        </div>
      </div>
    </div>
  );
});

ShareCard.displayName = 'ShareCard';
export default ShareCard;
