/* ============================================================
   APP SHELL — tab nav, all state mutations, settings, overlays.
   State lives in the Store (Firebase or local); this component
   reads it via useStoreSnapshot and mutates via store.update.
   ============================================================ */
import { useEffect, useMemo, useState } from 'react';
import type { AppState, Exercise, LoggedSet, Plan, Settings } from '@/types';
import { buildExMap } from '@/lib/selectors';
import { store, useStoreSnapshot } from '@/data/useStore';

import { TabBar, type TabId } from '@/components/TabBar';
import { Icon } from '@/components/Icon';
import { TodayScreen, type RestState } from '@/screens/TodayScreen';
import { PlanScreen } from '@/screens/PlanScreen';
import { LibraryScreen, SwapSheet } from '@/screens/LibraryScreen';
import { ProgressScreen, ExerciseDetail } from '@/screens/ProgressScreen';
import { SettingsSheet } from '@/screens/SettingsSheet';
import { LoginScreen } from '@/screens/LoginScreen';

function clone<T>(o: T): T {
  return JSON.parse(JSON.stringify(o));
}

export default function App() {
  const { state, status, account, error } = useStoreSnapshot();

  // UI-local state (not persisted)
  const [tab, setTab] = useState<TabId>('today');
  const [active, setActive] = useState({ week: 0, day: 0 });
  const [focusIdx, setFocusIdx] = useState(0);
  const [restState, setRestState] = useState<RestState | null>(null);
  const [swap, setSwap] = useState<{ ei: number } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const settings: Settings = state?.settings ?? { theme: 'midnight', type: 'athletic', nav: 'tabs', unit: 'lb' };

  // Apply theme + typeface to the app surface and the PWA status-bar color.
  useEffect(() => {
    const el = document.getElementById('app-root');
    if (el) {
      el.setAttribute('data-theme', settings.theme);
      el.setAttribute('data-type', settings.type);
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', settings.theme === 'paper' ? '#f3f1ec' : '#0a0a0b');
  }, [settings.theme, settings.type]);

  const exMap = useMemo(() => (state ? buildExMap(state.library) : {}), [state]);

  // ---- auth / loading / error gates ----
  if (status === 'unauthenticated') {
    return (
      <div className="app" id="app-root" data-theme={settings.theme} data-type={settings.type}>
        <LoginScreen />
      </div>
    );
  }
  if (status === 'loading' || !state) {
    return (
      <div className="app" id="app-root" data-theme={settings.theme} data-type={settings.type}>
        <div className="col center" style={{ position: 'absolute', inset: 0, gap: 14 }}>
          <span className="accent">
            <Icon name="dumbbell" size={40} />
          </span>
          <div className="eyebrow">Loading your workouts…</div>
        </div>
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="app" id="app-root" data-theme={settings.theme} data-type={settings.type}>
        <div className="col center" style={{ position: 'absolute', inset: 0, gap: 12, padding: 32, textAlign: 'center' }}>
          <span style={{ color: 'var(--danger)' }}>
            <Icon name="info" size={36} />
          </span>
          <div className="h2">Couldn't connect</div>
          <div className="label" style={{ maxWidth: 300 }}>{error}</div>
        </div>
      </div>
    );
  }
  const s: AppState = state;
  const activeWeek = s.plan.weeks[active.week];
  const activeDay = activeWeek && activeWeek.days[active.day];
  const unit = settings.unit;
  const useDock = settings.nav === 'dock';

  /* ---------------- mutations ---------------- */
  function logSet(dayId: string, ei: number, si: number, payload: LoggedSet | null) {
    store.update((st) => {
      const logs = { ...st.logs };
      const day = { ...(logs[dayId] || {}) };
      const ex = { ...(day[ei] || {}) };
      if (payload === null) delete ex[si];
      else ex[si] = payload;
      day[ei] = ex;
      logs[dayId] = day;
      return { ...st, logs };
    });
  }

  function completeDay(dayId: string) {
    store.update((st) => {
      const history = clone(st.history);
      const day = st.plan.weeks[active.week].days[active.day];
      const map = buildExMap(st.library);
      const date = new Date().toISOString().slice(0, 10);
      day.exercises.forEach((item, ei) => {
        const meta = map[item.exerciseId];
        if (!meta || meta.type === 'timed') return;
        const sets: { weight: number; reps: number }[] = [];
        item.sets.forEach((_, si) => {
          const l = (st.logs[dayId] || {})[ei] && st.logs[dayId][ei][si];
          if (l && (l as { done?: boolean }).done && 'weight' in l) sets.push({ weight: l.weight, reps: l.reps });
        });
        if (sets.length) (history[item.exerciseId] = history[item.exerciseId] || []).push({ date, sets });
      });
      return { ...st, history, completedDays: { ...st.completedDays, [dayId]: date } };
    });
  }

  function uncompleteDay(dayId: string) {
    store.update((st) => {
      const history = clone(st.history);
      const date = st.completedDays[dayId];
      const day = st.plan.weeks[active.week].days[active.day];
      if (date)
        (day.exercises || []).forEach((item) => {
          if (history[item.exerciseId]) {
            const arr = history[item.exerciseId];
            const i = arr.map((r) => r.date).lastIndexOf(date);
            if (i >= 0) arr.splice(i, 1);
          }
        });
      const cd = { ...st.completedDays };
      delete cd[dayId];
      return { ...st, history, completedDays: cd };
    });
  }

  function addExerciseToDay(exId: string) {
    store.update((st) => {
      const plan = clone(st.plan);
      const meta = st.library.find((e) => e.id === exId);
      const sets =
        meta && meta.type === 'timed'
          ? [
              { durationSec: 30, restSec: 45 },
              { durationSec: 30, restSec: 45 },
              { durationSec: 30, restSec: 45 },
            ]
          : [
              { weight: 0, reps: 8, restSec: 90 },
              { weight: 0, reps: 8, restSec: 90 },
              { weight: 0, reps: 8, restSec: 90 },
            ];
      plan.weeks[active.week].days[active.day].exercises.push({ exerciseId: exId, sets });
      return { ...st, plan };
    });
  }

  function removeExerciseFromDay(ei: number) {
    const len = activeDay ? activeDay.exercises.length : 0;
    store.update((st) => {
      const plan = clone(st.plan);
      const dayObj = plan.weeks[active.week].days[active.day];
      dayObj.exercises.splice(ei, 1);
      const dayId = dayObj.id;
      const oldLog = st.logs[dayId] || {};
      const newLog: Record<number, Record<number, LoggedSet>> = {};
      Object.keys(oldLog).forEach((k) => {
        const idx = +k;
        if (idx < ei) newLog[idx] = oldLog[idx];
        else if (idx > ei) newLog[idx - 1] = oldLog[idx];
      });
      return { ...st, plan, logs: { ...st.logs, [dayId]: newLog } };
    });
    setFocusIdx((i) => Math.max(0, Math.min(i, len - 2)));
  }

  function advanceDay() {
    let { week, day } = active;
    for (let guard = 0; guard < 60; guard++) {
      day++;
      if (day >= s.plan.weeks[week].days.length) {
        day = 0;
        week++;
      }
      if (week >= s.plan.weeks.length) {
        week = active.week;
        day = active.day;
        break;
      }
      if (!s.plan.weeks[week].days[day].rest) break;
    }
    setActive({ week, day });
    setFocusIdx(0);
  }

  function swapExercise(ei: number, newId: string) {
    store.update((st) => {
      const plan = clone(st.plan);
      plan.weeks[active.week].days[active.day].exercises[ei].exerciseId = newId;
      return { ...st, plan };
    });
  }

  function saveExercise(ex: Exercise) {
    store.update((st) => {
      const exists = st.library.some((e) => e.id === ex.id);
      const library = exists ? st.library.map((e) => (e.id === ex.id ? ex : e)) : [...st.library, ex];
      return { ...st, library };
    });
  }
  function deleteExercise(id: string) {
    store.update((st) => ({ ...st, library: st.library.filter((e) => e.id !== id) }));
  }

  function importPlan(plan: Plan) {
    store.update((st) => {
      const existingPlans = st.plans || [st.plan];
      // Replace if a plan with same id exists, otherwise add
      const exists = existingPlans.some((p) => p.id === plan.id);
      const plans = exists
        ? existingPlans.map((p) => (p.id === plan.id ? plan : p))
        : [...existingPlans, plan];
      return { ...st, plan, plans, activePlanId: plan.id, logs: {}, completedDays: {} };
    });
    const firstNonRest = plan.weeks[0].days.findIndex((d) => !d.rest);
    setActive({ week: 0, day: firstNonRest === -1 ? 0 : firstNonRest });
    setFocusIdx(0);
    setTab('today');
  }

  function activatePlan(planId: string) {
    store.update((st) => {
      const plans = st.plans || [st.plan];
      const target = plans.find((p) => p.id === planId);
      if (!target) return st;
      return { ...st, plan: target, activePlanId: planId, logs: {}, completedDays: {} };
    });
    setActive({ week: 0, day: 0 });
    setFocusIdx(0);
    setTab('today');
  }

  function deletePlan(planId: string) {
    store.update((st) => {
      const plans = (st.plans || [st.plan]).filter((p) => p.id !== planId);
      if (plans.length === 0) return st; // don't delete the last plan
      // If deleting the active plan, switch to the first remaining one
      const isActive = st.activePlanId === planId || st.plan.id === planId;
      if (isActive) {
        return { ...st, plan: plans[0], plans, activePlanId: plans[0].id, logs: {}, completedDays: {} };
      }
      return { ...st, plans };
    });
  }

  function toggleFavorite(exerciseId: string) {
    store.update((st) => {
      const favs = st.favorites || [];
      const isFav = favs.includes(exerciseId);
      return { ...st, favorites: isFav ? favs.filter((id) => id !== exerciseId) : [...favs, exerciseId] };
    });
  }

  function changeSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    store.update((st) => ({ ...st, settings: { ...st.settings, [key]: value } }));
  }

  return (
    <div className="app" id="app-root" data-theme={settings.theme} data-type={settings.type}>
      <div className="screen" style={{ paddingTop: 0 }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          {tab === 'today' && (
            <TodayScreen
              state={s}
              weekName={activeWeek ? activeWeek.name : ''}
              day={activeDay}
              exMap={exMap}
              unit={unit}
              onLog={logSet}
              onCompleteDay={completeDay}
              onUncompleteDay={uncompleteDay}
              onAdvance={advanceDay}
              onSwap={(ei) => setSwap({ ei })}
              onAddExercise={() => setAddOpen(true)}
              onDeleteExercise={removeExerciseFromDay}
              onOpenExercise={(id) => setDetailId(id)}
              restState={restState}
              setRestState={setRestState}
              focusIdx={focusIdx}
              setFocusIdx={setFocusIdx}
            />
          )}
          {tab === 'plan' && (
            <PlanScreen
              state={s}
              exMap={exMap}
              activeRef={active}
              onSetActive={(w, d) => {
                setActive({ week: w, day: d });
                setFocusIdx(0);
                setTab('today');
              }}
              onImport={importPlan}
              onActivatePlan={activatePlan}
              onDeletePlan={deletePlan}
            />
          )}
          {tab === 'library' && (
            <LibraryScreen state={s} onSave={saveExercise} onDelete={deleteExercise} onOpenExercise={(id) => setDetailId(id)} />
          )}
          {tab === 'progress' && (
            <ProgressScreen state={s} unit={unit} onOpenExercise={(id) => setDetailId(id)} onOpenSettings={() => setSettingsOpen(true)} onToggleFavorite={toggleFavorite} />
          )}
        </div>
      </div>

      <TabBar tab={tab} onChange={setTab} dock={useDock} />

      {/* overlays */}
      {swap != null && activeDay && (
        <SwapSheet
          open
          onClose={() => setSwap(null)}
          library={s.library}
          currentId={activeDay.exercises[swap.ei]?.exerciseId ?? null}
          onPick={(id) => swapExercise(swap.ei, id)}
        />
      )}
      {addOpen && (
        <SwapSheet open mode="add" onClose={() => setAddOpen(false)} library={s.library} currentId={null} onPick={(id) => addExerciseToDay(id)} />
      )}
      {detailId && (
        <ExerciseDetail
          state={s}
          exId={detailId}
          unit={unit}
          onClose={() => setDetailId(null)}
          onEdit={() => {
            setDetailId(null);
            setTab('library');
          }}
          onToggleFavorite={toggleFavorite}
        />
      )}

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={changeSetting}
        account={account}
        onSignOut={store.signOutAccount}
      />
    </div>
  );
}
