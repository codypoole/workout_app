import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { store } from '@/data/useStore';

type Step = 'options' | 'email-sent';

export function LoginScreen() {
  const [step, setStep] = useState<Step>('options');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendLink() {
    setError(null);
    setBusy(true);
    try {
      await store.sendEmailLink(email);
      setStep('email-sent');
    } catch (e) {
      setError(humanError(e));
    } finally {
      setBusy(false);
    }
  }

  async function socialSignIn(method: 'google' | 'apple') {
    setError(null);
    setBusy(true);
    try {
      if (method === 'google') await store.signInWithGoogle();
      else await store.signInWithApple();
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

        {step === 'options' && (
          <div className="col gap12" style={{ width: '100%', marginTop: 8 }}>
            <button
              className="btn block lg login-social"
              disabled={busy}
              onClick={() => socialSignIn('google')}
            >
              <Icon name="google" size={18} /> Continue with Google
            </button>
            <button
              className="btn block lg login-social"
              disabled={busy}
              onClick={() => socialSignIn('apple')}
            >
              <Icon name="apple" size={18} /> Continue with Apple
            </button>

            <div className="login-divider row center">
              <span className="divide grow" />
              <span className="label" style={{ padding: '0 12px', fontSize: 11 }}>OR</span>
              <span className="divide grow" />
            </div>

            <label className="label">Email (passwordless)</label>
            <input
              className="field"
              type="email"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !busy && email.includes('@') && sendLink()}
              autoFocus
            />
            <button
              className="btn primary block lg"
              disabled={busy || !email.includes('@')}
              onClick={sendLink}
            >
              <Icon name="mail" size={18} />
              {busy ? 'Sending...' : 'Send Sign-In Link'}
            </button>
          </div>
        )}

        {step === 'email-sent' && (
          <div className="col gap12 center" style={{ width: '100%', marginTop: 8, textAlign: 'center' }}>
            <span className="accent">
              <Icon name="mail" size={32} />
            </span>
            <div className="title">Check your email</div>
            <div className="label" style={{ lineHeight: 1.5 }}>
              We sent a sign-in link to <strong style={{ color: 'var(--text)' }}>{email}</strong>.
              <br />Tap the link in the email to sign in.
            </div>
            <button
              className="btn ghost block"
              onClick={() => {
                setStep('options');
                setError(null);
              }}
            >
              <Icon name="back" size={16} /> Back
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
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in cancelled.';
    case 'auth/popup-blocked':
      return 'Pop-up blocked by browser. Please allow pop-ups and try again.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method.';
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled. Enable it in Firebase Console.';
    default:
      return (e as Error).message || 'Something went wrong.';
  }
}
