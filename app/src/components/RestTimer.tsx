/* ============ Full-screen rest timer with animated countdown ring ============
   Source of truth is a timestamp-based RestTimer object owned by App and
   persisted to localStorage, so the countdown stays correct across
   backgrounding, tab switches and reloads. This component ticks the display,
   recomputes on tab focus, and fires the completion notification. */
import { useEffect, useRef, useState } from 'react';
import { fmtTime } from '@/lib/format';
import { fireRestNotification, timerLeft, type RestTimer as RestTimerState } from '@/lib/restTimer';
import { Icon } from './Icon';

interface RestTimerProps {
  timer: RestTimerState;
  onChange: (t: RestTimerState) => void;
  onClose: () => void;
}

export function RestTimer({ timer, onChange, onClose }: RestTimerProps) {
  const [, setTick] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editMin, setEditMin] = useState('0');
  const [editSec, setEditSec] = useState('00');
  const firedRef = useRef<number | null>(null);

  // Re-render every 250ms (and whenever the tab regains focus) so the display
  // recomputes from the absolute end time rather than a drifting counter.
  useEffect(() => {
    const id = setInterval(() => setTick((x) => x + 1), 250);
    const onVis = () => setTick((x) => x + 1);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onVis);
    };
  }, []);

  const paused = timer.pausedRemaining != null;
  const left = timerLeft(timer);

  // Fire the notification once when a running timer reaches zero, then close.
  useEffect(() => {
    if (!paused && timer.endAt != null && left <= 0 && firedRef.current !== timer.id) {
      firedRef.current = timer.id;
      fireRestNotification();
      onClose();
    }
  }, [left, paused, timer.endAt, timer.id, onClose]);

  function patch(next: Partial<RestTimerState>) {
    onChange({ ...timer, ...next });
  }

  function adjust(delta: number) {
    if (paused) {
      const nr = Math.max(0, (timer.pausedRemaining ?? 0) + delta);
      patch({ pausedRemaining: nr, total: Math.max(timer.total, nr) });
    } else if (timer.endAt != null) {
      const nl = Math.max(0, left + delta);
      patch({ endAt: Date.now() + nl * 1000, total: Math.max(timer.total, nl) });
    }
  }

  function togglePause() {
    if (paused) patch({ endAt: Date.now() + (timer.pausedRemaining ?? 0) * 1000, pausedRemaining: null });
    else patch({ pausedRemaining: left, endAt: null });
  }

  function openEdit() {
    setEditMin(String(Math.floor(left / 60)));
    setEditSec(String(left % 60).padStart(2, '0'));
    if (!paused) patch({ pausedRemaining: left, endAt: null }); // pause while editing
    setEditing(true);
  }
  function saveEdit() {
    const m = Math.max(0, parseInt(editMin || '0', 10) || 0);
    const s = Math.max(0, Math.min(59, parseInt(editSec || '0', 10) || 0));
    const next = Math.max(1, m * 60 + s);
    firedRef.current = null;
    patch({ endAt: Date.now() + next * 1000, pausedRemaining: null, total: next });
    setEditing(false);
  }
  function cancelEdit() {
    setEditing(false);
    togglePause(); // resume (we paused on open)
  }

  // SVG ring geometry
  const size = 260;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const ratio = timer.total ? Math.max(0, Math.min(1, left / timer.total)) : 0;
  const off = circ * (1 - ratio);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 300,
        background: 'color-mix(in oklch, var(--bg) 96%, transparent)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        padding: 'calc(env(safe-area-inset-top) + 16px) 24px calc(env(safe-area-inset-bottom) + 28px)',
        animation: 'fade .2s ease',
      }}
    >
      <div className="row between">
        <div className="row gap8">
          <span className="accent">
            <Icon name="timer" size={18} />
          </span>
          <span className="eyebrow">Rest timer</span>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label="Close rest timer">
          <Icon name="x" size={18} />
        </button>
      </div>

      <div className="col center grow" style={{ justifyContent: 'center', gap: 28 }}>
        <div style={{ position: 'relative', width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} stroke="var(--surface-3)" />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              strokeWidth={stroke}
              stroke="var(--accent)"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={off}
              style={{ transition: paused || editing ? 'none' : 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="col center" style={{ position: 'absolute', inset: 0, justifyContent: 'center', gap: 6 }}>
            {editing ? (
              <div className="row center" style={{ gap: 4 }}>
                <input
                  value={editMin}
                  inputMode="numeric"
                  onChange={(e) => setEditMin(e.target.value.replace(/\D/g, ''))}
                  onFocus={(e) => e.target.select()}
                  aria-label="Minutes"
                  style={{ width: 56, textAlign: 'right', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 44, fontWeight: 800 }}
                />
                <span className="numbig" style={{ fontSize: 44 }}>:</span>
                <input
                  value={editSec}
                  inputMode="numeric"
                  onChange={(e) => setEditSec(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  onFocus={(e) => e.target.select()}
                  aria-label="Seconds"
                  style={{ width: 56, textAlign: 'left', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 44, fontWeight: 800 }}
                />
              </div>
            ) : (
              <button
                onClick={openEdit}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                aria-label="Edit time"
              >
                <span className="numbig accent" style={{ fontSize: 56 }}>{fmtTime(Math.max(0, left))}</span>
                <span className="faint row gap4" style={{ fontSize: 11 }}>
                  <Icon name="edit" size={12} /> {paused ? 'paused · tap to edit' : 'tap to edit'}
                </span>
              </button>
            )}
          </div>
        </div>

        {editing ? (
          <div className="row gap8" style={{ width: '100%', maxWidth: 320 }}>
            <button className="btn ghost grow" style={{ height: 48 }} onClick={cancelEdit}>
              Cancel
            </button>
            <button className="btn primary grow" style={{ height: 48 }} onClick={saveEdit}>
              <Icon name="check" size={18} /> Set time
            </button>
          </div>
        ) : (
          <div className="row gap10 center">
            <button className="btn ghost" style={{ height: 54, width: 64, fontSize: 13 }} onClick={() => adjust(-15)} aria-label="Minus 15 seconds">
              −15s
            </button>
            <button
              className="btn primary"
              style={{ height: 64, width: 64, borderRadius: 99, padding: 0 }}
              onClick={togglePause}
              aria-label={paused ? 'Resume' : 'Pause'}
            >
              <Icon name={paused ? 'play' : 'pause'} size={24} />
            </button>
            <button className="btn ghost" style={{ height: 54, width: 64, fontSize: 13 }} onClick={() => adjust(15)} aria-label="Plus 15 seconds">
              +15s
            </button>
          </div>
        )}
      </div>

      {!editing && (
        <button className="btn primary block lg" onClick={onClose}>
          <Icon name="check" size={20} /> Done resting
        </button>
      )}
    </div>
  );
}
