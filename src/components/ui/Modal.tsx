// 模态弹窗 —— 带遮罩与 GSAP 入场动画
import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { gsap } from '@/lib/gsapSetup';

interface Props {
  open: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}

export default function Modal({ open, title, onClose, children, footer, width = 480 }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const overlay = overlayRef.current;
    if (!panel || !overlay) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power1.out' });
      gsap.fromTo(
        panel,
        { opacity: 0, y: 24, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.32, ease: 'back.out(1.5)' }
      );
    });
    return () => ctx.revert();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-pencil/50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={panelRef}
        className="relative flex max-h-[88vh] w-full flex-col overflow-hidden rounded-wobbly border-[3px] border-pencil bg-white shadow-hand-lg"
        style={{ maxWidth: width }}
      >
        {/* 红色图钉式关闭按钮（DESIGN_SYSTEM §3.5） */}
        <button
          aria-label="关闭"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-wobbly-blob border-2 border-pencil bg-accent text-white shadow-hand-sm transition-transform hover:rotate-12"
        >
          <X size={16} strokeWidth={3} />
        </button>
        <header className="border-b-2 border-dashed border-pencil px-5 py-4 pr-14">
          <h3 className="font-title text-h3 text-pencil">{title}</h3>
        </header>
        <div className="overflow-y-auto px-5 py-4 font-hand text-body">{children}</div>
        {footer && (
          <footer className="flex justify-end gap-2 border-t-2 border-dashed border-pencil px-5 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body
  );
}
