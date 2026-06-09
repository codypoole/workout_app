/* ============ Hand-rolled SVG charts — ported from components.jsx ============ */

export interface ChartPoint {
  x: string;
  y: number;
}

export function LineChart({ points, height = 150 }: { points: ChartPoint[]; height?: number }) {
  const W = 327;
  const H = height;
  const pad = { l: 8, r: 8, t: 16, b: 22 };
  if (!points || points.length === 0)
    return <div className="faint" style={{ padding: 20 }}>No data yet</div>;

  const ys = points.map((p) => p.y);
  let min = Math.min(...ys);
  let max = Math.max(...ys);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const range = max - min;
  min -= range * 0.12;
  max += range * 0.12;

  const px = (i: number) => pad.l + (i / Math.max(1, points.length - 1)) * (W - pad.l - pad.r);
  const py = (v: number) => pad.t + (1 - (v - min) / (max - min)) * (H - pad.t - pad.b);
  const line = points.map((p, i) => (i ? 'L' : 'M') + px(i).toFixed(1) + ' ' + py(p.y).toFixed(1)).join(' ');
  const area = line + ` L ${px(points.length - 1).toFixed(1)} ${H - pad.b} L ${px(0).toFixed(1)} ${H - pad.b} Z`;
  const showLabels =
    points.length <= 8
      ? points
      : points.filter((_, i) => i % Math.ceil(points.length / 6) === 0 || i === points.length - 1);

  return (
    <svg width={W} height={H} style={{ display: 'block', width: '100%' }} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id="lc-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((t, i) => (
        <line
          key={i}
          x1={pad.l}
          x2={W - pad.r}
          y1={pad.t + t * (H - pad.t - pad.b)}
          y2={pad.t + t * (H - pad.t - pad.b)}
          stroke="var(--line)"
          strokeWidth="1"
        />
      ))}
      <path d={area} fill="url(#lc-grad)" />
      <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={px(i)}
          cy={py(p.y)}
          r={i === points.length - 1 ? 4 : 2.5}
          fill={i === points.length - 1 ? 'var(--accent)' : 'var(--surface)'}
          stroke="var(--accent)"
          strokeWidth="2"
        />
      ))}
      {showLabels.map((p, i) => {
        const idx = points.indexOf(p);
        return (
          <text
            key={i}
            x={px(idx)}
            y={H - 7}
            fill="var(--text-faint)"
            fontSize="9"
            fontFamily="var(--font-mono)"
            textAnchor="middle"
          >
            {p.x}
          </text>
        );
      })}
    </svg>
  );
}

export function BarChart({ points, height = 140 }: { points: ChartPoint[]; height?: number }) {
  const W = 327;
  const H = height;
  const pad = { t: 12, b: 22 };
  if (!points || !points.length)
    return <div className="faint" style={{ padding: 20 }}>No data yet</div>;

  const max = Math.max(...points.map((p) => p.y), 1);
  const bw = W / points.length;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', width: '100%' }}>
      {points.map((p, i) => {
        const h = (p.y / max) * (H - pad.t - pad.b);
        const x = i * bw + bw * 0.16;
        const w = bw * 0.68;
        return (
          <g key={i}>
            <rect
              x={x}
              y={H - pad.b - h}
              width={w}
              height={Math.max(2, h)}
              rx="3"
              fill={i === points.length - 1 ? 'var(--accent)' : 'var(--surface-3)'}
            />
            <text
              x={x + w / 2}
              y={H - 7}
              fill="var(--text-faint)"
              fontSize="9"
              fontFamily="var(--font-mono)"
              textAnchor="middle"
            >
              {p.x}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
