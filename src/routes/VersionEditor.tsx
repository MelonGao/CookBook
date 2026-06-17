// 创建迭代版本（分支）/ 编辑既有版本
// 路由：/recipes/:id/version?parent=X（基于 X 创建子版本）或 ?edit=X（编辑 X）
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, GitBranch, Plus, Trash2 } from 'lucide-react';
import type { Ingredient } from '@/types/recipe';
import { useRecipeStore } from '@/stores/recipeStore';
import MarkdownEditor from '@/components/recipe/MarkdownEditor';
import Button from '@/components/ui/Button';
import RatingStars from '@/components/ui/RatingStars';

export default function VersionEditor() {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const parentId = params.get('parent');
  const editId = params.get('edit');
  const isEdit = !!editId;

  const ready = useRecipeStore((s) => s.ready);
  const getRecipe = useRecipeStore((s) => s.getRecipe);
  const getVersion = useRecipeStore((s) => s.getVersion);
  const createVersion = useRecipeStore((s) => s.createVersion);
  const updateVersion = useRecipeStore((s) => s.updateVersion);

  const [label, setLabel] = useState('');
  const [bodyMd, setBodyMd] = useState('');
  const [changeNote, setChangeNote] = useState('');
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5 | undefined>();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loaded, setLoaded] = useState(false);

  const baseId = editId ?? parentId;
  const base = baseId ? getVersion(baseId) : undefined;
  const recipe = getRecipe(id);

  // 初始化：编辑模式载入原数据；分支模式继承父版本正文与食材
  useEffect(() => {
    if (loaded || !ready || !base) return;
    if (isEdit) {
      setLabel(base.label);
      setChangeNote(base.changeNote ?? '');
      setRating(base.rating);
    } else {
      setLabel('');
      setChangeNote('');
    }
    setBodyMd(base.bodyMd);
    setIngredients(base.ingredients.map((i) => ({ ...i })));
    setLoaded(true);
  }, [loaded, ready, base, isEdit]);

  if (ready && (!recipe || !base)) {
    return (
      <div className="py-20 text-center">
        <p className="font-title text-h3 text-pencil">找不到对应的菜谱或版本</p>
        <Button className="mt-4" onClick={() => navigate(`/recipes/${id}`)}>
          返回详情
        </Button>
      </div>
    );
  }

  const valid = label.trim() && bodyMd.trim();

  const handleSave = async () => {
    if (!valid) return;
    const clean = ingredients.filter((i) => i.name.trim());
    if (isEdit && editId) {
      await updateVersion(editId, {
        label: label.trim(),
        bodyMd,
        ingredients: clean,
        changeNote: changeNote.trim() || undefined,
        rating,
      });
    } else if (parentId) {
      await createVersion(id, parentId, {
        label: label.trim(),
        bodyMd,
        ingredients: clean,
        changeNote: changeNote.trim() || undefined,
        rating,
      });
    }
    navigate(`/recipes/${id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => navigate(`/recipes/${id}`)}
          className="mb-2 inline-flex items-center gap-1 font-hand text-meta text-pencil/60 hover:text-accent hover:line-through"
        >
          <ArrowLeft size={15} strokeWidth={2.5} />
          返回详情
        </button>
        <h1 className="flex items-center gap-2 font-title text-h1 text-pencil">
          <GitBranch size={24} strokeWidth={2.5} className="text-accent" />
          {isEdit ? '编辑版本' : '创建迭代版本'}
        </h1>
        {!isEdit && base && (
          <p className="mt-1 font-hand text-body text-pencil/60">
            将基于「{base.label}」分叉出一个新版本，记录这次的改动。
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="space-y-5">
          <Field label="版本名称 *">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="如：微辣版 / v2 减糖"
              className="input"
            />
          </Field>
          <Field label="这次改了什么">
            <textarea
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder="如：糖减半，加一勺豆瓣"
              rows={3}
              className="input resize-none"
            />
          </Field>
          <Field label="这版自评">
            <RatingStars value={rating ?? 0} size={22} onChange={setRating} />
          </Field>
          <Field label="结构化食材（用于用量缩放）">
            <div className="space-y-2">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex gap-1.5">
                  <input
                    value={ing.name}
                    onChange={(e) =>
                      setIngredients((l) =>
                        l.map((it, i) => (i === idx ? { ...it, name: e.target.value } : it))
                      )
                    }
                    placeholder="食材"
                    className="input flex-1"
                  />
                  <input
                    type="number"
                    value={ing.amount}
                    onChange={(e) =>
                      setIngredients((l) =>
                        l.map((it, i) =>
                          i === idx ? { ...it, amount: Number(e.target.value) || 0 } : it
                        )
                      )
                    }
                    className="input w-16"
                  />
                  <input
                    value={ing.unit}
                    onChange={(e) =>
                      setIngredients((l) =>
                        l.map((it, i) => (i === idx ? { ...it, unit: e.target.value } : it))
                      )
                    }
                    placeholder="单位"
                    className="input w-16"
                  />
                  <button
                    onClick={() => setIngredients((l) => l.filter((_, i) => i !== idx))}
                    className="px-1 text-pencil/50 hover:text-accent"
                    aria-label="删除该行"
                  >
                    <Trash2 size={15} strokeWidth={2.5} />
                  </button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIngredients((l) => [...l, { name: '', amount: 0, unit: 'g' }])}
              >
                <Plus size={14} />
                添加食材
              </Button>
            </div>
          </Field>
        </div>

        <div>
          <span className="mb-1 block font-title text-body text-pencil">版本正文 *</span>
          <MarkdownEditor value={bodyMd} onChange={setBodyMd} height={560} />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t-2 border-dashed border-pencil pt-4">
        <Button variant="ghost" onClick={() => navigate(`/recipes/${id}`)}>
          取消
        </Button>
        <Button disabled={!valid} onClick={handleSave}>
          {isEdit ? '保存修改' : '创建分支'}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-title text-body text-pencil">{label}</span>
      {children}
    </label>
  );
}
