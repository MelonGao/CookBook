// 标签徽章 —— 小号便利贴感，每个 tag 基于内容做稳定的微旋转（DESIGN_SYSTEM §3.4）
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Props {
  label: string;
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}

// 基于标签文本算一个稳定的 -2deg~2deg 旋转，避免每次 render 抖动
function wobble(label: string): number {
  let h = 0;
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) | 0;
  return (Math.abs(h) % 5) - 2; // -2..2
}

export default function Tag({ label, active, onClick, onRemove }: Props) {
  const clickable = !!onClick;
  return (
    <span
      onClick={onClick}
      style={{ transform: `rotate(${wobble(label)}deg)` }}
      className={cn(
        'inline-flex items-center gap-1 rounded-wobbly-sm border-2 border-pencil px-3 py-1 text-meta font-hand transition-transform',
        active ? 'bg-accent text-white' : 'bg-postit text-pencil',
        clickable && 'cursor-pointer hover:-translate-y-0.5'
      )}
    >
      {label}
      {onRemove && (
        <button
          type="button"
          aria-label={`移除 ${label}`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded-wobbly-sm hover:text-accent"
        >
          <X size={13} strokeWidth={3} />
        </button>
      )}
    </span>
  );
}
