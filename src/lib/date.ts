// 日期工具 —— 以周一为一周起点，全部用本地时区的 ISO 日期字符串（YYYY-MM-DD）

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 返回给定日期所在周的周一（ISO 字符串） */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0=周日
  const diff = day === 0 ? -6 : 1 - day; // 回退到周一
  d.setDate(d.getDate() + diff);
  return toISODate(d);
}

/** 在 weekStart 基础上加减若干周 */
export function addWeeks(weekStart: string, delta: number): string {
  const d = new Date(weekStart + 'T00:00:00');
  d.setDate(d.getDate() + delta * 7);
  return toISODate(d);
}

/** 给定周一，返回该周 7 天的 ISO 日期 */
export function weekDates(weekStart: string): string[] {
  const out: string[] = [];
  const base = new Date(weekStart + 'T00:00:00');
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    out.push(toISODate(d));
  }
  return out;
}

export const WEEKDAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

/** "5月18日" 形式 */
export function formatMonthDay(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 相对时间："今天 / 3天前 / 5月10日" */
export function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const day = 24 * 60 * 60 * 1000;
  if (diff < day && new Date(ts).getDate() === new Date().getDate()) return '今天';
  const days = Math.floor(diff / day);
  if (days < 1) return '今天';
  if (days < 7) return `${days} 天前`;
  return formatMonthDay(toISODate(new Date(ts)));
}

export function isThisWeek(weekStart: string): boolean {
  return weekStart === getWeekStart();
}
