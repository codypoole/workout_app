/* ============ SHARED COMPONENTS (window-exported) ============ */
const { useState, useEffect, useRef, useMemo } = React;

/* ---- Icons (simple line/shape SVGs) ---- */
function Icon({ name, size = 22, stroke = 2 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    today: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    plan: <><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></>,
    library: <><path d="M6.5 4h11M6.5 4 4 7v13h16V7l-2.5-3M4 12h16"/><path d="M9.5 16h5"/></>,
    progress: <><path d="M4 19V5M4 19h16"/><path d="M7 15l3.5-4 3 2.5L20 7"/></>,
    dumbbell: <><path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    check: <><path d="M5 13l4 4L19 7"/></>,
    x: <><path d="M6 6l12 12M18 6 6 18"/></>,
    play: <><path d="M7 5l12 7-12 7V5z"/></>,
    pause: <><path d="M8 5v14M16 5v14"/></>,
    timer: <><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></>,
    edit: <><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m21 21-4-4"/></>,
    swap: <><path d="M7 4 4 7l3 3M4 7h13M17 20l3-3-3-3M20 17H7"/></>,
    chevron: <><path d="M9 6l6 6-6 6"/></>,
    chevdown: <><path d="M6 9l6 6 6-6"/></>,
    back: <><path d="M15 6l-6 6 6 6"/></>,
    upload: <><path d="M12 16V4M7 9l5-5 5 5M5 20h14"/></>,
    trophy: <><path d="M7 4h10v4a5 5 0 0 1-10 0V4zM5 5H3v1a3 3 0 0 0 3 3M19 5h2v1a3 3 0 0 1-3 3M9 19h6M10 15v4M14 15v4"/></>,
    flame: <><path d="M12 3c2 3 5 4.5 5 9a5 5 0 0 1-10 0c0-1.5.5-2.5 1-3 .3 1 1 1.5 1.5 1.5C9.5 8 12 7 12 3z"/></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></>,
    dots: <><circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></>,
    minus: <><path d="M5 12h14"/></>,
    copy: <><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></>,
  };
  return <svg {...p}>{paths[name] || null}</svg>;
}

/* ---- Status bar ---- */
function StatusBar() {
  return (
    <div className="statusbar">
      <span>9:41</span>
      <div className="sb-right mono">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.5" y="5" width="3" height="6" rx="1"/><rect x="9" y="2.5" width="3" height="8.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></svg>
        <svg width="22" height="11" viewBox="0 0 22 11" fill="none" stroke="currentColor" strokeWidth="1"><rect x="1" y="1" width="17" height="9" rx="2.5"/><rect x="2.5" y="2.5" width="12" height="6" rx="1" fill="currentColor" stroke="none"/><rect x="19.5" y="3.5" width="1.5" height="4" rx="1" fill="currentColor" stroke="none"/></svg>
      </div>
    </div>
  );
}

/* ---- Bottom sheet ---- */
function Sheet({ open, onClose, title, children, full }) {
  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" style={full ? { height: '92%' } : null} onClick={e => e.stopPropagation()}>
        <div className="sheet-grip"></div>
        {title && (
          <div className="row between" style={{ padding: '6px 18px 10px' }}>
            <div className="h2">{title}</div>
            <button className="icon-btn" onClick={onClose}><Icon name="x" size={18} /></button>
          </div>
        )}
        <div className="scroll" style={{ padding: '0 18px 24px' }}>{children}</div>
      </div>
    </div>
  );
}

/* ---- Progress ring ---- */
function Ring({ value, size = 56, stroke = 6, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(1, value)));
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle className="ring-track" cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={stroke} />
        <circle className="ring-fill" cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>{children}</div>
    </div>
  );
}

/* ---- Line chart (for progress) ---- */
function LineChart({ points, height = 150, accent = true, fmt = (v)=>v, label }) {
  // points: [{x: 'label', y: number}]
  const W = 327, H = height, pad = { l: 8, r: 8, t: 16, b: 22 };
  if (!points || points.length === 0) return <div className="faint" style={{padding:20}}>No data yet</div>;
  const ys = points.map(p => p.y);
  let min = Math.min(...ys), max = Math.max(...ys);
  if (min === max) { min -= 1; max += 1; }
  const range = max - min;
  min -= range * 0.12; max += range * 0.12;
  const px = (i) => pad.l + (i / Math.max(1, points.length - 1)) * (W - pad.l - pad.r);
  const py = (v) => pad.t + (1 - (v - min) / (max - min)) * (H - pad.t - pad.b);
  const line = points.map((p, i) => (i ? 'L' : 'M') + px(i).toFixed(1) + ' ' + py(p.y).toFixed(1)).join(' ');
  const area = line + ` L ${px(points.length-1).toFixed(1)} ${H-pad.b} L ${px(0).toFixed(1)} ${H-pad.b} Z`;
  const last = points[points.length - 1];
  const showLabels = points.length <= 8 ? points : points.filter((_,i)=> i % Math.ceil(points.length/6) === 0 || i === points.length-1);
  return (
    <svg width={W} height={H} style={{ display:'block', width:'100%' }} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id="lc-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0,0.5,1].map((t,i)=>(
        <line key={i} x1={pad.l} x2={W-pad.r} y1={pad.t + t*(H-pad.t-pad.b)} y2={pad.t + t*(H-pad.t-pad.b)}
          stroke="var(--line)" strokeWidth="1" />
      ))}
      <path d={area} fill="url(#lc-grad)" />
      <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p,i)=>(
        <circle key={i} cx={px(i)} cy={py(p.y)} r={i===points.length-1?4:2.5}
          fill={i===points.length-1?'var(--accent)':'var(--surface)'} stroke="var(--accent)" strokeWidth="2" />
      ))}
      {showLabels.map((p,i)=>{
        const idx = points.indexOf(p);
        return <text key={i} x={px(idx)} y={H-7} fill="var(--text-faint)" fontSize="9"
          fontFamily="var(--font-mono)" textAnchor="middle">{p.x}</text>;
      })}
    </svg>
  );
}

/* ---- Bar chart ---- */
function BarChart({ points, height = 140, fmt = (v)=>v }) {
  const W = 327, H = height, pad = { t: 12, b: 22 };
  if (!points || !points.length) return <div className="faint" style={{padding:20}}>No data yet</div>;
  const max = Math.max(...points.map(p=>p.y), 1);
  const bw = (W) / points.length;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display:'block', width:'100%' }}>
      {points.map((p,i)=>{
        const h = (p.y / max) * (H - pad.t - pad.b);
        const x = i * bw + bw*0.16;
        const w = bw * 0.68;
        return <g key={i}>
          <rect x={x} y={H-pad.b-h} width={w} height={Math.max(2,h)} rx="3"
            fill={i===points.length-1 ? 'var(--accent)' : 'var(--surface-3)'} />
          <text x={x+w/2} y={H-7} fill="var(--text-faint)" fontSize="9" fontFamily="var(--font-mono)" textAnchor="middle">{p.x}</text>
        </g>;
      })}
    </svg>
  );
}

/* ---- Stepper number input (type-in + nudge buttons) ---- */
function Stepper({ value, onChange, step = 5, min = 0, suffix }) {
  const [txt, setTxt] = useState(String(value));
  useEffect(() => { setTxt(String(value)); }, [value]);
  function commit(raw) {
    let n = parseFloat(raw);
    if (isNaN(n)) n = min;
    n = Math.max(min, +n.toFixed(2));
    onChange(n); setTxt(String(n));
  }
  return (
    <div className="row" style={{ background:'var(--surface-2)', border:'1px solid var(--line-2)', borderRadius:12, overflow:'hidden' }}>
      <button className="icon-btn" style={{ borderRadius:0, border:'none', background:'transparent', width:42, height:48 }}
        onClick={()=>commit(parseFloat(txt||0) - step)}><Icon name="minus" size={16}/></button>
      <div className="row center" style={{ minWidth:62, gap:2 }}>
        <input value={txt} inputMode="decimal" enterKeyHint="done"
          onChange={e=>setTxt(e.target.value)}
          onFocus={e=>e.target.select()}
          onBlur={e=>commit(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter') e.target.blur(); }}
          style={{ width: suffix?42:56, textAlign: suffix?'right':'center', background:'transparent', border:'none', outline:'none',
            color:'var(--text)', fontFamily:'var(--font-mono)', fontSize:17, fontWeight:600, fontVariantNumeric:'tabular-nums', padding:0 }} />
        {suffix ? <span className="faint" style={{ fontSize:12 }}>{suffix}</span> : null}
      </div>
      <button className="icon-btn" style={{ borderRadius:0, border:'none', background:'transparent', width:42, height:48 }}
        onClick={()=>commit(parseFloat(txt||0) + step)}><Icon name="plus" size={16}/></button>
    </div>
  );
}

/* ---- Group color dot ---- */
const GROUP_HUES = { Chest:8, Back:200, Legs:140, Shoulders:48, Arms:280, Core:330 };
function groupColor(g){ const h = GROUP_HUES[g] ?? 0; return `oklch(0.72 0.16 ${h})`; }

function GroupDot({ group, size=8 }) {
  return <span style={{ width:size, height:size, borderRadius:99, background:groupColor(group), flexShrink:0, display:'inline-block' }} />;
}

function fmtTime(s) {
  const m = Math.floor(s/60), ss = s%60;
  return m + ':' + String(ss).padStart(2,'0');
}

Object.assign(window, { Icon, StatusBar, Sheet, Ring, LineChart, BarChart, Stepper, GroupDot, groupColor, fmtTime,
  useState, useEffect, useRef, useMemo });
