/* ============ Stepper number input (type-in + nudge buttons) ============ */
import { useEffect, useState } from 'react';
import { Icon } from './Icon';

interface StepperProps {
  value: number;
  onChange: (n: number) => void;
  step?: number;
  min?: number;
  suffix?: string;
}

export function Stepper({ value, onChange, step = 5, min = 0, suffix }: StepperProps) {
  const [txt, setTxt] = useState(String(value));
  useEffect(() => {
    setTxt(String(value));
  }, [value]);

  function commit(raw: string | number) {
    let n = parseFloat(String(raw));
    if (isNaN(n)) n = min;
    n = Math.max(min, +n.toFixed(2));
    onChange(n);
    setTxt(String(n));
  }

  return (
    <div
      className="row"
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--line-2)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <button
        className="icon-btn"
        style={{ borderRadius: 0, border: 'none', background: 'transparent', width: 42, height: 48 }}
        onClick={() => commit(parseFloat(txt || '0') - step)}
        aria-label="Decrease"
      >
        <Icon name="minus" size={16} />
      </button>
      <div className="row center" style={{ minWidth: 62, gap: 2 }}>
        <input
          value={txt}
          inputMode="decimal"
          enterKeyHint="done"
          onChange={(e) => setTxt(e.target.value)}
          onFocus={(e) => e.target.select()}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
          style={{
            width: suffix ? 42 : 56,
            textAlign: suffix ? 'right' : 'center',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text)',
            fontFamily: 'var(--font-mono)',
            fontSize: 17,
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            padding: 0,
          }}
        />
        {suffix ? <span className="faint" style={{ fontSize: 12 }}>{suffix}</span> : null}
      </div>
      <button
        className="icon-btn"
        style={{ borderRadius: 0, border: 'none', background: 'transparent', width: 42, height: 48 }}
        onClick={() => commit(parseFloat(txt || '0') + step)}
        aria-label="Increase"
      >
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
}
