import React from 'react';

export type ButtonKind = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: ButtonKind;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconOnly?: boolean;
  active?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  kind = 'outline',
  size = 'md',
  icon,
  iconOnly = false,
  active = false,
  children,
  style,
  onMouseEnter,
  onMouseLeave,
  ...rest
}) => {
  const sizing = sizeMap[size];
  const palette = kindMap[kind];

  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    height: sizing.height,
    padding: iconOnly ? `0 ${sizing.iconPadding}` : `0 ${sizing.padX}`,
    minWidth: iconOnly ? sizing.height : undefined,
    fontSize: sizing.font,
    fontWeight: palette.weight,
    fontFamily: 'inherit',
    lineHeight: 1,
    cursor: rest.disabled ? 'not-allowed' : 'pointer',
    borderRadius: palette.radius,
    border: palette.border,
    backgroundColor: active && palette.activeBg ? palette.activeBg : palette.bg,
    color: active && palette.activeColor ? palette.activeColor : palette.color,
    textDecoration: palette.underline ? 'underline' : 'none',
    textUnderlineOffset: palette.underline ? '3px' : undefined,
    opacity: rest.disabled ? 0.45 : 1,
    transition: 'background-color 0.12s, color 0.12s, border-color 0.12s',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    ...style,
  };

  return (
    <button
      {...rest}
      style={base}
      onMouseEnter={e => {
        if (!rest.disabled && palette.hoverBg) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = palette.hoverBg;
        }
        if (!rest.disabled && palette.hoverColor) {
          (e.currentTarget as HTMLButtonElement).style.color = palette.hoverColor;
        }
        if (!rest.disabled && palette.hoverBorder) {
          (e.currentTarget as HTMLButtonElement).style.border = palette.hoverBorder;
        }
        onMouseEnter?.(e);
      }}
      onMouseLeave={e => {
        if (!rest.disabled) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor =
            active && palette.activeBg ? palette.activeBg : palette.bg;
          (e.currentTarget as HTMLButtonElement).style.color =
            active && palette.activeColor ? palette.activeColor : palette.color;
          (e.currentTarget as HTMLButtonElement).style.border = palette.border;
        }
        onMouseLeave?.(e);
      }}
    >
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      {!iconOnly && children}
    </button>
  );
};

const sizeMap = {
  sm: { height: '24px', padX: '12px', iconPadding: '0', font: '12px' },
  md: { height: '32px', padX: '18px', iconPadding: '0', font: '13px' },
} as const;

interface KindPalette {
  bg: string;
  color: string;
  border: string;
  radius: string;
  weight: number;
  underline?: boolean;
  hoverBg?: string;
  hoverColor?: string;
  hoverBorder?: string;
  activeBg?: string;
  activeColor?: string;
}

const kindMap: Record<ButtonKind, KindPalette> = {
  // Near-black pill — main action
  primary: {
    bg: 'var(--btn-primary-bg)',
    color: 'var(--btn-primary-fg)',
    border: '1px solid var(--btn-primary-bg)',
    radius: '9999px',
    weight: 500,
    hoverBg: 'var(--btn-primary-hover)',
    hoverBorder: '1px solid var(--btn-primary-hover)',
  },
  // Underlined text link — companion action
  secondary: {
    bg: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid transparent',
    radius: '9999px',
    weight: 500,
    underline: true,
    hoverColor: 'var(--accent-color)',
  },
  // Pill outlined — utility action (toolbars, filters)
  outline: {
    bg: 'transparent',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    radius: '9999px',
    weight: 500,
    hoverBg: 'var(--hover-bg)',
    hoverBorder: '1px solid var(--text-secondary)',
    activeBg: 'var(--btn-primary-bg)',
    activeColor: 'var(--btn-primary-fg)',
  },
  // Square small button — dense UI like toolbar
  ghost: {
    bg: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid transparent',
    radius: '6px',
    weight: 500,
    hoverBg: 'var(--hover-bg)',
    hoverColor: 'var(--text-primary)',
    activeBg: 'var(--hover-bg)',
    activeColor: 'var(--accent-color)',
  },
  // Underlined red text — destructive
  danger: {
    bg: 'transparent',
    color: '#b30000',
    border: '1px solid transparent',
    radius: '9999px',
    weight: 500,
    underline: true,
    hoverBg: 'rgba(179, 0, 0, 0.06)',
  },
};

export default Button;
