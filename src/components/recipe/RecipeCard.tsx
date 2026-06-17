// 菜谱卡片 —— 列表、抽屉、推荐结果通用（手绘风：硬边框 + 硬阴影 + 微旋转）
import { ChefHat, Flame } from 'lucide-react';
import type { Recipe } from '@/types/recipe';
import { cn } from '@/lib/cn';

interface Props {
  recipe: Recipe;
  onClick?: () => void;
  compact?: boolean;
  className?: string;
}

const SOURCE_LABEL: Record<Recipe['source']['type'], string> = {
  builtin: '内置',
  custom: '自创',
  imported: '收藏',
};

export default function RecipeCard({ recipe, onClick, compact, className }: Props) {
  return (
    <article
      onClick={onClick}
      className={cn(
        'group -rotate-1 overflow-hidden border-2 border-pencil bg-white rounded-wobbly-md shadow-hand transition-transform duration-100',
        onClick && 'cursor-pointer hover:rotate-1 hover:shadow-hand-lg',
        className
      )}
    >
      {/* 封面 */}
      <div
        className={cn(
          'relative w-full overflow-hidden border-b-2 border-pencil bg-postit',
          compact ? 'h-20' : 'h-36'
        )}
      >
        {recipe.cover ? (
          <img
            src={recipe.cover}
            alt={recipe.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-pencil/40">
            <ChefHat size={compact ? 22 : 34} strokeWidth={2.5} />
          </div>
        )}
        <span className="absolute right-2 top-2 rounded-wobbly-sm border-2 border-pencil bg-white px-2 py-0.5 text-[11px] font-hand text-pencil">
          {SOURCE_LABEL[recipe.source.type]}
        </span>
      </div>

      {/* 信息 */}
      <div className={cn('flex flex-col gap-1.5', compact ? 'p-2.5' : 'p-3.5')}>
        <h3
          className={cn(
            'truncate font-title text-pencil',
            compact ? 'text-base' : 'text-h3'
          )}
        >
          {recipe.title}
        </h3>
        {!compact && (
          <div className="flex flex-wrap gap-1">
            {recipe.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-wobbly-sm border border-pencil bg-postit px-2 py-0.5 text-[11px] font-hand text-pencil"
              >
                {t}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1 text-meta font-hand text-pencil/60">
          <Flame size={13} strokeWidth={2.5} className="text-accent" />
          {recipe.cookCount > 0 ? `做过 ${recipe.cookCount} 次` : '还没做过'}
        </div>
      </div>
    </article>
  );
}
