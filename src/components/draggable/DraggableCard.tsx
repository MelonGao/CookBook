// 可拖拽卡片 —— 基于 GSAP Draggable + InertiaPlugin（type:"x,y" 惯性版，见规划文档 §6）
// 拖拽中放大投影；松手用 hitTest 判定落点格子，命中即回调，随后惯性回弹原位。
import { useEffect, useRef } from 'react';
import { gsap, Draggable } from '@/lib/gsapSetup';

interface Props {
  children: React.ReactNode;
  dragId: string; // 拖拽载荷标识，如 "recipe:xxx" / "slot:xxx"
  onDrop: (dragId: string, targetEl: HTMLElement) => void;
  targetSelector?: string; // 落点候选选择器
  disabled?: boolean;
  className?: string;
}

export default function DraggableCard({
  children,
  dragId,
  onDrop,
  targetSelector = '[data-drop-cell]',
  disabled,
  className,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;

  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;

    const instances = Draggable.create(el, {
      type: 'x,y',
      inertia: true, // 惯性版：减速与回弹更跟手
      zIndexBoost: true,
      onPress() {
        // 拖起的便利贴：放大、摆正、硬偏移阴影变远（DESIGN_SYSTEM §9）
        gsap.to(el, {
          scale: 1.08,
          rotation: 0,
          boxShadow: '12px 12px 0px 0px #2d2d2d',
          duration: 0.2,
          ease: 'power2.out',
        });
      },
      onRelease() {
        gsap.to(el, {
          scale: 1,
          boxShadow: '3px 3px 0px 0px rgba(45,45,45,0.1)',
          duration: 0.22,
          ease: 'back.out(1.5)',
        });
      },
      onDragEnd() {
        // 找命中的落点格子（至少 35% 重叠）
        const targets = Array.from(
          document.querySelectorAll<HTMLElement>(targetSelector)
        );
        let hit: HTMLElement | null = null;
        for (const t of targets) {
          if (t === el || t.contains(el)) continue;
          if (this.hitTest(t, '35%')) {
            hit = t;
            break;
          }
        }
        if (hit) onDropRef.current(dragId, hit);
        // 回弹原位（overwrite 覆盖惯性投掷）
        gsap.to(el, { x: 0, y: 0, duration: 0.45, ease: 'power3.out', overwrite: true });
      },
    });

    return () => {
      instances.forEach((i) => i.kill());
    };
  }, [dragId, targetSelector, disabled]);

  return (
    <div ref={ref} className={className} style={{ touchAction: 'none' }}>
      {children}
    </div>
  );
}
