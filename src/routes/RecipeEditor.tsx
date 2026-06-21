// 新建 / 编辑菜谱 —— Markdown 实时预览 + 标题/标签/封面/来源/食材
// 封面图上传到 Supabase Storage（v1.1）
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Sparkles, Trash2, X } from 'lucide-react';
import type { Ingredient, RecipeSource } from '@/types/recipe';
import { useRecipeStore } from '@/stores/recipeStore';
import { useAuthStore } from '@/stores/authStore';
import { uploadCover, compressImage } from '@/lib/api/storage';
import {
  accumulateIngredients,
  mergeIngredients,
  parseIngredientsFromMarkdown,
} from '@/lib/parseIngredients';
import { clearDraft, dataUrlToFile, readDraft, writeDraft, type RecipeDraft } from '@/lib/drafts';
import { formatRelative } from '@/lib/date';
import MarkdownEditor from '@/components/recipe/MarkdownEditor';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Tag from '@/components/ui/Tag';
import { cn } from '@/lib/cn';

const STARTER_MD = `## 食材

- 食材A 适量
- 食材B 适量

## 步骤

1. 第一步…
2. 第二步…
`;

export default function RecipeEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = !!id;
  const userId = useAuthStore((s) => s.user?.id);

  const getRecipe = useRecipeStore((s) => s.getRecipe);
  const getVersion = useRecipeStore((s) => s.getVersion);
  const ready = useRecipeStore((s) => s.ready);
  const createRecipe = useRecipeStore((s) => s.createRecipe);
  const updateRecipe = useRecipeStore((s) => s.updateRecipe);
  const updateVersion = useRecipeStore((s) => s.updateVersion);

  const importedSource = (location.state as { source?: RecipeSource } | null)?.source;

  const [title, setTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');
  const [cover, setCover] = useState<string | undefined>();
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [bodyMd, setBodyMd] = useState(STARTER_MD);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [source, setSource] = useState<RecipeSource>(importedSource ?? { type: 'custom' });
  const [loaded, setLoaded] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [smartOpen, setSmartOpen] = useState(false);
  const [smartDraft, setSmartDraft] = useState<Ingredient[]>([]);
  // 用量输入框的"用户正在键入"原文（避免 React 把 "1." 立刻规范化成 1，导致小数点输不进去）
  const [amountTexts, setAmountTexts] = useState<Record<number, string>>({});
  const [smartAmountTexts, setSmartAmountTexts] = useState<Record<number, string>>({});
  // 草稿：检测到的待恢复草稿 + 用户最近一次手动保存草稿的反馈
  const [draftFound, setDraftFound] = useState<RecipeDraft | null>(null);
  const [draftMsg, setDraftMsg] = useState('');
  const draftMsgTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!isEdit || loaded || !ready) return;
    const recipe = getRecipe(id!);
    if (!recipe) return;
    const root = getVersion(recipe.rootVersionId);
    setTitle(recipe.title);
    setTags(recipe.tags);
    setCover(recipe.cover);
    setBodyMd(recipe.bodyMd);
    setSource(recipe.source);
    setIngredients(root?.ingredients ?? []);
    setLoaded(true);
  }, [isEdit, loaded, ready, id, getRecipe, getVersion]);

  // 进编辑器时（新建一定查，编辑要等 loaded 完成以免被原版盖住）扫一次本地草稿
  useEffect(() => {
    if (isEdit && !loaded) return;
    const d = readDraft(id);
    if (d) setDraftFound(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, loaded]);

  // 把"输入了但还没回车提交"的草稿标签也算进去，避免按钮明明该亮却灰着
  const pendingTag = tagDraft.trim();
  const effectiveTags = pendingTag && !tags.includes(pendingTag) ? [...tags, pendingTag] : tags;

  const missing: string[] = [];
  if (!title.trim()) missing.push('菜名');
  if (effectiveTags.length === 0) missing.push('至少一个标签');
  if (!bodyMd.trim()) missing.push('正文');
  const valid = missing.length === 0;

  const addTag = () => {
    const t = tagDraft.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagDraft('');
  };

  // 正文里能识别到几项食材（实时统计，给用户一个"可点"的信号）
  const detectedCount = useMemo(
    () => accumulateIngredients(parseIngredientsFromMarkdown(bodyMd)).length,
    [bodyMd]
  );

  const openSmartFill = () => {
    const parsed = accumulateIngredients(parseIngredientsFromMarkdown(bodyMd));
    setSmartDraft(parsed);
    setSmartOpen(true);
  };

  const applySmart = (mode: 'replace' | 'merge') => {
    const clean = smartDraft.filter((i) => i.name.trim());
    if (mode === 'replace') {
      setIngredients(clean);
    } else {
      setIngredients((prev) => mergeIngredients(prev, clean));
    }
    setAmountTexts({}); // 量值正在键入态作废
    setSmartAmountTexts({});
    setSmartOpen(false);
  };

  const handleCoverFile = (file: File) => {
    setCoverFile(file);
    // 本地预览
    const reader = new FileReader();
    reader.onload = () => setCover(reader.result as string);
    reader.readAsDataURL(file);
  };

  const flashDraftMsg = (msg: string) => {
    setDraftMsg(msg);
    if (draftMsgTimer.current) window.clearTimeout(draftMsgTimer.current);
    draftMsgTimer.current = window.setTimeout(() => setDraftMsg(''), 2400);
  };

  const handleSaveDraft = () => {
    const ok = writeDraft(id, {
      title,
      tags: effectiveTags,
      cover,
      bodyMd,
      ingredients,
      source,
      savedAt: Date.now(),
    });
    flashDraftMsg(ok ? '已保存为草稿' : '草稿已保存（封面太大未存）');
  };

  const handleRestoreDraft = async () => {
    if (!draftFound) return;
    setTitle(draftFound.title);
    setTags(draftFound.tags);
    setBodyMd(draftFound.bodyMd);
    setIngredients(draftFound.ingredients);
    setSource(draftFound.source);
    setAmountTexts({}); // 重置正在键入态
    if (draftFound.cover) {
      setCover(draftFound.cover);
      // 如果是 data: URL，把它转回 File 以便重新走压缩 + 上传流程
      if (draftFound.cover.startsWith('data:')) {
        try {
          const f = await dataUrlToFile(draftFound.cover);
          setCoverFile(f);
        } catch (err) {
          console.warn('[draft] 封面恢复失败，需重新选择', err);
          setCoverFile(null);
        }
      } else {
        setCoverFile(null);
      }
    }
    setDraftFound(null);
    flashDraftMsg('已恢复草稿');
  };

  const handleDiscardDraft = () => {
    clearDraft(id);
    setDraftFound(null);
  };

  const handleSave = async () => {
    if (!valid || !userId || saving || uploading) return;
    setSaveError('');
    const cleanIngredients = ingredients.filter((i) => i.name.trim());

    // 上传封面图到 Supabase Storage。失败必须明确中止，
    // 否则 base64 预览图（最大几 MB）会被当成 cover_url 写入数据库，
    // 导致请求长时间挂起，按钮一直停在"保存中…"。
    let coverUrl = cover;
    if (coverFile) {
      setUploading(true);
      try {
        const compressed = await compressImage(coverFile);
        coverUrl = await uploadCover(compressed, userId);
      } catch (err) {
        console.error('[cover] 上传失败', err);
        const msg = err instanceof Error ? err.message : String(err);
        setSaveError(`封面上传失败：${msg}（请检查网络或移除封面后再试）`);
        setUploading(false);
        return;
      }
      setUploading(false);
    } else if (typeof coverUrl === 'string' && coverUrl.startsWith('data:')) {
      // 防御性兜底：cover 还是本地预览的 data URL，但没有 coverFile，
      // 说明 state 异常，直接清掉，避免写入超大字符串。
      coverUrl = undefined;
    }

    setSaving(true);
    try {
      if (isEdit && id) {
        const recipe = getRecipe(id);
        if (recipe) {
          await updateRecipe(id, { title: title.trim(), tags: effectiveTags, cover: coverUrl, bodyMd, source });
          await updateVersion(recipe.rootVersionId, {
            bodyMd,
            ingredients: cleanIngredients,
          });
        }
        clearDraft(id);
        navigate(`/recipes/${id}`);
      } else {
        const created = await createRecipe(
          {
            title: title.trim(),
            tags: effectiveTags,
            cover: coverUrl,
            bodyMd,
            source: importedSource ? { ...source, type: 'imported' } : { ...source, type: 'custom' },
            ingredients: cleanIngredients,
          },
          userId
        );
        clearDraft(undefined);
        navigate(`/recipes/${created.id}`);
      }
    } catch (err) {
      console.error('[recipe] 保存失败', err);
      const msg = err instanceof Error ? err.message : String(err);
      setSaveError(`保存失败：${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const heading = useMemo(
    () => (isEdit ? '编辑菜谱' : importedSource ? '收藏菜谱' : '新建菜谱'),
    [isEdit, importedSource]
  );

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="mb-2 inline-flex items-center gap-1 font-hand text-meta text-pencil/60 hover:text-accent hover:line-through"
        >
          <ArrowLeft size={15} strokeWidth={2.5} />
          返回
        </button>
        <h1 className="font-title text-h1 text-pencil">{heading}</h1>
        {importedSource && (
          <p className="mt-1 font-hand text-body text-pencil/60">
            来源已填好，把正文粘贴 / 编辑进下面的编辑器即可。
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="space-y-5">
          <Field label="菜名 *">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="如：番茄炒蛋"
              className="input"
            />
          </Field>

          <Field label="标签 *">
            <div className="flex gap-2">
              <input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                onBlur={addTag}
                placeholder="输入后回车"
                className="input"
              />
              <Button variant="outline" size="sm" onClick={addTag}>
                <Plus size={14} />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <Tag key={t} label={t} onRemove={() => setTags(tags.filter((x) => x !== t))} />
                ))}
              </div>
            )}
          </Field>

          <Field label="封面图">
            {cover ? (
              <div className="relative">
                <img src={cover} alt="封面" className="h-36 w-full rounded-wobbly-md border-2 border-pencil object-cover" />
                <button
                  onClick={() => { setCover(undefined); setCoverFile(null); }}
                  className="absolute right-2 top-2 rounded-wobbly-blob border-2 border-pencil bg-accent p-1 text-white shadow-hand-sm"
                  aria-label="移除封面"
                >
                  <X size={14} strokeWidth={3} />
                </button>
              </div>
            ) : (
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleCoverFile(f);
                }}
                className={cn(
                  'flex h-32 cursor-pointer flex-col items-center justify-center rounded-wobbly-md border-2 border-dashed font-hand text-body transition-colors',
                  dragOver
                    ? 'border-accent bg-postit text-accent'
                    : 'border-pencil bg-white text-pencil/60 hover:bg-postit/40'
                )}
              >
                拖拽图片到此，或点击选择
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleCoverFile(f);
                  }}
                />
              </label>
            )}
          </Field>

          <Field label="来源">
            <div className="space-y-2">
              <input
                value={source.url ?? ''}
                onChange={(e) => setSource({ ...source, url: e.target.value || undefined })}
                placeholder="原始链接（选填）"
                className="input"
              />
              <input
                value={source.note ?? ''}
                onChange={(e) => setSource({ ...source, note: e.target.value || undefined })}
                placeholder="出处备注，如《家常川菜》P.42"
                className="input"
              />
              <input
                value={source.author ?? ''}
                onChange={(e) => setSource({ ...source, author: e.target.value || undefined })}
                placeholder="作者（选填）"
                className="input"
              />
            </div>
          </Field>

          <Field label="结构化食材（选填，用于用量缩放）">
            <div className="space-y-2">
              {detectedCount > 0 && ingredients.length === 0 && (
                <button
                  type="button"
                  onClick={openSmartFill}
                  className="flex w-full items-center justify-between rounded-wobbly-sm border-2 border-dashed border-accent bg-postit/40 px-3 py-2 text-left font-hand text-meta text-accent transition-colors hover:bg-postit"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles size={14} strokeWidth={2.5} />
                    正文里检测到 {detectedCount} 项食材
                  </span>
                  <span className="text-pencil/70">点击智能填入 →</span>
                </button>
              )}
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex gap-1.5">
                  <input
                    value={ing.name}
                    onChange={(e) => patchIngredient(setIngredients, idx, { name: e.target.value })}
                    placeholder="食材"
                    className="input flex-1 !px-2"
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amountTexts[idx] ?? (ing.amount ? String(ing.amount) : '')}
                    onChange={(e) => {
                      const raw = e.target.value;
                      // 只接受合法的"正在输入的小数"——支持 "1."、"0.5"、".5" 等中间态
                      if (raw !== '' && !/^\d*\.?\d*$/.test(raw)) return;
                      setAmountTexts((prev) => ({ ...prev, [idx]: raw }));
                      if (raw === '' || raw === '.') {
                        patchIngredient(setIngredients, idx, { amount: 0 });
                      } else {
                        const n = Number(raw);
                        if (!Number.isNaN(n)) patchIngredient(setIngredients, idx, { amount: n });
                      }
                    }}
                    onBlur={() => {
                      // 失焦后丢掉键入态，下次显示直接走 ing.amount → 规范化
                      setAmountTexts((prev) => {
                        const next = { ...prev };
                        delete next[idx];
                        return next;
                      });
                    }}
                    placeholder="量"
                    className="input w-20 !px-2"
                  />
                  <input
                    value={ing.unit}
                    onChange={(e) => patchIngredient(setIngredients, idx, { unit: e.target.value })}
                    placeholder="单位"
                    className="input w-20 !px-2"
                  />
                  <button
                    onClick={() => {
                      setIngredients(ingredients.filter((_, i) => i !== idx));
                      setAmountTexts({}); // 索引会偏移，清掉键入态
                    }}
                    className="px-1 text-pencil/50 hover:text-accent"
                    aria-label="删除该行"
                  >
                    <Trash2 size={15} strokeWidth={2.5} />
                  </button>
                </div>
              ))}
              <div className="flex flex-wrap gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIngredients([...ingredients, { name: '', amount: 0, unit: 'g' }])}
                >
                  <Plus size={14} />
                  添加食材
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIngredients([...ingredients, { name: '', amount: 0, unit: '适量' }])}
                  title="名称 + 描述，无固定用量"
                >
                  <Plus size={14} />
                  自定义
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openSmartFill}
                  title="从正文识别食材，重复项自动累加"
                >
                  <Sparkles size={14} />
                  智能识别{detectedCount > 0 ? `（${detectedCount}）` : ''}
                </Button>
              </div>
            </div>
          </Field>
        </div>

        <div>
          <span className="mb-1 block font-title text-body text-pencil">正文 *（食材 + 步骤）</span>
          <MarkdownEditor value={bodyMd} onChange={setBodyMd} height={560} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t-2 border-dashed border-pencil pt-4">
        {draftMsg && <span className="font-hand text-meta text-ballpoint">{draftMsg}</span>}
        {saveError ? (
          <span className="font-hand text-meta text-accent">{saveError}</span>
        ) : (
          !valid && <span className="font-hand text-meta text-pencil/50">还差：{missing.join('、')}</span>
        )}
        <Button variant="ghost" onClick={() => navigate(-1)}>
          取消
        </Button>
        <Button
          variant="outline"
          onClick={handleSaveDraft}
          disabled={uploading || saving}
          title="保存到本地，下次进来可以继续编辑（不会上传到云端）"
        >
          <Save size={14} strokeWidth={2.5} />
          保存为草稿
        </Button>
        <Button disabled={!valid || !userId || uploading || saving} onClick={handleSave}>
          {uploading ? '上传封面中…' : saving ? '保存中…' : isEdit ? '保存修改' : '创建菜谱'}
        </Button>
      </div>

      <Modal
        open={!!draftFound}
        title="发现未保存的草稿"
        onClose={() => setDraftFound(null)}
        footer={
          <>
            <Button variant="ghost" onClick={handleDiscardDraft}>
              丢弃草稿
            </Button>
            <Button onClick={handleRestoreDraft}>恢复草稿</Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="font-hand text-body text-pencil/70">
            上次{draftFound ? `（${formatRelative(draftFound.savedAt)}）` : ''}你在
            {isEdit ? '编辑这个菜谱' : '新建菜谱'}时保存过一份草稿。
          </p>
          {draftFound && (
            <div className="rounded-wobbly-sm border-2 border-dashed border-pencil bg-postit/40 px-3 py-2 text-meta font-hand text-pencil/70">
              <div>菜名：{draftFound.title || <span className="text-pencil/40">（空）</span>}</div>
              <div>
                标签：
                {draftFound.tags.length > 0
                  ? draftFound.tags.join('、')
                  : <span className="text-pencil/40">（空）</span>}
              </div>
              <div>食材：{draftFound.ingredients.length} 项</div>
              <div>正文：{draftFound.bodyMd.length} 字</div>
            </div>
          )}
          <p className="font-hand text-meta text-pencil/50">
            恢复后会替换当前表单内容。丢弃则永久删除草稿。
          </p>
        </div>
      </Modal>

      <Modal
        open={smartOpen}
        title="从正文识别食材"
        onClose={() => setSmartOpen(false)}
        width={560}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSmartOpen(false)}>
              取消
            </Button>
            <Button
              variant="outline"
              disabled={smartDraft.length === 0}
              onClick={() => applySmart('merge')}
              title="保留已有食材，相同名称+单位会累加用量"
            >
              合并累加
            </Button>
            <Button
              disabled={smartDraft.length === 0}
              onClick={() => applySmart('replace')}
            >
              替换列表
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-meta font-hand text-pencil/60">
            已从正文识别 {smartDraft.length} 项。重复出现的食材已按"名称 + 单位"累加。
            可在此处微调，或点击「自定义」追加一项。
          </p>
          {smartDraft.length === 0 ? (
            <p className="rounded-wobbly-sm border-2 border-dashed border-pencil bg-postit/40 px-3 py-4 text-center text-body font-hand text-pencil/60">
              没识别到食材。试试在正文里用「- 牛肉 200g」这样的格式列出。
            </p>
          ) : (
            <div className="space-y-2">
              {smartDraft.map((ing, idx) => (
                <div key={idx} className="flex gap-1.5">
                  <input
                    value={ing.name}
                    onChange={(e) => patchIngredient(setSmartDraft, idx, { name: e.target.value })}
                    placeholder="食材"
                    className="input flex-1 !px-2"
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    value={smartAmountTexts[idx] ?? (ing.amount ? String(ing.amount) : '')}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw !== '' && !/^\d*\.?\d*$/.test(raw)) return;
                      setSmartAmountTexts((prev) => ({ ...prev, [idx]: raw }));
                      if (raw === '' || raw === '.') {
                        patchIngredient(setSmartDraft, idx, { amount: 0 });
                      } else {
                        const n = Number(raw);
                        if (!Number.isNaN(n)) patchIngredient(setSmartDraft, idx, { amount: n });
                      }
                    }}
                    onBlur={() => {
                      setSmartAmountTexts((prev) => {
                        const next = { ...prev };
                        delete next[idx];
                        return next;
                      });
                    }}
                    placeholder="量"
                    className="input w-20 !px-2"
                  />
                  <input
                    value={ing.unit}
                    onChange={(e) => patchIngredient(setSmartDraft, idx, { unit: e.target.value })}
                    placeholder="单位"
                    className="input w-20 !px-2"
                  />
                  <button
                    onClick={() => {
                      setSmartDraft(smartDraft.filter((_, i) => i !== idx));
                      setSmartAmountTexts({});
                    }}
                    className="px-1 text-pencil/50 hover:text-accent"
                    aria-label="删除该行"
                  >
                    <Trash2 size={15} strokeWidth={2.5} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSmartDraft([...smartDraft, { name: '', amount: 0, unit: '适量' }])}
          >
            <Plus size={14} />
            自定义追加
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function patchIngredient(
  setter: React.Dispatch<React.SetStateAction<Ingredient[]>>,
  idx: number,
  patch: Partial<Ingredient>
) {
  setter((list) => list.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-title text-body text-pencil">{label}</span>
      {children}
    </label>
  );
}
