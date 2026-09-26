export type MyPageIconName =
  | 'bell'
  | 'chevron'
  | 'exchange'
  | 'heart'
  | 'location'
  | 'logout'
  | 'privacy'
  | 'store'
  | 'support';

export interface MyPageIconProps {
  name: MyPageIconName;
  size?: number;
}

export function MyPageIcon({ name, size = 22 }: MyPageIconProps) {
  const commonProps = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    'aria-hidden': true,
  } as const;

  if (name === 'heart') {
    return (
      <svg {...commonProps}>
        <path
          d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === 'store') {
    return (
      <svg {...commonProps}>
        <path
          d="M4 10v10h16V10M3 10l2-6h14l2 6M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M9 20v-6h6v6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === 'exchange') {
    return (
      <svg {...commonProps}>
        <path
          d="m7 7-3 3 3 3M4 10h13a3 3 0 0 1 3 3v1M17 17l3-3-3-3M20 14H7a3 3 0 0 1-3-3v-1"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === 'location') {
    return (
      <svg {...commonProps}>
        <path
          d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx="12"
          cy="10"
          r="2.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    );
  }

  if (name === 'bell') {
    return (
      <svg {...commonProps}>
        <path
          d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === 'privacy') {
    return (
      <svg {...commonProps}>
        <path
          d="M12 3 5 6v5c0 4.6 2.8 8.2 7 10 4.2-1.8 7-5.4 7-10V6l-7-3Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }

  if (name === 'support') {
    return (
      <svg {...commonProps}>
        <path
          d="M20 11.5a8 8 0 0 1-8.5 8L7 21l1.1-3.3A8 8 0 1 1 20 11.5Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === 'logout') {
    return (
      <svg {...commonProps}>
        <path
          d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path
        d="m9 18 6-6-6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
