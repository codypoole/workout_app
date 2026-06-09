/* ============ PROGRESS — 1RM, volume, PRs ============ */
import { useState } from 'react';
import type { AppState, Exercise } from '@/types';
import { exerciseStats } from '@/lib/selectors';
import { best1RMOfSession, bestSetOfSession, sessionVolume } from '@/lib/calc';
import { mmdd, weekKey } from '@/lib/format';
import { Icon } from '@/components/Icon';
import { Sheet } from '@/components/Sheet';
import { GroupDot } from '@/components/GroupDot';
import { LineChart, BarChart, type ChartPoint } from '@/components/Charts';

export interface ProgressScreenProps {
  state: AppState;
  onOpenExercise: (id: string) => void;
  onOpenSettings: () => void;
  unit: string;
}

export function ProgressScreen({ state, onOpenExercise, onOpenSettings, unit }: ProgressScreenProps) {
  const tracked = Object.keys(state.history)
    .map((id) => ({
      id,
      meta: state.library.find((e) => e.id === id) || ({ name: id, group: '' } as Exercise),
      stats: exerciseStats(state.history, id),
    }))
    .filter((x) => x.stats.sessions.length)
    .sort((a, b) => b.stats.best1RM - a.stats.best1RM);

  const weekVol: Record<string, number> = {};
  Object.values(state.history).forEach((sessions) =>
    sessions.forEach((s) => {
      const wk = weekKey(s.date);
      weekVol[wk] = (weekVol[wk] || 0) + sessionVolume(s.sets);
    }),
  );
  const volPoints: ChartPoint[] = Object.keys(weekVol)
    .sort()
    .slice(-8)
    .map((k) => ({ x: k.slice(5), y: Math.round(weekVol[k] / 1000) }));

  const prs = tracked.map((t) => ({
    name: t.meta.name,
    group: t.meta.group,
    id: t.id,
    e1rm: t.stats.best1RM,
    heaviest: t.stats.heaviest,
  }));

  return (
    <div className="screen screen-enter">
      <div style={{ padding: '8px 16px 6px' }}>
        <div className="row between">
          <div>
            <div className="eyebrow">Analytics</div>
            <div className="h1">Progress</div>
          </div>
          <button className="icon-btn" style={{ width: 44, height: 44 }} onClick={onOpenSettings} aria-label="Settings">
            <Icon name="settings" size={20} />
          </button>
        </div>
      </div>

      <div className="scroll">
        <div className="col gap16" style={{ padding: '10px 16px 24px' }}>
          <div className="card" style={{ padding: 16 }}>
            <div className="row between" style={{ marginBottom: 6 }}>
              <div>
                <div className="eyebrow">Weekly volume</div>
                <div className="label">Total tonnage, ×1000 {unit}</div>
              </div>
              <span className="accent">
                <Icon name="dumbbell" size={20} />
              </span>
            </div>
            <BarChart points={volPoints} />
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div className="row between" style={{ marginBottom: 12 }}>
              <div className="eyebrow">Personal records</div>
              <span className="accent">
                <Icon name="trophy" size={18} />
              </span>
            </div>
            <div className="col gap10">
              {prs.map((pr) => (
                <button
                  key={pr.id}
                  className="row between"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%' }}
                  onClick={() => onOpenExercise(pr.id)}
                >
                  <div className="row gap10" style={{ minWidth: 0, flex: 1 }}>
                    <GroupDot group={pr.group} size={8} />
                    <span className="title clamp1" style={{ fontSize: 14, color: 'var(--text)', flex: 1 }}>{pr.name}</span>
                  </div>
                  <div className="row gap10" style={{ flexShrink: 0 }}>
                    <span className="mono dim" style={{ fontSize: 12 }}>{pr.heaviest.weight}{unit}×{pr.heaviest.reps}</span>
                    <span className="chip accent">~{pr.e1rm} 1RM</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="eyebrow" style={{ paddingLeft: 2 }}>Strength trends</div>
          {tracked.map((t) => (
            <button key={t.id} className="card" style={{ padding: 16, textAlign: 'left', cursor: 'pointer' }} onClick={() => onOpenExercise(t.id)}>
              <div className="row between" style={{ marginBottom: 8 }}>
                <div className="row gap10" style={{ minWidth: 0, flex: 1 }}>
                  <GroupDot group={t.meta.group} size={8} />
                  <span className="title clamp1" style={{ flex: 1 }}>{t.meta.name}</span>
                </div>
                <span
                  className="chip"
                  style={{ flexShrink: 0, ...(t.stats.delta >= 0 ? { background: 'var(--accent-soft)', color: 'var(--accent)', borderColor: 'transparent' } : { color: 'var(--danger)' }) }}
                >
                  {t.stats.delta >= 0 ? '+' : ''}{t.stats.delta} {unit}
                </span>
              </div>
              <LineChart points={t.stats.series1RM.map((p) => ({ x: mmdd(p.date), y: p.value }))} height={120} />
              <div className="row gap16" style={{ marginTop: 8 }}>
                <MiniStat n={t.stats.cur1RM + unit} l="est 1RM" />
                <MiniStat n={t.stats.heaviest.weight + unit} l="heaviest" />
                <MiniStat n={t.stats.sessions.length} l="sessions" />
              </div>
            </button>
          ))}

          {tracked.length === 0 && (
            <div className="card-2" style={{ padding: 20, textAlign: 'center' }}>
              <div className="faint">No history yet. Finish a workout to start tracking your strength trends.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ n, l }: { n: string | number; l: string }) {
  return (
    <div className="col">
      <div className="mono" style={{ fontSize: 16, fontWeight: 650 }}>{n}</div>
      <div className="label" style={{ fontSize: 11 }}>{l}</div>
    </div>
  );
}

/* ---- Exercise detail (history + chart toggle) ---- */
export interface ExerciseDetailProps {
  state: AppState;
  exId: string;
  onClose: () => void;
  onEdit: (id: string) => void;
  unit: string;
}

export function ExerciseDetail({ state, exId, onClose, onEdit, unit }: ExerciseDetailProps) {
  const meta = state.library.find((e) => e.id === exId) || ({ id: exId, name: exId, group: '', equipment: '', type: 'weight', muscles: [], notes: '', custom: false } as Exercise);
  const stats = exerciseStats(state.history, exId);
  const [metric, setMetric] = useState<'1rm' | 'vol'>('1rm');
  const points: ChartPoint[] = (metric === '1rm' ? stats.series1RM : stats.seriesVol).map((p) => ({ x: mmdd(p.date), y: p.value }));

  return (
    <Sheet open onClose={onClose} full>
      <div className="row between" style={{ margin: '2px 0 14px' }}>
        <div className="row gap8">
          <GroupDot group={meta.group} size={10} />
          <span className="eyebrow">{meta.group} · {meta.equipment}</span>
        </div>
        <div className="row gap8">
          <button className="icon-btn" style={{ width: 36, height: 36 }} onClick={() => onEdit(exId)} aria-label="Edit exercise">
            <Icon name="edit" size={16} />
          </button>
          <button className="icon-btn" style={{ width: 36, height: 36 }} onClick={onClose} aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>
      </div>
      <div className="h1" style={{ marginBottom: 14 }}>{meta.name}</div>

      {stats.sessions.length === 0 ? (
        <div className="card-2" style={{ padding: 20, textAlign: 'center' }}>
          <div className="faint">No history logged yet. Complete a workout with this exercise to see your trend.</div>
        </div>
      ) : (
        <>
          <div className="row gap10" style={{ marginBottom: 14 }}>
            <div className="card-2 grow" style={{ padding: '12px 14px' }}>
              <div className="numbig accent" style={{ fontSize: 26 }}>
                {stats.cur1RM}
                <span style={{ fontSize: 13 }} className="dim"> {unit}</span>
              </div>
              <div className="label">Est. 1RM {stats.delta >= 0 && <span className="accent">↑ {stats.delta}</span>}</div>
            </div>
            <div className="card-2 grow" style={{ padding: '12px 14px' }}>
              <div className="numbig" style={{ fontSize: 26 }}>
                {stats.heaviest.weight}
                <span style={{ fontSize: 13 }} className="dim"> {unit}</span>
              </div>
              <div className="label">Heaviest × {stats.heaviest.reps}</div>
            </div>
          </div>

          <div className="pill-toggle" style={{ marginBottom: 14 }}>
            <button className={metric === '1rm' ? 'on' : ''} onClick={() => setMetric('1rm')}>Est 1RM</button>
            <button className={metric === 'vol' ? 'on' : ''} onClick={() => setMetric('vol')}>Volume</button>
          </div>
          <div className="card-2" style={{ padding: '14px 8px', marginBottom: 16 }}>
            <LineChart points={points} height={160} />
          </div>

          <div className="eyebrow" style={{ marginBottom: 8 }}>Session history</div>
          <div className="col gap8">
            {stats.sessions
              .slice()
              .reverse()
              .map((s, i) => {
                const best = bestSetOfSession(s.sets);
                return (
                  <div key={i} className="card-2" style={{ padding: 12 }}>
                    <div className="row between" style={{ marginBottom: 6 }}>
                      <span className="mono dim" style={{ fontSize: 12 }}>{s.date}</span>
                      <span className="chip accent">~{best1RMOfSession(s.sets)} 1RM</span>
                    </div>
                    <div className="row gap6 wrap">
                      {s.sets.map((set, si) => (
                        <span
                          key={si}
                          className="chip"
                          style={set === best ? { background: 'var(--accent-soft)', color: 'var(--accent)', borderColor: 'transparent' } : undefined}
                        >
                          {set.weight}×{set.reps}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      )}

      {meta.notes && (
        <div className="card-2" style={{ padding: 14, marginTop: 16 }}>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Notes</div>
          <div className="dim" style={{ fontSize: 14, lineHeight: 1.5 }}>{meta.notes}</div>
        </div>
      )}
    </Sheet>
  );
}
