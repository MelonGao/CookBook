// 从外部导入菜谱 —— 仅录入来源信息，提交后跳转到编辑器手动粘贴正文
// v1 不自动抓取网页内容（规避 CORS 与反爬）
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Download } from 'lucide-react';
import type { RecipeSource } from '@/types/recipe';
import Button from '@/components/ui/Button';

export default function Import() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('');

  // URL 与备注至少填一项
  const valid = url.trim() !== '' || note.trim() !== '';

  const handleNext = () => {
    if (!valid) return;
    const source: RecipeSource = {
      type: 'imported',
      url: url.trim() || undefined,
      note: note.trim() || undefined,
      author: author.trim() || undefined,
    };
    navigate('/new', { state: { source } });
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <button
          onClick={() => navigate('/')}
          className="mb-2 inline-flex items-center gap-1 font-hand text-meta text-pencil/60 hover:text-accent hover:line-through"
        >
          <ArrowLeft size={15} strokeWidth={2.5} />
          首页
        </button>
        <h1 className="flex items-center gap-2 font-title text-h1 text-pencil">
          <Download size={24} strokeWidth={2.5} className="text-accent" />
          收藏外部菜谱
        </h1>
        <p className="mt-1 font-hand text-body text-pencil/60">
          看到喜欢的菜谱？先把出处记下来。下一步把正文粘贴进编辑器即可——
          收藏和自建用的是同一个编辑器。
        </p>
      </div>

      <div className="-rotate-1 space-y-4 rounded-wobbly border-2 border-pencil bg-white p-6 shadow-hand">
        <Field label="原始链接" hint="小红书 / 下厨房 / 微博 / B 站…">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="input"
          />
        </Field>
        <Field label="出处备注" hint="书名页码也算，如《家常川菜》P.42">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="来自哪里"
            className="input"
          />
        </Field>
        <Field label="作者" hint="选填">
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="原作者 / 博主"
            className="input"
          />
        </Field>

        <p className="font-hand text-meta text-pencil/60">链接与备注至少填写一项。</p>

        <div className="flex justify-end">
          <Button disabled={!valid} onClick={handleNext}>
            下一步：粘贴正文
            <ArrowRight size={15} strokeWidth={2.5} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-baseline gap-2">
        <span className="font-title text-body text-pencil">{label}</span>
        {hint && <span className="font-hand text-meta text-pencil/60">{hint}</span>}
      </span>
      {children}
    </label>
  );
}
