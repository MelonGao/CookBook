// 基础按钮控件 —— 手绘风：硬边框 + 硬偏移阴影 + 按下压扁（DESIGN_SYSTEM §3.1）
import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'ghost' | 'outline' | 'secondary';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

// 共用的"按压"手感：hover 填色 + 位移吃掉阴影，active 再压扁
const press =
  'shadow-hand hover:shadow-hand-hover hover:translate-x-[2px] hover:translate-y-[2px] ' +
  'active:translate-x-[4px] active:translate-y-[4px] active:shadow-none';

const variants: Record<Variant, string> = {
  primary:
    'bg-white text-pencil hover:bg-accent hover:text-white ' + press,
  secondary:
    'bg-muted text-pencil hover:bg-ballpoint hover:text-white ' + press,
  outline:
    'bg-white text-pencil hover:bg-accent hover:text-white ' + press,
  // ghost：无边框无阴影的低调按钮，仅涂改线 hover
  ghost:
    'border-transparent text-pencil hover:text-accent hover:line-through decoration-2 decoration-accent',
};

const sizes: Record<Size, string> = {
  sm: 'text-meta px-3.5 py-1.5 gap-1.5',
  md: 'text-body px-5 py-2.5 gap-2',
  lg: 'text-body px-6 py-3 gap-2',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...rest
}: Props) {
  const bordered = variant !== 'ghost';
  return (
    <button
      className={cn(
        'inline-flex select-none items-center justify-center font-hand transition-transform duration-100',
        'rounded-wobbly-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ballpoint/30',
        'disabled:cursor-not-allowed disabled:opacity-50',
        bordered && 'border-[3px] border-pencil',
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
