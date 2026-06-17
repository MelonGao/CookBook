// 空状态 —— 列表/页面无数据时的友好占位（虚线框 + 微旋转草稿感）
import type { ReactNode } from 'react';

interface Props {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, hint, action }: Props) {
  return (
    <div className="flex -rotate-1 flex-col items-center justify-center rounded-wobbly border-2 border-dashed border-pencil bg-white/60 px-6 py-14 text-center">
      {icon && <div className="mb-3 text-accent">{icon}</div>}
      <p className="font-title text-h3 text-pencil">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-body text-pencil/60">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
