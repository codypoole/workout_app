/* ============ small formatting helpers ============ */
export function fmtTime(s: number): string {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return m + ':' + String(ss).padStart(2, '0');
}

export function mmdd(d: string): string {
  const x = new Date(d);
  return x.getMonth() + 1 + '/' + x.getDate();
}

/** ISO week key, e.g. "2026-23" — ported from screens-progress.jsx weekKey(). */
export function weekKey(dateStr: string): string {
  const d = new Date(dateStr);
  const onejan = new Date(d.getFullYear(), 0, 1);
  const wk = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
  return d.getFullYear() + '-' + String(wk).padStart(2, '0');
}
