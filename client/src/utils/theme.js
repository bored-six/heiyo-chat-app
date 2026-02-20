// Design tokens — single source of truth for the premium glass palette.
// Import and use these in components rather than inlining raw hex strings.

export const C = {
  bg:      '#0D0D0D',
  cyan:    '#00E5FF',
  violet:  '#7B2FBE',
  magenta: '#FF3AF2',
  yellow:  '#FFE600',
  orange:  '#FF6B35',
};

export const glass = {
  bg:      'rgba(13,13,13,0.72)',
  bgLt:    'rgba(13,13,13,0.55)',
  bgHvy:   'rgba(13,13,13,0.92)',
  border:  '1px solid rgba(255,255,255,0.10)',
  borderDim: '1px solid rgba(255,255,255,0.07)',
  blur:    'blur(16px)',
  inset:   'inset 0 1px 0 rgba(255,255,255,0.08)',
};

/** Returns an inline-style object for a frosted-glass surface. */
export function glassSurface({ opacity = 0.72, shadow = '' } = {}) {
  const base = {
    background: `rgba(13,13,13,${opacity})`,
    backdropFilter: glass.blur,
    WebkitBackdropFilter: glass.blur,
    border: glass.border,
    boxShadow: [glass.inset, shadow].filter(Boolean).join(', '),
  };
  return base;
}
