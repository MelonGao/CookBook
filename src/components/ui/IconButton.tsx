// 图标按钮 —— 用于工具栏、卡片角标等（手绘风：wobbly + 硬阴影 hover）
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string; // 无障碍标签
}

export default function IconButton({ label, className, children, ...rest }: Props) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-wobbly-sm text-pencil',
        'transition-transform duration-100 hover:bg-accent hover:text-white hover:shadow-hand-sm',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/30',
        'disabled:cursor-not-allowed disabled:opacity-40',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
