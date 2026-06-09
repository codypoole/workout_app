/* ============ Icons (line/shape SVGs) — ported from components.jsx ============ */
import type { JSX } from 'react';

export type IconName =
  | 'today'
  | 'plan'
  | 'library'
  | 'progress'
  | 'dumbbell'
  | 'plus'
  | 'check'
  | 'x'
  | 'play'
  | 'pause'
  | 'timer'
  | 'edit'
  | 'search'
  | 'swap'
  | 'chevron'
  | 'chevdown'
  | 'back'
  | 'upload'
  | 'trophy'
  | 'flame'
  | 'grid'
  | 'list'
  | 'dots'
  | 'trash'
  | 'info'
  | 'settings'
  | 'minus'
  | 'copy'
  | 'phone'
  | 'logout';

const PATHS: Record<IconName, JSX.Element> = {
  today: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  plan: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4" />
    </>
  ),
  library: (
    <>
      <path d="M6.5 4h11M6.5 4 4 7v13h16V7l-2.5-3M4 12h16" />
      <path d="M9.5 16h5" />
    </>
  ),
  progress: (
    <>
      <path d="M4 19V5M4 19h16" />
      <path d="M7 15l3.5-4 3 2.5L20 7" />
    </>
  ),
  dumbbell: (
    <>
      <path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="M5 13l4 4L19 7" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  play: <path d="M7 5l12 7-12 7V5z" />,
  pause: <path d="M8 5v14M16 5v14" />,
  timer: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2 2M9 2h6" />
    </>
  ),
  edit: <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4-4" />
    </>
  ),
  swap: <path d="M7 4 4 7l3 3M4 7h13M17 20l3-3-3-3M20 17H7" />,
  chevron: <path d="M9 6l6 6-6 6" />,
  chevdown: <path d="M6 9l6 6 6-6" />,
  back: <path d="M15 6l-6 6 6 6" />,
  upload: <path d="M12 16V4M7 9l5-5 5 5M5 20h14" />,
  trophy: <path d="M7 4h10v4a5 5 0 0 1-10 0V4zM5 5H3v1a3 3 0 0 0 3 3M19 5h2v1a3 3 0 0 1-3 3M9 19h6M10 15v4M14 15v4" />,
  flame: <path d="M12 3c2 3 5 4.5 5 9a5 5 0 0 1-10 0c0-1.5.5-2.5 1-3 .3 1 1 1.5 1.5 1.5C9.5 8 12 7 12 3z" />,
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  list: <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />,
  dots: (
    <>
      <circle cx="5" cy="12" r="1.3" />
      <circle cx="12" cy="12" r="1.3" />
      <circle cx="19" cy="12" r="1.3" />
    </>
  ),
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h8" />
    </>
  ),
  phone: (
    <>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
};

interface IconProps {
  name: IconName;
  size?: number;
  stroke?: number;
}

export function Icon({ name, size = 22, stroke = 2 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[name] || null}
    </svg>
  );
}
