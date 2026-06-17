// 菜谱详情：左侧选中版本正文 + 食材表，右侧版本树，底部版本时间线
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Copy,
  GitBranch,
  ImageDown,
  Pencil,
  Trash2,
  Utensils,
} from 'lucide-react';
import { useRecipeStore, deleteVersionSafe } from '@/stores/recipeStore';
import type { RecipeVersion } from '@/types/recipe';
import { formatRelative } from '@/lib/date';
import { exportNodeAsImage } from '@/lib/share';
import MarkdownView from '@/components/recipe/MarkdownView';
import IngredientTable from '@/components/recipe/IngredientTable';
import VersionTree from '@/components/recipe/VersionTree';
import ShareCard from '@/components/recipe/ShareCard';
import RatingStars from '@/components/ui/RatingStars';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

export default function RecipeDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const recipe = useRecipeStore((s) => s.recipes.find((r) => r.id === id));
  const versions = useRecipeStore((s) => s.versions);
  const ready = useRecipeStore((s) => s.ready);
  const markCooked = useRecipeStore((s) => s.markCooked);
  const setRootVersion = useRecipeStore((s) => s.setRootVersion);
  const deleteRecipe = useRecipeStore((s) => s.deleteRecipe);

  const recipeVersions = useMemo(
    () => versions.filter((v) => v.recipeId === id).sort((a, b) => a.createdAt - b.createdAt),
    [versions, id]
  );

  const [selectedId, setSelectedId] = useState<string>('');
  const [confirm, setConfirm] = useState<{ msg: string; run: () => void } | null>(null);
  const [sourceCopied, setSourceCopied] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  // 默认选中"主干推荐"版本
  useEffect(() => {
    if (recipe && !recipeVersions.some((v) => v.id === selectedId)) {
      setSelectedId(recipe.rootVersionId);
    }
  }, [recipe, recipeVersions, selectedId]);

  if (ready && !recipe) {
    return (
      <div className="py-20 text-center">
        <p className="font-title text-h3 text-pencil">菜谱不存在</p>
        <Button className="mt-4" onClick={() => navigate('/recipes')}>
          回到菜谱列表
        </Button>
      </div>
    );
  }
  if (!recipe) return <p className="py-20 text-center font-hand text-body text-pencil/60">载入中…</p>;

  const selected: RecipeVersion =
    recipeVersions.find((v) => v.id === selectedId) ??
    recipeVersions.find((v) => v.id === recipe.rootVersionId) ??
    recipeVersions[0];

  const handleShare = async () => {
    if (shareRef.current) {
      await exportNodeAsImage(shareRef.current, recipe.title);
    }
  };

  // 用户填的「原链接」可能不是纯 URL（夹带文字），直接 href 跳转易失败。
  // 改为复制到剪贴板，用户自己粘到浏览器更稳妥。
  const copySourceUrl = async () => {
    const url = recipe.source.url;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // 兜底：在不支持或无权限时用旧版 textarea + execCommand
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* 忽略 */ }
      document.body.removeChild(ta);
    }
    setSourceCopied(true);
    window.setTimeout(() => setSourceCopied(false), 1800);
  };

  return (
    <div className="space-y-8">
      {/* 顶部 */}
      <div>
        <button
          onClick={() => navigate('/recipes')}
          className="mb-3 inline-flex items-center gap-1 font-hand text-meta text-pencil/60 hover:text-accent hover:line-through"
        >
          <ArrowLeft size={15} strokeWidth={2.5} />
          菜谱列表
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-title text-h1 text-pencil">{recipe.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {recipe.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-wobbly-sm border-2 border-pencil bg-postit px-2.5 py-0.5 text-xs font-hand text-pencil"
                >
                  {t}
                </span>
              ))}
              <span className="font-hand text-meta text-pencil/60">
                {recipe.cookCount > 0 ? `已复刻 ${recipe.cookCount} 次` : '还没做过'}
              </span>
            </div>
            {(recipe.source.note || recipe.source.url || recipe.source.author) && (
              <p className="mt-1.5 font-hand text-meta text-pencil/60">
                来源：
                {recipe.source.author && `${recipe.source.author} · `}
                {recipe.source.note}
                {recipe.source.url && (
                  <button
                    type="button"
                    onClick={copySourceUrl}
                    title={recipe.source.url}
                    className="ml-1 inline-flex items-center gap-1 align-baseline text-ballpoint underline underline-offset-2 hover:text-accent"
                  >
                    {sourceCopied ? (
                      <Check size={12} strokeWidth={2.5} />
                    ) : (
                      <Copy size={12} strokeWidth={2.5} />
                    )}
                    {sourceCopied ? '已复制' : recipe.source.note ? '复制原链接' : recipe.source.url}
                  </button>
                )}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => markCooked(recipe.id)}>
              <Utensils size={14} strokeWidth={2.5} />
              记一次复刻
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <ImageDown size={14} strokeWidth={2.5} />
              分享
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/recipes/${id}/edit`)}>
              <Pencil size={14} strokeWidth={2.5} />
              编辑
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-accent hover:text-accent"
              onClick={() =>
                setConfirm({
                  msg: `确定删除「${recipe.title}」？该菜谱的所有版本都会一并删除。`,
                  run: async () => {
                    await deleteRecipe(recipe.id);
                    navigate('/recipes');
                  },
                })
              }
            >
              <Trash2 size={14} strokeWidth={2.5} />
              删除
            </Button>
          </div>
        </div>
      </div>

      {/* 主体两栏 */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* 左：当前版本正文 + 食材表 */}
        <div className="space-y-5">
          <div className="rounded-wobbly border-2 border-pencil bg-white p-6 shadow-paper">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-title text-h3 text-pencil">{selected.label}</h2>
                {selected.id === recipe.rootVersionId && (
                  <span className="rounded-wobbly-sm border-2 border-pencil bg-accent px-2 py-0.5 text-[10px] font-hand text-white">
                    主干推荐
                  </span>
                )}
              </div>
              {selected.rating && <RatingStars value={selected.rating} />}
            </div>
            {selected.changeNote && (
              <p className="mb-4 rounded-wobbly-sm border-l-[3px] border-dashed border-accent bg-postit/50 px-3 py-2 font-hand text-body text-pencil/70">
                这次改动：{selected.changeNote}
              </p>
            )}
            <MarkdownView content={selected.bodyMd} />
          </div>

          <div>
            <h3 className="mb-2 font-title text-h3 text-pencil">食材用量</h3>
            <IngredientTable
              key={selected.id}
              recipeId={recipe.id}
              version={selected}
              onCreated={(vid) => setSelectedId(vid)}
            />
          </div>
        </div>

        {/* 右：版本树 */}
        <div className="space-y-4">
          <div className="rounded-wobbly border-2 border-pencil bg-white p-4 shadow-paper">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-title text-h3 text-pencil">版本树</h3>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/recipes/${id}/version?parent=${selected.id}`)}
              >
                <GitBranch size={13} strokeWidth={2.5} />
                新建分支
              </Button>
            </div>
            <VersionTree
              versions={recipeVersions}
              recommendedId={recipe.rootVersionId}
              selectedId={selected.id}
              onSelect={setSelectedId}
              onCreateBranch={(pid) => navigate(`/recipes/${id}/version?parent=${pid}`)}
              onEdit={(vid) => navigate(`/recipes/${id}/version?edit=${vid}`)}
              onSetRoot={(vid) => setRootVersion(recipe.id, vid)}
              onDelete={(vid) =>
                setConfirm({
                  msg: '确定删除这个版本？（仅可删除无子分支的版本）',
                  run: () => deleteVersionSafe(vid),
                })
              }
            />
            <p className="mt-3 font-hand text-meta text-pencil/60">
              点击节点切换版本 · 右键 / 长按节点可创建分支
            </p>
          </div>
        </div>
      </div>

      {/* 版本时间线 */}
      <div>
        <h3 className="mb-3 font-title text-h2 text-pencil">改动追溯</h3>
        <ol className="space-y-2">
          {[...recipeVersions].reverse().map((v) => (
            <li key={v.id}>
              <button
                onClick={() => setSelectedId(v.id)}
                className={
                  'flex w-full items-start gap-3 rounded-wobbly-md border-2 bg-white px-4 py-3 text-left transition-transform duration-100 hover:-translate-y-0.5 ' +
                  (v.id === selected.id
                    ? 'border-accent shadow-hand-sm'
                    : 'border-pencil')
                }
              >
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-wobbly-blob bg-accent" />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-title text-body text-pencil">{v.label}</span>
                    {v.parentVersionId === null && (
                      <span className="font-hand text-meta text-pencil/60">原始版本</span>
                    )}
                    {v.rating && <RatingStars value={v.rating} size={12} />}
                    <span className="font-hand text-meta text-pencil/60">{formatRelative(v.createdAt)}</span>
                  </span>
                  {v.changeNote && (
                    <span className="mt-0.5 block font-hand text-body text-pencil/60">{v.changeNote}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      {/* 离屏分享卡片（供截图） */}
      <div className="pointer-events-none fixed -left-[9999px] top-0">
        <ShareCard ref={shareRef} recipe={recipe} version={selected} />
      </div>

      {/* 确认弹窗 */}
      <Modal
        open={!!confirm}
        title="请确认"
        onClose={() => setConfirm(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              取消
            </Button>
            <Button
              className="bg-accent text-white hover:bg-accent"
              onClick={() => {
                confirm?.run();
                setConfirm(null);
              }}
            >
              确定
            </Button>
          </>
        }
      >
        <p className="font-hand text-body text-pencil/70">{confirm?.msg}</p>
      </Modal>
    </div>
  );
}
