// Markdown 编辑器 —— 包装 @uiw/react-md-editor，左输入右实时预览。
// 自带工具栏含粗体/斜体/标题/列表/插入图片；另加"插入本地图片"按钮转 base64 内嵌。
import { useRef, useState } from 'react';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import { ImagePlus, Loader2 } from 'lucide-react';
import { compressImage, uploadImage } from '@/lib/api/storage';
import { useAuthStore } from '@/stores/authStore';

interface Props {
  value: string;
  onChange: (value: string) => void;
  height?: number;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function MarkdownEditor({ value, onChange, height = 460 }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [inserting, setInserting] = useState(false);
  const [note, setNote] = useState('');
  const userId = useAuthStore((s) => s.user?.id);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setInserting(true);
    setNote('');
    try {
      // 先缩放 + 压缩，缩小体积也加快上传
      const compressed = await compressImage(file, 1000, 0.7);
      let url: string;
      try {
        if (!userId) throw new Error('未登录，无法上传');
        // 优先上传到云端，正文里只留一条短链接
        url = await uploadImage(compressed, userId);
      } catch (uploadErr) {
        // 上传失败（如 bucket 未创建 / 权限未配）时退回 base64 内嵌，保证不阻断编辑
        console.warn('[md-image] 云端上传失败，临时改用 base64 内嵌', uploadErr);
        url = await fileToDataUrl(compressed);
        setNote('云端上传失败，已临时内嵌图片。请确认 Supabase 已创建 recipe-covers bucket 并配好权限。');
      }
      onChange(`${value}\n\n![图片](${url})\n`);
    } catch (err) {
      console.error('[md-image] 插入本地图片失败', err);
      setNote('插入失败，请重试或换一张图片。');
    } finally {
      setInserting(false);
    }
  };

  return (
    <div data-color-mode="light">
      <div className="mb-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={inserting}
          className="inline-flex items-center gap-1.5 rounded-wobbly-sm border-2 border-pencil bg-white px-2.5 py-1.5 text-meta font-hand text-pencil shadow-hand-sm transition-transform duration-100 hover:bg-accent hover:text-white hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {inserting ? (
            <Loader2 size={14} strokeWidth={2.5} className="animate-spin" />
          ) : (
            <ImagePlus size={14} strokeWidth={2.5} />
          )}
          {inserting ? '上传中…' : '插入本地图片'}
        </button>
        <span className="text-meta font-hand text-pencil/60">图片将上传到云端，正文只保留短链接</span>
      </div>
      {note && (
        <p className="mb-2 rounded-wobbly-sm border-2 border-dashed border-accent bg-postit/40 px-2.5 py-1.5 text-meta font-hand text-accent">
          {note}
        </p>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <MDEditor
        value={value}
        onChange={(v) => onChange(v ?? '')}
        height={height}
        preview="live"
        visibleDragbar={false}
        textareaProps={{ placeholder: '在这里写食材与步骤…支持 Markdown（表格、勾选框、图片）' }}
      />
    </div>
  );
}
