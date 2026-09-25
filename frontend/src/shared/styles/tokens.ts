const colorValue = {
  text: '#242122',
  textMuted: '#696466',
  textSubtle: '#9a9395',
  border: '#e8e6e3',
  borderSubtle: '#f0eeec',
  surface: '#ffffff',
  surfaceMuted: '#faf9f8',
  primary: '#d93b54',
  primaryHover: '#c73149',
  primarySoft: '#fff1f3',
} as const;

export const color = {
  text: 'var(--color-text)',
  textMuted: 'var(--color-text-muted)',
  textSubtle: 'var(--color-text-subtle)',
  border: 'var(--color-border)',
  borderSubtle: 'var(--color-border-subtle)',
  surface: 'var(--color-surface)',
  surfaceMuted: 'var(--color-surface-muted)',
  primary: 'var(--color-primary)',
  primaryHover: 'var(--color-primary-hover)',
  primarySoft: 'var(--color-primary-soft)',
} as const;

export const colorVariables = {
  '--color-text': colorValue.text,
  '--color-text-muted': colorValue.textMuted,
  '--color-text-subtle': colorValue.textSubtle,
  '--color-border': colorValue.border,
  '--color-border-subtle': colorValue.borderSubtle,
  '--color-surface': colorValue.surface,
  '--color-surface-muted': colorValue.surfaceMuted,
  '--color-primary': colorValue.primary,
  '--color-primary-hover': colorValue.primaryHover,
  '--color-primary-soft': colorValue.primarySoft,
} as const;

export const brandColor = {
  instagram:
    'linear-gradient(45deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)',
  kakao: '#fee500',
  kakaoInk: '#251c1c',
} as const;

export const alpha = (token: string, percent: number) =>
  `color-mix(in srgb, ${token} ${percent}%, transparent)`;

export const fontSize = {
  caption: '12px',
  label: '13px',
  bodySmall: '14px',
  body: '15px',
  subheading: '17px',
  sectionTitle: '20px',
  detailTitle: '22px',
  pageTitle: 'clamp(24px, 4vw, 34px)',
  display: 'clamp(28px, 3vw, 40px)',
} as const;

export const fontWeight = {
  regular: 400,
  medium: 600,
  bold: 700,
  extraBold: 800,
} as const;

export const lineHeight = {
  tight: 1.2,
  heading: 1.3,
  body: 1.5,
  relaxed: 1.6,
} as const;

export const letterSpacing = {
  title: '-0.04em',
  heading: '-0.025em',
  normal: '0',
  label: '0.04em',
} as const;

export const space = {
  xxs: '4px',
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '20px',
  xl: '24px',
  xxl: '32px',
  xxxl: '40px',
  huge: '48px',
} as const;

export const radius = {
  small: '8px',
  control: '12px',
  card: '16px',
  dialog: '22px',
  sheet: '24px',
  pill: '999px',
  circle: '50%',
} as const;

export const shadow = {
  float: '0 6px 18px rgb(0 0 0 / 10%)',
  card: '0 8px 24px rgb(36 33 34 / 10%)',
  dialog: '0 24px 80px rgb(36 33 34 / 22%)',
} as const;

export const focusRing = `0 0 0 3px ${alpha(color.primary, 22)}`;

export const breakpoint = {
  compact: '520px',
  mobile: '767px',
  tablet: '900px',
  wide: '1080px',
} as const;

export const layout = {
  contentMaxWidth: '1280px',
} as const;

export const motion = {
  fast: '160ms',
  normal: '240ms',
  loading: '1350ms',
} as const;

export const zIndex = {
  header: 40,
  overlay: 100,
} as const;
