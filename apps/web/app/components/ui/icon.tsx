import type { SVGProps } from 'react';

/**
 * Ince cizgili SVG ikon seti.
 *
 * Her ikonun viewBox'i 24x24. Bu ÖNEMLİ: viewBox verilmezse tarayıcı
 * cizimi kirpar ve ikonlar yarım görünür (tasarım önizlemesinde
 * yaşanan hata buydu).
 */

const P = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const PATHS: Record<string, React.ReactNode> = {
  paw: (
    <g {...P}>
      <circle cx="11" cy="4.5" r="2" />
      <circle cx="17.5" cy="7.5" r="2" />
      <circle cx="6.5" cy="8" r="2" />
      <circle cx="4" cy="14" r="1.8" />
      <path d="M11.5 12c2.5 0 4.5 2 5 4.2.4 1.9-.9 3.3-2.6 3.3-1 0-1.7-.4-2.4-.4s-1.4.4-2.4.4c-1.7 0-3-1.4-2.6-3.3C7 14 9 12 11.5 12z" />
    </g>
  ),
  stethoscope: (
    <g {...P}>
      <path d="M4.5 3v5a4 4 0 0 0 8 0V3" />
      <path d="M3 3h3M11 3h3" />
      <path d="M8.5 12v3a5 5 0 0 0 10 0v-1" />
      <circle cx="18.5" cy="12" r="2" />
    </g>
  ),
  syringe: (
    <g {...P}>
      <path d="m18 2 4 4M17 7l-1.5-1.5M20.5 3.5 15 9M9.5 7.5 16.5 14.5 11 20H5.5L4 18.5z" />
      <path d="m11 10 2 2M8.5 12.5l2 2" />
    </g>
  ),
  scissors: (
    <g {...P}>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M20 4 8.1 15.9M14.5 14.5 20 20M8.1 8.1 12 12" />
    </g>
  ),
  scan: (
    <g {...P}>
      <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2" />
      <path d="M3 12h18" />
    </g>
  ),
  flask: (
    <g {...P}>
      <path d="M9 2v6.5L4.2 17A2 2 0 0 0 6 20h12a2 2 0 0 0 1.8-3L15 8.5V2" />
      <path d="M8 2h8M6.5 14h11" />
    </g>
  ),
  heart: (
    <g {...P}>
      <path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1l8.8 8.8 8.8-8.8a5 5 0 0 0 0-7.1z" />
    </g>
  ),
  shield: (
    <g {...P}>
      <path d="M12 22s8-4 8-10V5.5l-8-3-8 3V12c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </g>
  ),
  clock: (
    <g {...P}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </g>
  ),
  phone: (
    <g {...P}>
      <path d="M21.5 16.9v2.5a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 1.6 3.7 2 2 0 0 1 3.6 1.5h2.5a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.5 2.1l-1 1a16 16 0 0 0 6 6l1-1a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.7 2z" />
    </g>
  ),
  chat: (
    <g {...P}>
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.8-.9L3 20.5l1.5-5.2A8.4 8.4 0 0 1 3.6 11.5a8.4 8.4 0 0 1 8.4-8.4h.5A8.4 8.4 0 0 1 21 11z" />
    </g>
  ),
  instagram: (
    <g {...P}>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r=".8" fill="currentColor" />
    </g>
  ),
  mail: (
    <g {...P}>
      <rect x="2.5" y="4.5" width="19" height="15" rx="2.5" />
      <path d="m3 6.5 9 6.5 9-6.5" />
    </g>
  ),
  pin: (
    <g {...P}>
      <path d="M20 10.5c0 6-8 11.5-8 11.5S4 16.5 4 10.5a8 8 0 1 1 16 0z" />
      <circle cx="12" cy="10.5" r="2.8" />
    </g>
  ),
  arrow: (
    <g {...P} strokeWidth={1.7}>
      <path d="M4 12h16M14 6l6 6-6 6" />
    </g>
  ),
  'arrow-left': (
    <g {...P} strokeWidth={1.7}>
      <path d="M20 12H4M10 6l-6 6 6 6" />
    </g>
  ),
  calendar: (
    <g {...P}>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </g>
  ),
  check: (
    <g {...P} strokeWidth={1.8}>
      <path d="m4 12.5 5 5L20 6.5" />
    </g>
  ),
  plus: (
    <g {...P} strokeWidth={1.8}>
      <path d="M12 5v14M5 12h14" />
    </g>
  ),
  x: (
    <g {...P} strokeWidth={1.8}>
      <path d="M18 6 6 18M6 6l12 12" />
    </g>
  ),
  palette: (
    <g {...P}>
      <path d="M12 21a9 9 0 1 1 9-9c0 1.7-1.3 3-3 3h-1.8a2 2 0 0 0-1.4 3.4c.3.3.4.7.4 1.1 0 .8-.6 1.5-1.4 1.5z" />
      <circle cx="7.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="7.8" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="7.8" r="1.1" fill="currentColor" stroke="none" />
    </g>
  ),
  star: <path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.4l6.5-.9z" fill="currentColor" />,
  google: (
    <g fill="currentColor">
      <path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4z" opacity=".9" />
      <path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1a5.9 5.9 0 0 1-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" opacity=".7" />
      <path d="M6.4 14a6 6 0 0 1 0-3.8V7.6H3.1a10 10 0 0 0 0 8.9z" opacity=".5" />
      <path d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.6l3.3 2.6A5.9 5.9 0 0 1 12 5.9z" opacity=".85" />
    </g>
  ),
  user: (
    <g {...P}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </g>
  ),
  users: (
    <g {...P}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 21a6.5 6.5 0 0 1 13 0" />
      <path d="M16 5.2a3.5 3.5 0 0 1 0 5.6M18 14.5a6.5 6.5 0 0 1 3.5 5.8" />
    </g>
  ),
  bell: (
    <g {...P}>
      <path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7z" />
      <path d="M10.5 20a1.8 1.8 0 0 0 3 0" />
    </g>
  ),
  settings: (
    <g {...P}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 14a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V20a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 18.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
    </g>
  ),
  logout: (
    <g {...P}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </g>
  ),
  menü: (
    <g {...P} strokeWidth={1.8}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </g>
  ),
  search: (
    <g {...P}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </g>
  ),
  edit: (
    <g {...P}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
    </g>
  ),
  trash: (
    <g {...P}>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
    </g>
  ),
  chart: (
    <g {...P}>
      <path d="M3 3v18h18" />
      <path d="m7 14 3-4 3 3 5-7" />
    </g>
  ),
  file: (
    <g {...P}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h5" />
    </g>
  ),
  cpu: (
    <g {...P}>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4" />
    </g>
  ),
  activity: (
    <g {...P}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </g>
  ),
  smile: (
    <g {...P}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <path d="M9 9h.01M15 9h.01" />
    </g>
  ),
};

export type IconName = keyof typeof PATHS;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: string;
  size?: number;
}

export function Icon({ name, size = 18, className, ...rest }: IconProps) {
  const content = PATHS[name] ?? PATHS.paw;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      {content}
    </svg>
  );
}
