import type { CSSProperties } from 'react';

const paths = {
  cat: 'M4 9V3l5 3h6l5-3v6a9 9 0 1 1-16 0 M8 11h.01 M16 11h.01 M10 15l2 2 2-2 M1 13l5 1 M18 14l5-1',
  rabbit:
    'M8 10C2-2 10-2 11 10 M13 10C14-2 22-2 16 10 M12 22a7 7 0 1 0 0-14 7 7 0 0 0 0 14 M9 14h.01 M15 14h.01 M11 18h2',
  bolt: 'm13 2-9 12h7l-1 8 10-13h-7Z',
  gamepad: 'M6 6h12l4 13-5-3H7l-5 3Z M7 9v6 M4 12h6 M16 10h.01 M19 13h.01',
  key: 'M10 14a6 6 0 1 1 4-4L22 2 M17 7l3 3 M20 4l2 2',
  miniature: 'M8 3H3v5 M16 3h5v5 M21 16v5h-5 M8 21H3v-5 M9 9h6v6H9Z',
  search: 'm21 21-4.3-4.3 M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15',
  heart:
    'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',
  user: 'M20 21v-2a7 7 0 0 0-16 0v2 M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  chat: 'M21 11.5a9 9 0 0 1-9 9 10 10 0 0 1-4-.8L3 21l1.3-5a9 9 0 1 1 16.7-4.5Z',
  pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0 M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
  box: 'm12 3 9 5v9l-9 5-9-5V8l9-5 M3 8l9 5 9-5 M12 13v9 M7.5 5.5l9 5',
  grid: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  sparkle: 'm12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z',
  refresh: 'M20 7a9 9 0 1 0 1 9 M20 3v5h-5',
  close: 'm6 6 12 12 M6 18 18 6',
  arrow: 'M4 12h16 m-6-6 6 6-6 6',
  filter: 'M4 6h16 M4 12h16 M4 18h16 M8 3v6 M16 9v6 M10 15v6',
  sort: 'M7 3v18 m-4-4 4 4 4-4 M17 21V3 m-4 4 4-4 4 4',
  plus: 'M12 5v14 M5 12h14',
  minus: 'M5 12h14',
  target:
    'M12 3v3 M12 18v3 M3 12h3 M18 12h3 M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12 M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4',
  chevron: 'm9 5 7 7-7 7',
  camera: 'M3 7h4l2-3h6l2 3h4v14H3z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  check: 'm5 12 4 4L19 6',
  clock: 'M12 8v4l3 2 M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20',
  share: 'M12 16V3 m-4 4 4-4 4 4 M5 12v9h14v-9',
} as const;

export type IconName = keyof typeof paths;

export function Icon({
  name,
  size = 20,
  style,
}: {
  name: IconName;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      <path d={paths[name]} />
    </svg>
  );
}

export function Logo() {
  return (
    <svg
      width="26"
      height="28"
      viewBox="0 0 28 30"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M6 0h16v4h4v6h-6V6H8v18h12v-6h-5v-5h11v17h-5v-2H6v-4H2V6h4Z" />
      <path d="m13 9 1.8 3.5 3.9.6-2.8 2.7.6 3.9-3.5-1.8-3.5 1.8.6-3.9-2.8-2.7 3.9-.6Z" />
    </svg>
  );
}
