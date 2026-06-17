// 菜谱版本树 —— App 的灵魂特性
// SVG 画连线（主干粗线、分支细线），HTML 节点叠在上层（标签 + 星级 + 右键/长按菜单）
import { useMemo, useRef, useState } from 'react';
import { GitBranch, Pencil, Star, Trash2 } from 'lucide-react';
import type { RecipeVersion } from '@/types/recipe';
import { cn } from '@/lib/cn';

interface Props {
  versions: RecipeVersion[];
  recommendedId: string; // 当前"主干推荐"版本
  selectedId: string;
  onSelect: (id: string) => void;
  onCreateBranch: (parentVersionId: string) => void;
  onEdit: (versionId: string) => void;
  onSetRoot: (versionId: string) => void;
  onDelete: (versionId: string) => void;
}

const COL = 150;
const ROW = 104;
const NODE_W = 124;
const NODE_H = 56;
const PAD = 24;

interface Placed {
  v: RecipeVersion;
  col: number; // 列（横向）
  depth: number; // 行（纵向）
  isTrunkEdge: boolean; // 与父相连的边是否为主干（父的第一个孩子）
}

/** 叶子计数布局：叶子顺序占列，父节点居中于子节点之上 */
function layoutTree(versions: RecipeVersion[]): Placed[] {
  const root = versions.find((v) => v.parentVersionId === null);
  if (!root) return [];

  const childrenOf = (id: string) =>
    versions
      .filter((v) => v.parentVersionId === id)
      .sort((a, b) => a.createdAt - b.createdAt);

  const placed: Placed[] = [];
  let nextLeafCol = 0;

  const walk = (v: RecipeVersion, depth: number, isTrunkEdge: boolean): number => {
    const kids = childrenOf(v.id);
    let col: number;
    if (kids.length === 0) {
      col = nextLeafCol++;
    } else {
      const childCols = kids.map((k, i) => walk(k, depth + 1, i === 0));
      col = (childCols[0] + childCols[childCols.length - 1]) / 2;
    }
    placed.push({ v, col, depth, isTrunkEdge });
    return col;
  };

  walk(root, 0, true);
  return placed;
}

export default function VersionTree({
  versions,
  recommendedId,
  selectedId,
  onSelect,
  onCreateBranch,
  onEdit,
  onSetRoot,
  onDelete,
}: Props) {
  const placed = useMemo(() => layoutTree(versions), [versions]);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const longPress = useRef<number | null>(null);

  const posOf = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    for (const p of placed) {
      map.set(p.v.id, {
        x: PAD + p.col * COL + NODE_W / 2,
        y: PAD + p.depth * ROW + NODE_H / 2,
      });
    }
    return map;
  }, [placed]);

  if (placed.length === 0) {
    return <p className="font-hand text-body text-pencil/60">暂无版本数据。</p>;
  }

  const maxCol = Math.max(...placed.map((p) => p.col));
  const maxDepth = Math.max(...placed.map((p) => p.depth));
  const width = PAD * 2 + maxCol * COL + NODE_W;
  const height = PAD * 2 + maxDepth * ROW + NODE_H;

  const startLongPress = (id: string) => {
    longPress.current = window.setTimeout(() => setMenuFor(id), 480);
  };
  const cancelLongPress = () => {
    if (longPress.current) window.clearTimeout(longPress.current);
  };

  return (
    <div className="relative overflow-auto" onClick={() => setMenuFor(null)}>
      <div className="relative" style={{ width, height, minWidth: '100%' }}>
        {/* 连线层 */}
        <svg className="absolute inset-0" width={width} height={height}>
          {placed.map((p) => {
            if (p.v.parentVersionId === null) return null;
            const parent = posOf.get(p.v.parentVersionId);
            const child = posOf.get(p.v.id);
            if (!parent || !child) return null;
            const x1 = parent.x;
            const y1 = parent.y + NODE_H / 2;
            const x2 = child.x;
            const y2 = child.y - NODE_H / 2;
            const my = (y1 + y2) / 2;
            return (
              <path
                key={p.v.id}
                d={`M ${x1} ${y1} C ${x1} ${my} ${x2} ${my} ${x2} ${y2}`}
                fill="none"
                stroke={p.isTrunkEdge ? '#ff4d4d' : '#2d2d2d'}
                strokeWidth={p.isTrunkEdge ? 3 : 2}
                strokeLinecap="round"
                strokeDasharray={p.isTrunkEdge ? undefined : '5 4'}
              />
            );
          })}
        </svg>

        {/* 节点层 */}
        {placed.map((p) => {
          const pos = posOf.get(p.v.id)!;
          const selected = p.v.id === selectedId;
          const isRecommended = p.v.id === recommendedId;
          return (
            <div
              key={p.v.id}
              className="absolute"
              style={{ left: pos.x - NODE_W / 2, top: pos.y - NODE_H / 2 }}
            >
              <button
                onClick={() => onSelect(p.v.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setMenuFor(p.v.id);
                }}
                onTouchStart={() => startLongPress(p.v.id)}
                onTouchEnd={cancelLongPress}
                onTouchMove={cancelLongPress}
                className={cn(
                  'flex flex-col items-center justify-center text-center transition-transform duration-100',
                  'rounded-wobbly-sm border-2 bg-white px-2',
                  selected
                    ? 'border-accent shadow-hand'
                    : 'border-pencil shadow-hand-sm hover:-translate-y-0.5'
                )}
                style={{ width: NODE_W, height: NODE_H }}
              >
                <span
                  className={cn(
                    'flex max-w-full items-center gap-1 truncate font-title text-sm',
                    selected ? 'text-accent' : 'text-pencil'
                  )}
                >
                  {isRecommended && (
                    <Star size={11} strokeWidth={2.5} className="shrink-0 fill-accent text-accent" />
                  )}
                  <span className="truncate">{p.v.label}</span>
                </span>
                <span className="mt-0.5 flex items-center gap-0.5">
                  {p.v.rating ? (
                    Array.from({ length: p.v.rating }).map((_, i) => (
                      <Star key={i} size={9} className="fill-accent text-accent" />
                    ))
                  ) : (
                    <span className="text-[10px] font-hand text-pencil/50">未评分</span>
                  )}
                </span>
              </button>

              {/* 右键 / 长按菜单 */}
              {menuFor === p.v.id && (
                <div
                  className="absolute left-1/2 top-full z-20 mt-1 w-40 -translate-x-1/2 overflow-hidden rounded-wobbly-sm border-2 border-pencil bg-white py-1 shadow-hand"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MenuItem
                    icon={<GitBranch size={13} />}
                    label="创建分支"
                    onClick={() => {
                      setMenuFor(null);
                      onCreateBranch(p.v.id);
                    }}
                  />
                  <MenuItem
                    icon={<Pencil size={13} />}
                    label="编辑此版本"
                    onClick={() => {
                      setMenuFor(null);
                      onEdit(p.v.id);
                    }}
                  />
                  <MenuItem
                    icon={<Star size={13} />}
                    label="设为主干推荐"
                    disabled={isRecommended}
                    onClick={() => {
                      setMenuFor(null);
                      onSetRoot(p.v.id);
                    }}
                  />
                  <MenuItem
                    icon={<Trash2 size={13} />}
                    label="删除版本"
                    danger
                    disabled={p.v.parentVersionId === null}
                    onClick={() => {
                      setMenuFor(null);
                      onDelete(p.v.id);
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 px-3 py-2 text-left text-meta font-hand transition-colors',
        disabled
          ? 'cursor-not-allowed text-pencil/30'
          : danger
            ? 'text-accent hover:bg-accent hover:text-white'
            : 'text-pencil hover:bg-postit'
      )}
    >
      {icon}
      {label}
    </button>
  );
}
