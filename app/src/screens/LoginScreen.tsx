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
