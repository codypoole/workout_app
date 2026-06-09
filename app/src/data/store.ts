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
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from '@/lib/firebase';

export type StoreStatus = 'loading' | 'ready' | 'error' | 'unauthenticated';

export interface AccountInfo {
  mode: 'firebase' | 'local';
  uid: string | null;
  displayName: string | null;
  email: string | null;
}

export interface StoreSnapshot {
  state: AppState | null;
  status: StoreStatus;
  account: AccountInfo;
  error: string | null;
}

const LOCAL_KEY = 'workoutpwa.v1';
const EMAIL_KEY = 'workoutpwa.emailForSignIn';
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

  constructor() {
    this.snapshot = {
      state: null,
      status: 'loading',
      account: {
        mode: firebaseEnabled ? 'firebase' : 'local',
        uid: null,
        displayName: null,
        email: null,
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
    this.completeEmailLinkSignIn();

    onAuthStateChanged(auth!, (user) => {
      if (this.docUnsub) {
        this.docUnsub();
        this.docUnsub = null;
      }

      if (!user || user.isAnonymous) {
        if (user?.isAnonymous) {
          signOut(auth!).catch(() => {});
          return;
        }
        this.set({
          status: 'unauthenticated',
          state: null,
          account: { mode: 'firebase', uid: null, displayName: null, email: null },
        });
        return;
      }

      this.set({
        account: {
          mode: 'firebase',
          uid: user.uid,
          displayName: user.displayName || null,
          email: user.email || null,
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

  /* ---------- email link (passwordless) auth ---------- */
  sendEmailLink = async (email: string): Promise<void> => {
    if (!auth) throw new Error('Auth not initialized');
    const actionCodeSettings = {
      url: window.location.origin,
      handleCodeInApp: true,
    };
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    localStorage.setItem(EMAIL_KEY, email);
  };

  private completeEmailLinkSignIn() {
    if (!auth) return;
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = localStorage.getItem(EMAIL_KEY);
      if (!email) {
        email = window.prompt('Please enter your email to confirm sign-in:');
      }
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => {
            localStorage.removeItem(EMAIL_KEY);
            window.history.replaceState(null, '', window.location.origin);
          })
          .catch((e) => {
            this.set({ status: 'error', error: (e as Error).message });
          });
      }
    }
  }

  /* ---------- social auth ---------- */
  signInWithGoogle = async (): Promise<void> => {
    if (!auth) throw new Error('Auth not initialized');
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  signInWithApple = async (): Promise<void> => {
    if (!auth) throw new Error('Auth not initialized');
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    await signInWithPopup(auth, provider);
  };

  signOutAccount = async (): Promise<void> => {
    if (!auth) return;
    await signOut(auth);
  };
}

export const store = new Store();
