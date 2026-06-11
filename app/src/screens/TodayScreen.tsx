/* ============ TODAY — workout runner ============ */
import { useEffect, useState } from 'react';
import type { AppState, Exercise, LoggedSet, PlanDay, PlannedSet } from '@/types';
import { isTimedSet } from '@/types';
import { dayProgress, exDone, getLog } from '@/lib/selectors';
import { sessionVolume } from '@/lib/calc';
import { fmtTime } from '@/lib/format';
import { Icon } from '@/components/Icon';
import { Ring } from '@/components/Ring';
import { GroupDot } from '@/components/GroupDot';
import { ConfirmModal } from '@/components/ConfirmModal';

type ExMap = Record<string, Exercise>;
type LogFn = (dayId: string, ei: number, si: number, payload: LoggedSet | null, restSec?: number) => void;

export interface RestState {
  secs: number;
  key: number;
}

/* ---- Full-screen rest timer with animated countdown ring ---- */
function RestTimer({ secs, onClose }: { secs: number; onClose: () => void }) {
  const [left, setLeft] = useState(secs);
  const [total, setTotal] = useState(secs);
  const [paused, setPaused] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editMin, setEditMin] = useState('0');
  const [editSec, setEditSec] = useState('00');

  useEffect(() => {
    setLeft(secs);
    setTotal(secs);
    setPaused(false);
    setEditing(false);
  }, [secs]);

  useEffect(() => {
    if (paused || editing) return;
    if (left <= 0) {
      onClose();
      return;
    }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, paused, editing]);

  function adjust(delta: number) {
    const nl = Math.max(0, left + delta);
    setLeft(nl);
    if (nl > total) setTotal(nl);
  }

  function openEdit() {
    setEditMin(String(Math.floor(left / 60)));
    setEditSec(String(left % 60).padStart(2, '0'));
    setPaused(true);
    setEditing(true);
  }
  function saveEdit() {
    const m = Math.max(0, parseInt(editMin || '0', 10) || 0);
    const s = Math.max(0, Math.min(59, parseInt(editSec || '0', 10) || 0));
    const next = Math.max(1, m * 60 + s);
    setLeft(next);
    setTotal(next);
    setEditing(false);
    setPaused(false);
  }

  // SVG ring geometry
  const size = 260;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const ratio = total ? Math.max(0, Math.min(1, left / total)) : 0;
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
                  <Icon name="edit" size={12} /> tap to edit
                </span>
              </button>
            )}
          </div>
        </div>

        {editing ? (
          <div className="row gap8" style={{ width: '100%', maxWidth: 320 }}>
            <button className="btn ghost grow" style={{ height: 48 }} onClick={() => { setEditing(false); setPaused(false); }}>
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
              onClick={() => setPaused((p) => !p)}
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

/* ---- Compact tap-to-edit number field (inline set editing) ---- */
function NumField({ value, onChange, suffix, label }: { value: number; onChange: (n: number) => void; suffix?: string; label: string }) {
  const [txt, setTxt] = useState(String(value));
  useEffect(() => setTxt(String(value)), [value]);
  function commit(raw: string) {
    let n = parseFloat(raw);
    if (isNaN(n) || n < 0) n = 0;
    n = +n.toFixed(2);
    onChange(n);
    setTxt(String(n));
  }
  return (
    <div
      className="row"
      style={{ background: 'var(--surface-3)', border: '1px solid var(--line-2)', borderRadius: 10, padding: '6px 10px', gap: 3, alignItems: 'baseline' }}
    >
      <input
        value={txt}
        inputMode="decimal"
        enterKeyHint="done"
        aria-label={label}
        onChange={(e) => setTxt(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        style={{
          width: suffix ? 44 : 40,
          textAlign: 'center',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--text)',
          fontFamily: 'var(--font-mono)',
          fontSize: 18,
          fontWeight: 650,
          fontVariantNumeric: 'tabular-nums',
          padding: 0,
        }}
      />
      {suffix ? <span className="faint" style={{ fontSize: 11 }}>{suffix}</span> : null}
    </div>
  );
}

/* ---- A single set row: inline editable until marked complete ---- */
function SetRow({
  idx,
  set,
  ex,
  log,
  onLog,
  onRemove,
  canRemove,
  unit,
}: {
  idx: number;
  set: PlannedSet;
  ex: Exercise;
  log: LoggedSet | null;
  onLog: (payload: LoggedSet | null) => void;
  onRemove: () => void;
  canRemove: boolean;
  unit: string;
}) {
  const timed = ex.type === 'timed';
  const done = !!log && (log as { done?: boolean }).done === true;
  const planW = isTimedSet(set) ? 0 : set.weight;
  const planR = isTimedSet(set) ? 0 : set.reps;
  const logged = log && !isTimedSet(set) ? (log as { weight: number; reps: number }) : null;
  const [weight, setWeight] = useState(logged ? logged.weight : planW || 0);
  const [reps, setReps] = useState(logged ? logged.reps : planR || 0);
  const [holding, setHolding] = useState(false);
  const [held, setHeld] = useState(0);
  const durationSec = isTimedSet(set) ? set.durationSec : 0;

  useEffect(() => {
    if (!holding) return;
    if (held >= durationSec) {
      onLog({ durationSec, done: true });
      setHolding(false);
      return;
    }
    const t = setTimeout(() => setHeld((h) => h + 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holding, held]);

  const removeBtn = canRemove ? (
    <button
      className="icon-btn"
      style={{ width: 36, height: 36, color: 'var(--text-faint)', flexShrink: 0 }}
      onClick={onRemove}
      aria-label={`Remove set ${idx + 1}`}
    >
      <Icon name="trash" size={15} />
    </button>
  ) : null;

  if (timed) {
    return (
      <div className="card-2" style={{ padding: 14, borderColor: done ? 'var(--accent)' : 'var(--line)' }}>
        <div className="row between gap8">
          <div className="row gap10">
            <div className="mono faint" style={{ width: 18 }}>{idx + 1}</div>
            <div>
              <div className="title">{holding ? fmtTime(durationSec - held) : fmtTime(durationSec)}</div>
              <div className="label">Hold · {isTimedSet(set) ? set.restSec : 0}s rest</div>
            </div>
          </div>
          <div className="row gap6" style={{ flexShrink: 0 }}>
            {!holding && removeBtn}
            {done ? (
              <button
                className="icon-btn"
                style={{ background: 'var(--accent)', color: 'var(--accent-ink)', border: 'none' }}
                onClick={() => onLog(null)}
                aria-label="Un-log set"
              >
                <Icon name="check" size={18} />
              </button>
            ) : holding ? (
              <button className="btn ghost" style={{ height: 38 }} onClick={() => { setHolding(false); setHeld(0); }}>
                Stop
              </button>
            ) : (
              <button className="btn primary" style={{ height: 38 }} onClick={() => { setHeld(0); setHolding(true); }}>
                Start
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Done → locked read-only row; uncheck to edit again.
  if (done) {
    return (
      <div
        className="card-2"
        style={{
          padding: '10px 12px',
          borderColor: 'color-mix(in oklch,var(--accent) 50%,var(--line))',
          background: 'color-mix(in oklch,var(--accent) 7%,var(--surface-2))',
        }}
      >
        <div className="row between gap10">
          <div className="row gap8" style={{ flex: 1, minWidth: 0, alignItems: 'baseline' }}>
            <span className="mono faint" style={{ width: 16, fontSize: 13, flexShrink: 0 }}>{idx + 1}</span>
            <span className="mono" style={{ fontSize: 18, fontWeight: 650 }}>
              {weight}
              <span className="faint" style={{ fontSize: 12 }}> {unit}</span>
            </span>
            <span className="faint">×</span>
            <span className="mono" style={{ fontSize: 18, fontWeight: 650 }}>{reps}</span>
          </div>
          <div className="row gap6" style={{ flexShrink: 0 }}>
            {removeBtn}
            <button
              className="icon-btn"
              style={{ background: 'var(--accent)', color: 'var(--accent-ink)', border: 'none' }}
              onClick={() => onLog(null)}
              aria-label="Un-log set to edit"
            >
              <Icon name="check" size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not done → inline editable weight & reps.
  return (
    <div className="card-2" style={{ padding: '8px 10px 8px 12px', borderColor: 'var(--line)' }}>
      <div className="row between gap8">
        <div className="row gap8" style={{ flex: 1, minWidth: 0, alignItems: 'center' }}>
          <span className="mono faint" style={{ width: 14, fontSize: 13, flexShrink: 0 }}>{idx + 1}</span>
          <NumField value={weight} onChange={setWeight} suffix={unit} label={`Set ${idx + 1} weight`} />
          <span className="faint">×</span>
          <NumField value={reps} onChange={setReps} label={`Set ${idx + 1} reps`} />
        </div>
        <div className="row gap6" style={{ flexShrink: 0 }}>
          {removeBtn}
          <button
            className="icon-btn"
            style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
            onClick={() => onLog({ weight, reps, done: true })}
            aria-label="Mark set complete"
          >
            <Icon name="check" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---- Focus view: one exercise ---- */
function FocusExercise({
  state, day, ei, exMap, onLog, onSwap, onOpen, onPrev, onNext, onAddSet, onRemoveSet, unit,
}: {
  state: AppState; day: PlanDay; ei: number; exMap: ExMap;
  onLog: LogFn; onSwap: () => void; onOpen: (id: string) => void;
  onPrev: () => void; onNext: () => void;
  onAddSet: () => void; onRemoveSet: (si: number) => void; unit: string;
}) {
  const item = day.exercises[ei];
  const meta = exMap[item.exerciseId] || { name: item.exerciseId, group: '', equipment: '', type: 'weight' } as Exercise;
  const total = day.exercises.length;
  const done = exDone(state, day.id, ei, item);
  return (
    <div className="col grow" style={{ padding: '0 16px 16px' }}>
      <div className="row" style={{ marginBottom: 14, gap: 8 }}>
        <button className="icon-btn" style={{ flexShrink: 0 }} disabled={ei === 0} onClick={onPrev} aria-label="Previous exercise">
          <Icon name="back" size={18} />
        </button>
        <div className="row" style={{ flex: 1, gap: 4, justifyContent: 'center' }}>
          {day.exercises.map((_, i) => (
            <span
              key={i}
              style={{
                flex: i === ei ? 3 : 1,
                height: 6,
                borderRadius: 99,
                background:
                  i === ei
                    ? 'var(--accent)'
                    : exDone(state, day.id, i, day.exercises[i])
                    ? 'color-mix(in oklch,var(--accent) 45%,transparent)'
                    : 'var(--surface-3)',
                transition: 'all .2s',
                minWidth: 0,
              }}
            />
          ))}
        </div>
        <button className="icon-btn" style={{ flexShrink: 0 }} disabled={ei === total - 1} onClick={onNext} aria-label="Next exercise">
          <Icon name="chevron" size={18} />
        </button>
      </div>

      <div className="row between" style={{ marginBottom: 4 }}>
        <span className="eyebrow">Exercise {ei + 1} / {total}</span>
        {done && (
          <span className="chip accent">
            <Icon name="check" size={12} /> Complete
          </span>
        )}
      </div>
      <div className="row gap8" style={{ marginBottom: 9 }}>
        <GroupDot group={meta.group} size={9} />
        <span className="label">{meta.group} · {meta.equipment}</span>
      </div>
      <div className="h1" style={{ marginBottom: 14, lineHeight: 1.05 }}>{meta.name}</div>

      <div className="row gap8" style={{ marginBottom: 16 }}>
        <button className="btn ghost grow" style={{ height: 42, fontSize: 13 }} onClick={onSwap}>
          <Icon name="swap" size={16} /> Swap
        </button>
        <button className="btn ghost grow" style={{ height: 42, fontSize: 13 }} onClick={() => onOpen(item.exerciseId)}>
          <Icon name="progress" size={16} /> History
        </button>
      </div>

      <div className="col gap8">
        {item.sets.map((set, si) => (
          <SetRow
            key={si}
            idx={si}
            set={set}
            ex={meta}
            unit={unit}
            log={getLog(state, day.id, ei, si)}
            onLog={(payload) => onLog(day.id, ei, si, payload, set.restSec)}
            onRemove={() => onRemoveSet(si)}
            canRemove={item.sets.length > 1}
          />
        ))}
        <button className="btn ghost block" style={{ height: 44, borderStyle: 'dashed', marginTop: 2 }} onClick={onAddSet}>
          <Icon name="plus" size={16} /> Add set
        </button>
      </div>

      {done && ei < total - 1 && (
        <button className="btn primary block lg" style={{ marginTop: 18 }} onClick={onNext}>
          Next exercise <Icon name="chevron" size={18} />
        </button>
      )}
    </div>
  );
}

/* ---- Day zoom-out view ---- */
function DayOverview({
  state, day, exMap, onPick, onSwap, onDelete, onAdd,
}: {
  state: AppState; day: PlanDay; exMap: ExMap;
  onPick: (ei: number) => void; onSwap: (ei: number) => void;
  onDelete: (ei: number) => void; onAdd: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const pendingEx = confirmDelete !== null ? exMap[day.exercises[confirmDelete]?.exerciseId] : null;

  return (
    <div className="col gap10" style={{ padding: '0 16px 20px' }}>
      <ConfirmModal
        open={confirmDelete !== null}
        title="Remove exercise?"
        message={pendingEx ? `"${pendingEx.name}" will be removed from this day along with any logged sets.` : 'This exercise will be removed.'}
        confirmLabel="Remove"
        onConfirm={() => { if (confirmDelete !== null) { onDelete(confirmDelete); setConfirmDelete(null); } }}
        onCancel={() => setConfirmDelete(null)}
      />
      {day.exercises.map((item, ei) => {
        const meta = exMap[item.exerciseId] || ({} as Exercise);
        const done = exDone(state, day.id, ei, item);
        const setsDone = item.sets.filter((_, si) => {
          const l = getLog(state, day.id, ei, si);
          return l && (l as { done?: boolean }).done;
        }).length;
        return (
          <div
            key={ei}
            className="card"
            style={{ padding: 14, borderColor: done ? 'color-mix(in oklch,var(--accent) 40%,var(--line))' : 'var(--line)' }}
          >
            <div className="row between gap10">
              <button
                onClick={() => onPick(ei)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, color: 'inherit', minWidth: 0, flex: 1 }}
              >
                <div className="row gap10" style={{ minWidth: 0 }}>
                  <div
                    style={{
                      width: 34, height: 34, borderRadius: 10, background: 'var(--surface-2)', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: done ? '1px solid var(--accent)' : '1px solid var(--line)',
                      color: done ? 'var(--accent)' : 'var(--text-dim)',
                    }}
                  >
                    {done ? <Icon name="check" size={18} /> : <span className="mono" style={{ fontSize: 14 }}>{ei + 1}</span>}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="row gap6">
                      <GroupDot group={meta.group} size={7} />
                      <span className="title clamp1" style={{ fontSize: 15, flex: 1 }}>{meta.name}</span>
                    </div>
                    <div className="label">{setsDone}/{item.sets.length} sets · {meta.equipment}</div>
                  </div>
                </div>
              </button>
              <div className="row gap6" style={{ flexShrink: 0 }}>
                <button className="icon-btn" style={{ width: 34, height: 34 }} title="Swap" onClick={() => onSwap(ei)} aria-label="Swap exercise">
                  <Icon name="swap" size={15} />
                </button>
                <button className="icon-btn" style={{ width: 34, height: 34, color: 'var(--danger)' }} title="Remove" onClick={() => setConfirmDelete(ei)} aria-label="Remove exercise">
                  <Icon name="trash" size={15} />
                </button>
              </div>
            </div>
            <button onClick={() => onPick(ei)} style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0, width: '100%' }}>
              <div className="row gap6 wrap" style={{ marginTop: 10, paddingLeft: 44 }}>
                {item.sets.map((s, si) => {
                  const l = getLog(state, day.id, ei, si);
                  const dn = !!l && (l as { done?: boolean }).done === true;
                  const lw = l as { weight?: number; reps?: number } | null;
                  return (
                    <span
                      key={si}
                      className="chip"
                      style={dn ? { background: 'var(--accent-soft)', color: 'var(--accent)', borderColor: 'transparent' } : undefined}
                    >
                      {meta.type === 'timed'
                        ? fmtTime(isTimedSet(s) ? s.durationSec : 0)
                        : `${dn && lw ? lw.weight : isTimedSet(s) ? 0 : s.weight}×${dn && lw ? lw.reps : isTimedSet(s) ? 0 : s.reps}`}
                    </span>
                  );
                })}
              </div>
            </button>
          </div>
        );
      })}
      <button className="btn ghost block" style={{ height: 50, borderStyle: 'dashed', marginTop: 2 }} onClick={onAdd}>
        <Icon name="plus" size={18} /> Add exercise
      </button>
    </div>
  );
}

export interface TodayScreenProps {
  state: AppState;
  weekName: string;
  day: PlanDay | null | undefined;
  exMap: ExMap;
  unit: string;
  onLog: (dayId: string, ei: number, si: number, payload: LoggedSet | null) => void;
  onCompleteDay: (dayId: string) => void;
  onUncompleteDay: (dayId: string) => void;
  onAdvance: () => void;
  onSwap: (ei: number) => void;
  onAddExercise: () => void;
  onDeleteExercise: (ei: number) => void;
  onAddSet: (ei: number) => void;
  onRemoveSet: (ei: number, si: number) => void;
  onOpenExercise: (id: string) => void;
  restState: RestState | null;
  setRestState: (r: RestState | null) => void;
  focusIdx: number;
  setFocusIdx: (updater: number | ((i: number) => number)) => void;
}

export function TodayScreen(props: TodayScreenProps) {
  const {
    state, weekName, day, exMap, unit, onLog, onCompleteDay, onUncompleteDay, onAdvance,
    onSwap, onAddExercise, onDeleteExercise, onAddSet, onRemoveSet, onOpenExercise, restState, setRestState, focusIdx, setFocusIdx,
  } = props;
  const [mode, setMode] = useState<'focus' | 'day'>('focus');

  if (!day)
    return (
      <div className="screen screen-enter">
        <div className="center grow faint" style={{ padding: 40, textAlign: 'center' }}>
          No active day. Build a plan to get started.
        </div>
      </div>
    );

  const prog = dayProgress(state, day.id, day);
  const allDone = prog.total > 0 && prog.done === prog.total;
  const completed = !!state.completedDays[day.id];

  function handleLog(dayId: string, ei: number, si: number, payload: LoggedSet | null, restSec?: number) {
    onLog(dayId, ei, si, payload);
    if (payload && (payload as { done?: boolean }).done && restSec) setRestState({ secs: restSec, key: Date.now() });
  }

  const safeIdx = Math.min(focusIdx, day.exercises.length - 1);

  return (
    <div className="screen screen-enter">
      <div style={{ padding: '8px 16px 12px' }}>
        <div className="row between" style={{ marginBottom: 12 }}>
          <div>
            <div className="eyebrow">{weekName} · {day.rest ? 'Recovery' : 'Today'}</div>
            <div className="h1">{day.name}</div>
            <div className="label" style={{ marginTop: 2 }}>{day.focus}</div>
          </div>
          <Ring value={prog.ratio} size={58} stroke={6}>
            <div className="col center">
              <div className="mono" style={{ fontSize: 14, fontWeight: 700, lineHeight: 1 }}>{prog.done}</div>
              <div className="mono faint" style={{ fontSize: 9 }}>/{prog.total}</div>
            </div>
          </Ring>
        </div>
        {!day.rest && (
          <div className="pill-toggle">
            <button className={mode === 'focus' ? 'on' : ''} onClick={() => setMode('focus')}>Focus</button>
            <button className={mode === 'day' ? 'on' : ''} onClick={() => setMode('day')}>Full day</button>
          </div>
        )}
      </div>

      <div className="scroll">
        {day.rest ? (
          <div className="col center grow" style={{ padding: '40px 24px', textAlign: 'center', gap: 14 }}>
            <div
              style={{ width: 72, height: 72, borderRadius: 99, background: 'var(--surface)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              className="accent"
            >
              <Icon name="flame" size={30} />
            </div>
            <div className="h2">Recovery day</div>
            <div className="dim" style={{ maxWidth: 240 }}>
              Light mobility or full rest. Your next session is loaded and ready.
            </div>
          </div>
        ) : day.exercises.length === 0 ? (
          <div className="col center grow" style={{ padding: '40px 24px', textAlign: 'center', gap: 14 }}>
            <div className="faint">No exercises in this day yet.</div>
            <button className="btn primary" onClick={onAddExercise}>
              <Icon name="plus" size={18} /> Add exercise
            </button>
          </div>
        ) : mode === 'focus' ? (
          <FocusExercise
            state={state}
            day={day}
            ei={safeIdx}
            exMap={exMap}
            unit={unit}
            onLog={handleLog}
            onSwap={() => onSwap(safeIdx)}
            onOpen={onOpenExercise}
            onPrev={() => setFocusIdx((i) => Math.max(0, i - 1))}
            onNext={() => setFocusIdx((i) => Math.min(day.exercises.length - 1, i + 1))}
            onAddSet={() => onAddSet(safeIdx)}
            onRemoveSet={(si) => onRemoveSet(safeIdx, si)}
          />
        ) : (
          <DayOverview
            state={state}
            day={day}
            exMap={exMap}
            onPick={(ei) => { setFocusIdx(ei); setMode('focus'); }}
            onSwap={onSwap}
            onDelete={onDeleteExercise}
            onAdd={onAddExercise}
          />
        )}

        {mode === 'day' && !day.rest && !completed && (
          <div style={{ padding: '4px 16px 24px' }}>
            <button className={'btn block lg ' + (allDone ? 'primary' : 'ghost')} onClick={() => onCompleteDay(day.id)}>
              <Icon name="check" size={20} /> {allDone ? 'Finish workout' : `Finish workout · ${prog.done}/${prog.total} sets`}
            </button>
            {!allDone && (
              <div className="label center" style={{ textAlign: 'center', marginTop: 8 }}>
                You can finish early — only logged sets are saved.
              </div>
            )}
          </div>
        )}
        {mode === 'day' && completed && (
          <div style={{ padding: '4px 16px 24px' }}>
            <div className="card" style={{ padding: 18, textAlign: 'center' }}>
              <div className="accent" style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                <Icon name="trophy" size={28} />
              </div>
              <div className="h2" style={{ marginBottom: 2 }}>Workout complete</div>
              <div className="label" style={{ marginBottom: 14 }}>
                {prog.done}/{prog.total} sets ·{' '}
                {sessionVolume(
                  day.exercises.flatMap((e, ei) =>
                    e.sets.map((_, si) => {
                      const l = getLog(state, day.id, ei, si);
                      return l && (l as { done?: boolean }).done ? (l as { weight: number; reps: number }) : { weight: 0, reps: 0 };
                    }),
                  ),
                ).toLocaleString()}{' '}
                {unit} volume
              </div>
              <div className="row gap8">
                <button className="btn ghost grow" onClick={() => onUncompleteDay(day.id)}>
                  <Icon name="back" size={16} /> Reopen
                </button>
                <button className="btn primary grow" onClick={onAdvance}>
                  Next workout <Icon name="chevron" size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {restState && (
        <RestTimer key={restState.key} secs={restState.secs} onClose={() => setRestState(null)} />
      )}
    </div>
  );
}
