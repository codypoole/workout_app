/* ============ Confirmation modal ============ */
import { Icon } from './Icon';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;
  return (
    <div
      className="sheet-backdrop"
      style={{ alignItems: 'center', justifyContent: 'center' }}
      onClick={onCancel}
    >
      <div
        className="card"
        style={{
          width: 'calc(100% - 48px)',
          maxWidth: 340,
          padding: '24px 22px 18px',
          background: 'var(--surface)',
          borderRadius: 20,
          animation: 'pop .2s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 99,
            background: danger ? 'color-mix(in oklch, var(--danger) 14%, transparent)' : 'var(--accent-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14,
            color: danger ? 'var(--danger)' : 'var(--accent)',
          }}
        >
          <Icon name={danger ? 'trash' : 'info'} size={22} />
        </div>
        <div className="h2" style={{ marginBottom: 6 }}>{title}</div>
        <div className="label" style={{ lineHeight: 1.5, marginBottom: 20 }}>{message}</div>
        <div className="row gap8">
          <button
            className="btn ghost grow"
            style={{ height: 44 }}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="btn grow"
            style={{
              height: 44,
              background: danger ? 'var(--danger)' : 'var(--accent)',
              color: danger ? '#fff' : 'var(--accent-ink)',
              border: 'none',
            }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
