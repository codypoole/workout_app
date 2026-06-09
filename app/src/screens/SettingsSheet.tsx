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
  account: AccountInfo;
  onSignOut: () => Promise<void>;
}

export function SettingsSheet({ open, onClose, settings, onChange, account, onSignOut }: SettingsSheetProps) {
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
                    {account.displayName || account.email || 'Signed in'}
                  </div>
                  {account.displayName && account.email && (
                    <div className="label clamp1">{account.email}</div>
                  )}
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

        <div style={{ height: 12 }} />
      </div>
    </Sheet>
  );
}
