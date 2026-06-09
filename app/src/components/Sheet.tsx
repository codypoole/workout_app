/* ============ Bottom sheet ============ */
import type { ReactNode } from 'react';
import { Icon } from './Icon';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  full?: boolean;
}

export function Sheet({ open, onClose, title, children, full }: SheetProps) {
  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        style={full ? { height: '92%' } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grip" />
        {title && (
          <div className="row between" style={{ padding: '6px 18px 10px' }}>
            <div className="h2">{title}</div>
            <button className="icon-btn" onClick={onClose} aria-label="Close">
              <Icon name="x" size={18} />
            </button>
          </div>
        )}
        <div className="scroll" style={{ padding: '0 18px 24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
