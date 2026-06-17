// 曲面波浪页面转场（参考 CodePen GreenSock EaKpEpJ 的 curve sweep 效果）
// 一条 SVG 曲线自底部上扫盖满全屏，路由在覆盖最盛的一帧切换，随后曲线继续上行退出。
import { useEffect, useRef, useState } from 'react';
import { gsap } from '@/lib/gsapSetup';

interface Props {
  pathname: string;
  onCovered: () => void; // 曲线盖满屏幕的那一帧回调（在此切换页面内容）
}

// 转场渐变候选（均在设计系统六色内，含白色）；每次切页随机抽一组，不与上次重复
const GRADIENTS: Array<[string, string]> = [
  ['#fdfbf7', '#ff4d4d'], // 米纸白 → 红
  ['#fff9c4', '#ff4d4d'], // 便利贴黄 → 红
  ['#fdfbf7', '#2d5da1'], // 米纸白 → 蓝
  ['#fff9c4', '#2d5da1'], // 便利贴黄 → 蓝
  ['#ff4d4d', '#2d2d2d'], // 红 → 铅笔黑
  ['#fff9c4', '#fff9c4'], // 纯便利贴黄
];

function buildPath(p: number): string {
  if (p <= 1) {
    const topY = 100 * (1 - p);
    const curve = Math.sin(p * Math.PI) * 26;
    return `M 0 ${topY} Q 50 ${topY + curve} 100 ${topY} L 100 100 L 0 100 Z`;
  }
  const q = p - 1;
  const botY = 100 * (1 - q);
  const curve = Math.sin(q * Math.PI) * 26;
  return `M 0 0 L 100 0 L 100 ${botY} Q 50 ${botY + curve} 0 ${botY} Z`;
}

export default function CurveTransition({ pathname, onCovered }: Props) {
  const pathRef = useRef<SVGPathElement>(null);
  const gradIndex = useRef(0);
  const prevPath = useRef(pathname);
  const [grad, setGrad] = useState<[string, string]>(GRADIENTS[0]);
  const onCoveredRef = useRef(onCovered);
  onCoveredRef.current = onCovered;
  const coveredFired = useRef(false);

  useEffect(() => {
    if (prevPath.current === pathname) return;
    prevPath.current = pathname;

    const path = pathRef.current;
    if (!path) return;

    let next = Math.floor(Math.random() * GRADIENTS.length);
    if (next === gradIndex.current) next = (next + 1) % GRADIENTS.length;
    gradIndex.current = next;
    setGrad(GRADIENTS[next]);

    const state = { p: 0 };
    const render = () => path.setAttribute('d', buildPath(state.p));
    render();
    coveredFired.current = false;
    const cover = () => {
      if (coveredFired.current) return;
      coveredFired.current = true;
      onCoveredRef.current();
    };

    const tl = gsap.timeline();
    tl.to(state, { p: 1, duration: 0.5, ease: 'power2.in', onUpdate: render });
    tl.add(cover);
    tl.to(state, { p: 2, duration: 0.58, ease: 'power2.out', onUpdate: render }, '+=0.05');

    const failsafe = window.setTimeout(() => {
      cover();
      state.p = 2;
      render();
    }, 1500);

    return () => {
      tl.kill();
      window.clearTimeout(failsafe);
    };
  }, [pathname]);

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ pointerEvents: 'none' }}
      aria-hidden
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="curve-grad" x1="0" y1="0" x2="99" y2="99">
            <stop offset="0.15" stopColor={grad[0]} />
            <stop offset="0.85" stopColor={grad[1]} />
          </linearGradient>
        </defs>
        <path ref={pathRef} d={buildPath(0)} fill="url(#curve-grad)" />
      </svg>
    </div>
  );
}
