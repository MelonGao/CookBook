// 可编辑食材用量表 —— 直接改用量、按比例整列缩放、另存为新版本（创建子版本）
import { useMemo, useState } from 'react';
import { Save, Scale } from 'lucide-react';
import type { Ingredient, RecipeVersion } from '@/types/recipe';
import { useRecipeStore } from '@/stores/recipeStore';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import RatingStars from '@/components/ui/RatingStars';

interface Props {
  recipeId: string;
  version: RecipeVersion; // 当前选中版本
  onCreated?: (versionId: string) => void;
}

export default function IngredientTable({ recipeId, version, onCreated }: Props) {
  // base 为各行基准用量；显示值 = base * scale
  const [base, setBase] = useState<Ingredient[]>(() => version.ingredients.map((i) => ({ ...i })));
  const [scale, setScale] = useState(1);
  const [saveOpen, setSaveOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [changeNote, setChangeNote] = useState('');
  const [rating, setRating] = useState<1 | 2 | 3 | 4 | 5 | undefined>();
  const createVersion = useRecipeStore((s) => s.createVersion);

  // 当前显示（已缩放）的食材列表
  const scaled = useMemo<Ingredient[]>(
    () => base.map((i) => ({ ...i, amount: Math.round(i.amount * scale * 100) / 100 })),
    [base, scale]
  );

  const dirty = scale !== 1 || base.some((b, i) => b.amount !== version.ingredients[i]?.amount);

  // 编辑某行：把输入解释为"缩放后"的值，反推 base 使显示一致
  const editAmount = (idx: number, raw: string) => {
    const val = Number(raw);
    if (Number.isNaN(val)) return;
    setBase((rows) => rows.map((r, i) => (i === idx ? { ...r, amount: val / scale } : r)));
  };

  const handleSave = async () => {
    const v = await createVersion(recipeId, version.id, {
      label: label.trim() || '调整用量',
      bodyMd: version.bodyMd,
      ingredients: scaled,
      changeNote: changeNote.trim() || undefined,
      rating,
    });
    setSaveOpen(false);
    setLabel('');
    setChangeNote('');
    setRating(undefined);
    onCreated?.(v.id);
  };

  if (version.ingredients.length === 0) {
    return (
      <p className="rounded-wobbly-md border-2 border-dashed border-pencil bg-white/60 px-4 py-6 text-center text-body font-hand text-pencil/60">
        这个版本还没有结构化食材。新建版本或编辑菜谱时可补充。
      </p>
    );
  }

  return (
    <div className="rounded-wobbly-md border-2 border-pencil bg-white p-4 shadow-paper">
      {/* 比例缩放滑块 */}
      <div className="mb-4 flex items-center gap-3">
        <Scale size={16} strokeWidth={2.5} className="shrink-0 text-accent" />
        <span className="shrink-0 font-hand text-body text-pencil">按比例</span>
        <input
          type="range"
          min={0.5}
          max={3}
          step={0.25}
          value={scale}
          onChange={(e) => setScale(Number(e.target.value))}
          className="h-1.5 flex-1 cursor-pointer accent-accent"
        />
        <span className="w-12 shrink-0 text-right font-title text-body text-accent">
          {scale}x
        </span>
      </div>

      {/* 用量表 */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-dashed border-pencil text-left text-meta font-hand text-pencil/60">
            <th className="pb-2 font-normal">食材</th>
            <th className="pb-2 font-normal">用量</th>
            <th className="pb-2 font-normal">单位</th>
          </tr>
        </thead>
        <tbody>
          {scaled.map((ing, idx) => (
            <tr key={idx} className="border-b-2 border-dashed border-muted last:border-0">
              <td className="py-2 pr-2 font-hand text-body text-pencil">{ing.name}</td>
              <td className="py-2 pr-2">
                <input
                  type="number"
                  value={ing.amount}
                  min={0}
                  step="any"
                  onChange={(e) => editAmount(idx, e.target.value)}
                  className="w-24 rounded-wobbly-sm border-2 border-pencil bg-white px-2 py-1 font-hand text-pencil focus:border-ballpoint focus:outline-none focus:ring-2 focus:ring-ballpoint/20"
                />
              </td>
              <td className="py-2 font-hand text-body text-pencil/60">{ing.unit}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-meta font-hand text-pencil/60">
          {dirty ? '已调整，可另存为新版本' : '修改用量后可另存为分支版本'}
        </span>
        <Button size="sm" disabled={!dirty} onClick={() => setSaveOpen(true)}>
          <Save size={14} strokeWidth={2.5} />
          保存为新版本
        </Button>
      </div>

      <Modal
        open={saveOpen}
        title="保存为新版本"
        onClose={() => setSaveOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={!label.trim()}>
              创建分支
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="font-hand text-body text-pencil/70">
            将基于「{version.label}」创建一个子版本，记录这次的用量调整。
          </p>
          <Field label="版本名称 *">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="如：加倍版 / 减盐版"
              className="input"
            />
          </Field>
          <Field label="这次改了什么">
            <textarea
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder="如：整体放大 1.5 倍，盐略减"
              rows={3}
              className="input resize-none"
            />
          </Field>
          <Field label="给这版打个分">
            <RatingStars value={rating ?? 0} size={22} onChange={setRating} />
          </Field>
        </div>
      </Modal>
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
