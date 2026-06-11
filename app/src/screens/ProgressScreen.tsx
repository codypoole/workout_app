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
  onToggleFavorite: (id: string) => void;
  unit: string;
}

export function ProgressScreen({ state, onOpenExercise, onOpenSettings, onToggleFavorite, unit }: ProgressScreenProps) {
  const [showFavPicker, setShowFavPicker] = useState(false);
  const favorites = state.favorites || [];
  const hasFavorites = favorites.length > 0;

  // Show every favorited exercise — those with logged history first
  // (ranked by est. 1RM), then freshly favorited ones awaiting data.
  const tracked = hasFavorites
    ? favorites
        .map((id) => ({
          id,
          meta: state.library.find((e) => e.id === id) || ({ name: id, group: '' } as Exercise),
          stats: exerciseStats(state.history, id),
        }))
        .sort((a, b) => {
          const ah = a.stats.sessions.length > 0 ? 0 : 1;
          const bh = b.stats.sessions.length > 0 ? 0 : 1;
          if (ah !== bh) return ah - bh;
          return b.stats.best1RM - a.stats.best1RM;
        })
    : [];
  const trackedWithHistory = tracked.filter((t) => t.stats.sessions.length > 0);

  const weekVol: Record<string, number> = {};
  // Only count volume for tracked exercises
  const trackedIds = new Set(tracked.map((t) => t.id));
  Object.entries(state.history).forEach(([id, sessions]) => {
    if (!trackedIds.has(id)) return;
    sessions.forEach((s) => {
      const wk = weekKey(s.date);
      weekVol[wk] = (weekVol[wk] || 0) + sessionVolume(s.sets);
    });
  });
  const volPoints: ChartPoint[] = Object.keys(weekVol)
    .sort()
    .slice(-8)
    .map((k) => ({ x: k.slice(5), y: Math.round(weekVol[k] / 1000) }));

  const prs = trackedWithHistory.map((t) => ({
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
            <div className="h1">Profile</div>
          </div>
          <div className="row gap8">
            <button
              className="icon-btn"
              style={{ width: 44, height: 44, color: hasFavorites ? 'var(--accent)' : undefined }}
              onClick={() => setShowFavPicker(true)}
              aria-label="Manage tracked exercises"
            >
              <Icon name={hasFavorites ? 'star-filled' : 'star'} size={20} />
            </button>
            <button className="icon-btn" style={{ width: 44, height: 44 }} onClick={onOpenSettings} aria-label="Settings">
              <Icon name="settings" size={20} />
            </button>
          </div>
        </div>
        {hasFavorites && (
          <div className="label" style={{ marginTop: 4 }}>
            Tracking {favorites.length} favorite{favorites.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="scroll">
        <div className="col gap16" style={{ padding: '10px 16px 24px' }}>
          {!hasFavorites ? (
            <div className="card" style={{ padding: 24, textAlign: 'center' }}>
              <div className="accent" style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <Icon name="star" size={32} />
              </div>
              <div className="h2" style={{ marginBottom: 6 }}>No favorites yet</div>
              <div className="label" style={{ lineHeight: 1.5, marginBottom: 16, maxWidth: 260, margin: '0 auto 16px' }}>
                Choose exercises to track so your personal records and strength trends show up here.
              </div>
              <button className="btn primary" style={{ height: 44 }} onClick={() => setShowFavPicker(true)}>
                <Icon name="star" size={18} /> Choose favorites
              </button>
            </div>
          ) : (
            <>
              {volPoints.length > 0 && (
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
              )}

              {prs.length > 0 && (
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
              )}

              <div className="eyebrow" style={{ paddingLeft: 2 }}>Strength trends</div>
              {tracked.map((t) => {
                const hasHistory = t.stats.sessions.length > 0;
                return (
                  <button key={t.id} className="card" style={{ padding: 16, textAlign: 'left', cursor: 'pointer' }} onClick={() => onOpenExercise(t.id)}>
                    <div className="row between" style={{ marginBottom: 8 }}>
                      <div className="row gap10" style={{ minWidth: 0, flex: 1 }}>
                        <GroupDot group={t.meta.group} size={8} />
                        <span className="title clamp1" style={{ flex: 1 }}>{t.meta.name}</span>
                      </div>
                      {hasHistory && (
                        <span
                          className="chip"
                          style={{ flexShrink: 0, ...(t.stats.delta >= 0 ? { background: 'var(--accent-soft)', color: 'var(--accent)', borderColor: 'transparent' } : { color: 'var(--danger)' }) }}
                        >
                          {t.stats.delta >= 0 ? '+' : ''}{t.stats.delta} {unit}
                        </span>
                      )}
                    </div>
                    {hasHistory ? (
                      <>
                        <LineChart points={t.stats.series1RM.map((p) => ({ x: mmdd(p.date), y: p.value }))} height={120} />
                        <div className="row gap16" style={{ marginTop: 8 }}>
                          <MiniStat n={t.stats.cur1RM + unit} l="est 1RM" />
                          <MiniStat n={t.stats.heaviest.weight + unit} l="heaviest" />
                          <MiniStat n={t.stats.sessions.length} l="sessions" />
                        </div>
                      </>
                    ) : (
                      <div className="row gap8 center" style={{ padding: '14px 0 4px', color: 'var(--text-faint)' }}>
                        <Icon name="progress" size={16} />
                        <span className="label">Finish a workout with this exercise to chart your progress.</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>

      <Sheet open={showFavPicker} onClose={() => setShowFavPicker(false)} title="Tracked exercises" full>
        <FavoritePicker
          library={state.library}
          favorites={favorites}
          history={state.history}
          onToggle={onToggleFavorite}
        />
      </Sheet>
    </div>
  );
}

/* ---- Favorite picker ---- */
function FavoritePicker({
  library,
  favorites,
  history,
  onToggle,
}: {
  library: Exercise[];
  favorites: string[];
  history: Record<string, unknown[]>;
  onToggle: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState<string | null>(null);
  const favSet = new Set(favorites);

  const groups = [...new Set(library.map((e) => e.group))];

  const filtered = library.filter((e) => {
    if (group && e.group !== group) return false;
    if (search) {
      const q = search.toLowerCase();
      return e.name.toLowerCase().includes(q) || e.group.toLowerCase().includes(q);
    }
    return true;
  });

  // Sort: favorites first, then by group
  const sorted = [...filtered].sort((a, b) => {
    const af = favSet.has(a.id) ? 0 : 1;
    const bf = favSet.has(b.id) ? 0 : 1;
    if (af !== bf) return af - bf;
    return a.group.localeCompare(b.group) || a.name.localeCompare(b.name);
  });

  return (
    <div className="col gap12" style={{ paddingTop: 6 }}>
      <div className="label" style={{ lineHeight: 1.5 }}>
        Choose which exercises appear in your Progress dashboard for personal records and strength trends.
      </div>
      <input
        className="field"
        placeholder="Search exercises…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ height: 42 }}
      />
      <div className="row gap6 wrap">
        <button
          className="chip"
          style={{ height: 30, padding: '0 10px', ...(group === null ? { background: 'var(--accent)', color: 'var(--accent-ink)', borderColor: 'transparent' } : {}) }}
          onClick={() => setGroup(null)}
        >
          All
        </button>
        {groups.map((g) => (
          <button
            key={g}
            className="chip"
            style={{ height: 30, padding: '0 10px', ...(group === g ? { background: 'var(--accent)', color: 'var(--accent-ink)', borderColor: 'transparent' } : {}) }}
            onClick={() => setGroup(g === group ? null : g)}
          >
            {g}
          </button>
        ))}
      </div>
      <div className="col gap6">
        {sorted.map((e) => {
          const isFav = favSet.has(e.id);
          const hasHistory = !!history[e.id];
          return (
            <button
              key={e.id}
              className="card-2 row between"
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                border: 'none',
                borderLeft: isFav ? '3px solid var(--accent)' : '3px solid transparent',
                background: isFav ? 'color-mix(in oklch, var(--accent) 6%, var(--surface-2))' : 'var(--surface-2)',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'left',
                width: '100%',
                color: 'inherit',
              }}
              onClick={() => onToggle(e.id)}
            >
              <div className="row gap10" style={{ minWidth: 0, flex: 1 }}>
                <GroupDot group={e.group} size={7} />
                <div style={{ minWidth: 0 }}>
                  <div className="title clamp1" style={{ fontSize: 14 }}>{e.name}</div>
                  <div className="label" style={{ fontSize: 11 }}>
                    {e.group} · {e.equipment}
                    {hasHistory && <span className="dim"> · has history</span>}
                  </div>
                </div>
              </div>
              <span style={{ color: isFav ? 'var(--accent)' : 'var(--text-faint)', flexShrink: 0 }}>
                <Icon name={isFav ? 'star-filled' : 'star'} size={20} />
              </span>
            </button>
          );
        })}
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
  onToggleFavorite: (id: string) => void;
  unit: string;
}

export function ExerciseDetail({ state, exId, onClose, onEdit, onToggleFavorite, unit }: ExerciseDetailProps) {
  const meta = state.library.find((e) => e.id === exId) || ({ id: exId, name: exId, group: '', equipment: '', type: 'weight', muscles: [], notes: '', custom: false } as Exercise);
  const stats = exerciseStats(state.history, exId);
  const [metric, setMetric] = useState<'1rm' | 'vol'>('1rm');
  const points: ChartPoint[] = (metric === '1rm' ? stats.series1RM : stats.seriesVol).map((p) => ({ x: mmdd(p.date), y: p.value }));
  const isFavorite = (state.favorites || []).includes(exId);

  return (
    <Sheet open onClose={onClose} full>
      <div className="row between" style={{ margin: '2px 0 14px' }}>
        <div className="row gap8">
          <GroupDot group={meta.group} size={10} />
          <span className="eyebrow">{meta.group} · {meta.equipment}</span>
        </div>
        <div className="row gap8">
          <button
            className="icon-btn"
            style={{ width: 36, height: 36, color: isFavorite ? 'var(--accent)' : undefined }}
            onClick={() => onToggleFavorite(exId)}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Icon name={isFavorite ? 'star-filled' : 'star'} size={18} />
          </button>
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
