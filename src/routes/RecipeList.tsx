// 菜谱列表：搜索 + tag 筛选 + 网格展示
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookMarked, Plus, Search } from 'lucide-react';
import { useRecipeStore } from '@/stores/recipeStore';
import RecipeCard from '@/components/recipe/RecipeCard';
import Tag from '@/components/ui/Tag';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';

export default function RecipeList() {
  const navigate = useNavigate();
  const recipes = useRecipeStore((s) => s.recipes);

  const [query, setQuery] = useState('');
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    recipes.forEach((r) => r.tags.forEach((t) => set.add(t)));
    return [...set].sort();
  }, [recipes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recipes
      .filter((r) => (q ? r.title.toLowerCase().includes(q) : true))
      .filter((r) => (activeTags.length ? activeTags.every((t) => r.tags.includes(t)) : true))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [recipes, query, activeTags]);

  const toggleTag = (t: string) =>
    setActiveTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-title text-h1 text-pencil">我的菜谱</h1>
          <p className="mt-1 font-hand text-body text-pencil/60">共 {recipes.length} 道 · 每一次复刻都被记下</p>
        </div>
        <Button onClick={() => navigate('/new')}>
          <Plus size={16} strokeWidth={3} />
          新建菜谱
        </Button>
      </div>

      {/* 搜索 */}
      <div className="relative">
        <Search size={16} strokeWidth={2.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-pencil/50" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索菜名…"
          className="input pl-9"
        />
      </div>

      {/* tag 筛选 */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {allTags.map((t) => (
            <Tag key={t} label={t} active={activeTags.includes(t)} onClick={() => toggleTag(t)} />
          ))}
        </div>
      )}

      {/* 网格 */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<BookMarked size={40} strokeWidth={2} />}
          title={recipes.length === 0 ? '还没有菜谱' : '没有匹配的菜谱'}
          hint={
            recipes.length === 0
              ? '新建一道，或从小红书 / 下厨房收藏一道开始。'
              : '换个关键词或清空筛选试试。'
          }
          action={
            recipes.length === 0 && (
              <Button onClick={() => navigate('/new')}>
                <Plus size={16} />
                新建第一道菜
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((r) => (
            <RecipeCard
              key={r.id}
              recipe={r}
              onClick={() => navigate(`/recipes/${r.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
