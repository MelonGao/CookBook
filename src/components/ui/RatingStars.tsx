// 星级评分 —— 只读展示或可交互选择（手绘风：填色用 accent 红）
import { Star } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Props {
  value?: number;
  size?: number;
  onChange?: (value: 1 | 2 | 3 | 4 | 5) => void;
}

export default function RatingStars({ value = 0, size = 16, onChange }: Props) {
  const interactive = !!onChange;
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          aria-label={`${n} 星`}
          onClick={() => onChange?.(n as 1 | 2 | 3 | 4 | 5)}
          className={cn(interactive && 'cursor-pointer transition-transform hover:scale-110')}
        >
          <Star
            size={size}
            strokeWidth={2.5}
            className={n <= value ? 'fill-accent text-accent' : 'text-muted'}
          />
        </button>
      ))}
    </span>
  );
}
