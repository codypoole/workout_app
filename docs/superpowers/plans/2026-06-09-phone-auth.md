# Phone Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace anonymous + Google auth with Firebase phone authentication as the sole login method.

**Architecture:** A new `LoginScreen` component handles the two-step phone auth flow (enter number → verify OTP). The `Store` class drops anonymous/Google auth and exposes `signInWithPhone` / `confirmPhoneCode`. `App.tsx` gates on a new `unauthenticated` status to show the login screen before the main app.

**Tech Stack:** Firebase Auth (`signInWithPhoneNumber`, `RecaptchaVerifier`), React, TypeScript, Vite

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `app/src/lib/firebase.ts` | Modify | Export phone auth utilities, drop `googleAuthEnabled` |
| `app/src/data/store.ts` | Modify | Replace anon/Google auth with phone auth, add `unauthenticated` status |
| `app/src/screens/LoginScreen.tsx` | Create | Two-step phone auth UI (phone entry + OTP verify) |
| `app/src/App.tsx` | Modify | Render `LoginScreen` when unauthenticated |
| `app/src/screens/SettingsSheet.tsx` | Modify | Remove Google sign-in, show phone number |
| `app/src/components/Icon.tsx` | Modify | Add `phone` icon, remove `google` icon |
| `app/src/styles.css` | Modify | Add login screen styles |

---

### Task 1: Update Firebase exports for phone auth

**Files:**
- Modify: `app/src/lib/firebase.ts`

- [ ] **Step 1: Replace Google auth flag with phone auth exports**

In `app/src/lib/firebase.ts`, replace the `googleAuthEnabled` export and add phone auth imports. The full updated file:

```typescript
import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type Auth,
  type ConfirmationResult,
} from 'firebase/auth';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const firebaseEnabled = Boolean(cfg.apiKey && cfg.projectId && cfg.appId);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;
let analytics: Analytics | null = null;

if (firebaseEnabled) {
  app = initializeApp(cfg);
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  });
  auth = getAuth(app);

  if (cfg.measurementId) {
    isSupported()
      .then((ok) => {
        if (ok && app) analytics = getAnalytics(app);
      })
      .catch(() => {});
  }
}

export { app, db, auth, analytics, RecaptchaVerifier, signInWithPhoneNumber };
export type { ConfirmationResult };
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `cd app && npx tsc --noEmit 2>&1 | head -20`

Expected: errors about `googleAuthEnabled` being missing (used in SettingsSheet) — that's fine, we'll fix it in a later task. No errors from `firebase.ts` itself.

- [ ] **Step 3: Commit**

```bash
git add app/src/lib/firebase.ts
git commit -m "feat: export phone auth utilities from firebase module"
```

---

### Task 2: Update Store — replace anonymous/Google auth with phone auth

**Files:**
- Modify: `app/src/data/store.ts`

- [ ] **Step 1: Rewrite auth logic in Store**

Replace the full contents of `app/src/data/store.ts` with:

```typescript
import {
  doc,
  onSnapshot,
  setDoc,
  type DocumentReference,
  type Unsubscribe,
} from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { AppState, Settings } from '@/types';
import { freshState } from '@/lib/seed';
import {
  auth,
  db,
  firebaseEnabled,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from '@/lib/firebase';

export type StoreStatus = 'loading' | 'ready' | 'error' | 'unauthenticated';

export interface AccountInfo {
  mode: 'firebase' | 'local';
  uid: string | null;
  phoneNumber: string | null;
}

export interface StoreSnapshot {
  state: AppState | null;
  status: StoreStatus;
  account: AccountInfo;
  error: string | null;
}

const LOCAL_KEY = 'workoutpwa.v1';
const DEFAULT_SETTINGS: Settings = {
  theme: 'midnight',
  type: 'athletic',
  nav: 'tabs',
  unit: 'lb',
};

function coerceState(data: Partial<AppState> | null | undefined): AppState {
  const base = freshState();
  if (!data) return base;
  return {
    library: Array.isArray(data.library) && data.library.length ? data.library : base.library,
    plan: data.plan && data.plan.weeks ? data.plan : base.plan,
    history: data.history || {},
    logs: data.logs || {},
    completedDays: data.completedDays || {},
    settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) },
  };
}

function sanitize<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export class Store {
  private snapshot: StoreSnapshot;
  private listeners = new Set<() => void>();

  private docRef: DocumentReference | null = null;
  private docUnsub: Unsubscribe | null = null;
  private writeTimer: ReturnType<typeof setTimeout> | null = null;
  private dirty = false;

  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private confirmationResult: ConfirmationResult | null = null;

  constructor() {
    this.snapshot = {
      state: null,
      status: 'loading',
      account: {
        mode: firebaseEnabled ? 'firebase' : 'local',
        uid: null,
        phoneNumber: null,
      },
      error: null,
    };

    if (firebaseEnabled && auth) {
      this.initFirebase();
    } else {
      this.initLocal();
    }
  }

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  getSnapshot = (): StoreSnapshot => this.snapshot;

  private emit() {
    this.listeners.forEach((l) => l());
  }
  private set(patch: Partial<StoreSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    this.emit();
  }

  update = (fn: (s: AppState) => AppState): void => {
    const cur = this.snapshot.state;
    if (!cur) return;
    const next = fn(cur);
    this.set({ state: next });
    this.persist(next);
  };

  reset = (): void => {
    const fresh = freshState();
    this.set({ state: fresh });
    this.persist(fresh);
  };

  /* ---------- local backend ---------- */
  private initLocal() {
    let loaded: AppState;
    try {
      const raw = localStorage.getItem(LOCAL_KEY);
      loaded = raw ? coerceState(JSON.parse(raw)) : freshState();
    } catch {
      loaded = freshState();
    }
    this.set({ state: loaded, status: 'ready' });
  }

  private persistLocal(state: AppState) {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
    } catch {
      /* quota / private mode */
    }
  }

  /* ---------- firebase backend ---------- */
  private initFirebase() {
    onAuthStateChanged(auth!, (user) => {
      if (this.docUnsub) {
        this.docUnsub();
        this.docUnsub = null;
      }

      if (!user) {
        this.set({
          status: 'unauthenticated',
          state: null,
          account: { mode: 'firebase', uid: null, phoneNumber: null },
        });
        return;
      }

      this.set({
        account: {
          mode: 'firebase',
          uid: user.uid,
          phoneNumber: user.phoneNumber || null,
        },
      });

      this.docRef = doc(db!, 'users', user.uid);
      this.docUnsub = onSnapshot(
        this.docRef,
        { includeMetadataChanges: true },
        (snap) => {
          if (snap.metadata.hasPendingWrites) return;

          if (!snap.exists()) {
            const seeded = freshState();
            this.set({ state: seeded, status: 'ready' });
            this.dirty = false;
            setDoc(this.docRef!, sanitize(seeded)).catch(() => {});
            return;
          }

          if (this.dirty) {
            if (this.snapshot.status !== 'ready') this.set({ status: 'ready' });
            return;
          }
          this.set({ state: coerceState(snap.data() as Partial<AppState>), status: 'ready' });
        },
        (err) => this.set({ status: 'error', error: err.message }),
      );
    });
  }

  private persist(state: AppState) {
    if (this.snapshot.account.mode === 'local') {
      this.persistLocal(state);
      return;
    }
    if (!this.docRef) return;
    this.dirty = true;
    if (this.writeTimer) clearTimeout(this.writeTimer);
    this.writeTimer = setTimeout(() => {
      const latest = this.snapshot.state;
      if (!latest || !this.docRef) return;
      setDoc(this.docRef, sanitize(latest))
        .then(() => {
          this.dirty = false;
        })
        .catch(() => {
          this.dirty = false;
        });
    }, 400);
  }

  /* ---------- phone auth ---------- */
  setupRecaptcha = (buttonId: string): void => {
    if (!auth) return;
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
    }
    this.recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
      size: 'invisible',
    });
  };

  signInWithPhone = async (phoneNumber: string): Promise<void> => {
    if (!auth || !this.recaptchaVerifier) {
      throw new Error('Auth not initialized');
    }
    this.confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      this.recaptchaVerifier,
    );
  };

  confirmPhoneCode = async (code: string): Promise<void> => {
    if (!this.confirmationResult) {
      throw new Error('No confirmation result — send the code first');
    }
    await this.confirmationResult.confirm(code);
  };

  signOutAccount = async (): Promise<void> => {
    if (!auth) return;
    await signOut(auth);
  };
}

export const store = new Store();
```

- [ ] **Step 2: Commit**

```bash
git add app/src/data/store.ts
git commit -m "feat: replace anonymous/Google auth with phone auth in Store"
```

---

### Task 3: Add phone icon, remove google icon

**Files:**
- Modify: `app/src/components/Icon.tsx`

- [ ] **Step 1: Update Icon component**

In `app/src/components/Icon.tsx`:

1. In the `IconName` type union, replace `'google'` with `'phone'`.

2. In the `PATHS` record, replace the `google` entry with:

```typescript
  phone: (
    <>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
```

3. Remove the special-case `if (name === 'google')` block in the `Icon` function (lines 139-145), since the `phone` icon uses strokes like all the others.

- [ ] **Step 2: Commit**

```bash
git add app/src/components/Icon.tsx
git commit -m "feat: add phone icon, remove google icon"
```

---

### Task 4: Create LoginScreen component

**Files:**
- Create: `app/src/screens/LoginScreen.tsx`

- [ ] **Step 1: Create the login screen**

Create `app/src/screens/LoginScreen.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/Icon';
import { store } from '@/data/useStore';

type Step = 'phone' | 'code';

export function LoginScreen() {
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    store.setupRecaptcha('send-code-btn');
  }, []);

  async function sendCode() {
    setError(null);
    setBusy(true);
    try {
      const formatted = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;
      await store.signInWithPhone(formatted);
      setStep('code');
      setTimeout(() => codeRef.current?.focus(), 80);
    } catch (e) {
      setError(humanError(e));
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode() {
    setError(null);
    setBusy(true);
    try {
      await store.confirmPhoneCode(code);
    } catch (e) {
      setError(humanError(e));
      setBusy(false);
    }
  }

  return (
    <div className="login-screen col center">
      <div className="login-card col center gap16">
        <span className="accent">
          <Icon name="dumbbell" size={48} />
        </span>
        <div className="h1" style={{ textAlign: 'center' }}>Workout</div>

        {step === 'phone' && (
          <div className="col gap12" style={{ width: '100%', marginTop: 8 }}>
            <label className="label">Phone number</label>
            <div className="row gap8">
              <span className="login-prefix mono">+1</span>
              <input
                className="field grow"
                type="tel"
                inputMode="tel"
                placeholder="(555) 123-4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !busy && sendCode()}
                autoFocus
              />
            </div>
            <button
              id="send-code-btn"
              className="btn primary block lg"
              disabled={busy || phone.replace(/\D/g, '').length < 10}
              onClick={sendCode}
            >
              {busy ? 'Sending…' : 'Send Code'}
            </button>
          </div>
        )}

        {step === 'code' && (
          <div className="col gap12" style={{ width: '100%', marginTop: 8 }}>
            <label className="label">Enter the 6-digit code sent to your phone</label>
            <input
              ref={codeRef}
              className="field mono"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && !busy && code.length === 6 && verifyCode()}
              style={{ textAlign: 'center', fontSize: 24, letterSpacing: '0.3em' }}
            />
            <button
              className="btn primary block lg"
              disabled={busy || code.length !== 6}
              onClick={verifyCode}
            >
              {busy ? 'Verifying…' : 'Verify'}
            </button>
            <button
              className="btn ghost block"
              disabled={busy}
              onClick={() => {
                setStep('phone');
                setCode('');
                setError(null);
                store.setupRecaptcha('send-code-btn');
              }}
            >
              <Icon name="back" size={16} /> Change number
            </button>
          </div>
        )}

        {error && (
          <div className="label" style={{ color: 'var(--danger)', textAlign: 'center' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

function humanError(e: unknown): string {
  const code = (e as { code?: string }).code;
  switch (code) {
    case 'auth/invalid-phone-number':
      return 'Invalid phone number. Include country code if outside the US.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/invalid-verification-code':
      return 'Incorrect code. Please try again.';
    case 'auth/code-expired':
      return 'Code expired. Tap "Change number" to resend.';
    case 'auth/missing-phone-number':
      return 'Please enter a phone number.';
    default:
      return (e as Error).message || 'Something went wrong.';
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/src/screens/LoginScreen.tsx
git commit -m "feat: create LoginScreen with phone auth flow"
```

---

### Task 5: Add login screen styles

**Files:**
- Modify: `app/src/styles.css`

- [ ] **Step 1: Add login styles**

Append the following to the end of `app/src/styles.css` (before the `prefers-reduced-motion` media query):

```css
/* ============ LOGIN SCREEN ============ */
.login-screen {
  position: absolute;
  inset: 0;
  padding: 32px 24px;
  background: radial-gradient(120% 60% at 50% -10%, #18181c 0%, var(--bg) 55%);
}
[data-theme='paper'] .login-screen {
  background: radial-gradient(120% 60% at 50% -10%, #ffffff 0%, var(--bg) 55%);
}
.login-card {
  width: 100%;
  max-width: 320px;
}
.login-prefix {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 12px;
  font-size: 16px;
  color: var(--text-dim);
  background: var(--surface-2);
  border: 1px solid var(--line-2);
  border-radius: 12px;
  flex-shrink: 0;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/src/styles.css
git commit -m "feat: add login screen styles"
```

---

### Task 6: Gate App.tsx on auth state

**Files:**
- Modify: `app/src/App.tsx`

- [ ] **Step 1: Add LoginScreen import and unauthenticated gate**

In `app/src/App.tsx`:

1. Add the import at the top with the other screen imports:

```typescript
import { LoginScreen } from '@/screens/LoginScreen';
```

2. Inside the `App` component, after the existing `status === 'error'` gate block (after line 76), add:

```typescript
  if (status === 'unauthenticated') {
    return (
      <div className="app" id="app-root" data-theme={settings.theme} data-type={settings.type}>
        <LoginScreen />
      </div>
    );
  }
```

- [ ] **Step 2: Commit**

```bash
git add app/src/App.tsx
git commit -m "feat: render LoginScreen when unauthenticated"
```

---

### Task 7: Update SettingsSheet — remove Google, show phone number

**Files:**
- Modify: `app/src/screens/SettingsSheet.tsx`

- [ ] **Step 1: Rewrite SettingsSheet**

Replace the full contents of `app/src/screens/SettingsSheet.tsx`:

```tsx
import { useState } from 'react';
import type {
  NavName,
  Settings,
  ThemeName,
  TypeName,
  UnitName,
} from '@/types';
import { Sheet } from '@/components/Sheet';
import { Icon } from '@/components/Icon';
import type { AccountInfo } from '@/data/store';

const THEMES: { name: ThemeName; swatch: string }[] = [
  { name: 'midnight', swatch: '#c8f135' },
  { name: 'ember', swatch: '#ff6a3d' },
  { name: 'ice', swatch: '#5aa2ff' },
  { name: 'violet', swatch: '#b69bff' },
  { name: 'paper', swatch: '#1c1b1f' },
];
const TYPES: TypeName[] = ['athletic', 'technical', 'grotesk'];
const NAVS: NavName[] = ['tabs', 'dock'];
const UNITS: UnitName[] = ['lb', 'kg'];

function Section({ label }: { label: string }) {
  return <div className="eyebrow" style={{ marginTop: 6 }}>{label}</div>;
}

function Radio<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: T[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="col gap6">
      <span className="label">{label}</span>
      <div className="row gap6 wrap">
        {options.map((o) => (
          <button
            key={o}
            className="chip"
            style={{ height: 36, padding: '0 14px', textTransform: 'capitalize', ...(o === value ? { background: 'var(--accent)', color: 'var(--accent-ink)', borderColor: 'transparent' } : {}) }}
            onClick={() => onChange(o)}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  onChange: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  onReset: () => void;
  account: AccountInfo;
  onSignOut: () => Promise<void>;
}

export function SettingsSheet({ open, onClose, settings, onChange, onReset, account, onSignOut }: SettingsSheetProps) {
  const [busy, setBusy] = useState(false);
  const [authMsg, setAuthMsg] = useState<string | null>(null);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setAuthMsg(null);
    try {
      await fn();
    } catch (e) {
      setAuthMsg((e as Error).message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Settings" full>
      <div className="col gap16" style={{ paddingTop: 6 }}>
        <Section label="Theme" />
        <div className="col gap6">
          <span className="label">Accent / mood</span>
          <div className="row gap8 wrap">
            {THEMES.map((t) => (
              <button
                key={t.name}
                onClick={() => onChange('theme', t.name)}
                aria-label={t.name}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  cursor: 'pointer',
                  background: t.swatch,
                  border: settings.theme === t.name ? '2px solid var(--text)' : '2px solid var(--line)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {settings.theme === t.name && (
                  <span style={{ color: t.name === 'midnight' || t.name === 'ice' || t.name === 'violet' ? '#000' : '#fff' }}>
                    <Icon name="check" size={18} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
        <Radio label="Typeface" value={settings.type} options={TYPES} onChange={(v) => onChange('type', v)} />

        <div className="divide" />
        <Section label="Navigation" />
        <Radio label="Bottom nav" value={settings.nav} options={NAVS} onChange={(v) => onChange('nav', v)} />

        <Section label="Units" />
        <Radio label="Weight unit" value={settings.unit} options={UNITS} onChange={(v) => onChange('unit', v)} />

        <div className="divide" />
        <Section label="Account" />
        <div className="card-2" style={{ padding: 14 }}>
          {account.mode === 'local' ? (
            <div className="label" style={{ lineHeight: 1.5 }}>
              Running in <span className="accent">local-only</span> mode — your data is saved on this device. Add Firebase config to enable cloud sync across devices.
            </div>
          ) : (
            <>
              <div className="row between">
                <div style={{ minWidth: 0 }}>
                  <div className="title" style={{ fontSize: 14 }}>
                    <Icon name="phone" size={14} />{' '}
                    {account.phoneNumber || 'Signed in'}
                  </div>
                </div>
                <span className="accent" style={{ flexShrink: 0 }}>
                  <Icon name="check" size={18} />
                </span>
              </div>
              <button className="btn ghost block" style={{ marginTop: 12 }} disabled={busy} onClick={() => run(onSignOut)}>
                <Icon name="logout" size={16} /> Sign out
              </button>
            </>
          )}
          {authMsg && (
            <div className="label" style={{ color: 'var(--danger)', marginTop: 10 }}>{authMsg}</div>
          )}
        </div>

        <div className="divide" />
        <Section label="Data" />
        <button
          className="btn danger block"
          onClick={() => {
            if (confirm('Reset to demo data? This replaces your current library, plan, logs, and history.')) onReset();
          }}
        >
          <Icon name="trash" size={16} /> Reset demo data
        </button>
        <div style={{ height: 12 }} />
      </div>
    </Sheet>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/src/screens/SettingsSheet.tsx
git commit -m "feat: update SettingsSheet for phone auth"
```

---

### Task 8: Update App.tsx props for SettingsSheet

**Files:**
- Modify: `app/src/App.tsx`

- [ ] **Step 1: Remove Google sign-in prop from SettingsSheet usage**

In `app/src/App.tsx`, find the `<SettingsSheet` JSX (around line 310). Remove the `onSignInGoogle={store.signInWithGoogle}` prop so the SettingsSheet block reads:

```tsx
      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onChange={changeSetting}
        onReset={resetDemo}
        account={account}
        onSignOut={store.signOutAccount}
      />
```

- [ ] **Step 2: Verify TypeScript compiles clean**

Run: `cd app && npx tsc --noEmit`

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/src/App.tsx
git commit -m "feat: remove Google sign-in prop from App"
```

---

### Task 9: Clean up env config

**Files:**
- Modify: `app/.env`
- Modify: `app/.env.example`

- [ ] **Step 1: Remove VITE_ENABLE_GOOGLE_AUTH from .env**

Remove the `VITE_ENABLE_GOOGLE_AUTH=0` line from `app/.env`.

- [ ] **Step 2: Remove from .env.example too**

Remove the corresponding line from `app/.env.example` (if it exists there).

- [ ] **Step 3: Commit**

```bash
git add app/.env app/.env.example
git commit -m "chore: remove VITE_ENABLE_GOOGLE_AUTH env var"
```

---

### Task 10: Build verification and manual test

- [ ] **Step 1: Run full build**

Run: `cd app && npm run build`

Expected: clean build, no errors.

- [ ] **Step 2: Start dev server and test in browser**

Run: `cd app && npm run dev`

Verify:
1. App loads and shows the login screen (dumbbell icon, "Workout" title, phone input)
2. Entering a phone number and tapping "Send Code" triggers the invisible reCAPTCHA and sends an SMS (requires Firebase Phone Auth to be enabled in the console)
3. After entering the OTP code, the app transitions to the main workout UI
4. Settings sheet shows the phone number and a sign-out button
5. Signing out returns to the login screen

- [ ] **Step 3: Final commit if any tweaks needed**

```bash
git add -A
git commit -m "fix: address any issues found during manual testing"
```
