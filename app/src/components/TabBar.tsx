/* ============ Bottom navigation (tabs | dock) ============ */
import { Icon, type IconName } from './Icon';

export type TabId = 'today' | 'plan' | 'library' | 'progress';

export const TABS: { id: TabId; label: string; icon: IconName }[] = [
  { id: 'today', label: 'Today', icon: 'today' },
  { id: 'plan', label: 'Plan', icon: 'plan' },
  { id: 'library', label: 'Library', icon: 'library' },
  { id: 'progress', label: 'Profile', icon: 'progress' },
];

interface TabBarProps {
  tab: TabId;
  onChange: (t: TabId) => void;
  dock?: boolean;
}

export function TabBar({ tab, onChange, dock }: TabBarProps) {
  return (
    <div
      className={'tabbar' + (dock ? ' dock' : '')}
      style={dock ? undefined : undefined}
    >
      {TABS.map((tb) => (
        <button
          key={tb.id}
          className={'tab' + (tab === tb.id ? ' active' : '')}
          onClick={() => onChange(tb.id)}
          aria-label={tb.label}
          aria-current={tab === tb.id ? 'page' : undefined}
        >
          <span className="tab-ico">
            <Icon name={tb.icon} size={dock ? 20 : 23} stroke={2} />
          </span>
          {!dock && <span>{tb.label}</span>}
        </button>
      ))}
    </div>
  );
}
