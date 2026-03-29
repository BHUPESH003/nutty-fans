import type { Config } from 'tailwindcss';

const colorVar = (variableName: string) => `hsl(var(${variableName}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: colorVar('--primary'),
          foreground: colorVar('--primary-foreground'),
        },
        'primary-container': colorVar('--primary-container'),
        'on-primary': colorVar('--on-primary'),
        'on-primary-container': colorVar('--on-primary-container'),
        'primary-fixed': colorVar('--primary-fixed'),
        'primary-fixed-dim': colorVar('--primary-fixed-dim'),
        'on-primary-fixed': colorVar('--on-primary-fixed'),
        'on-primary-fixed-variant': colorVar('--on-primary-fixed-variant'),
        'inverse-primary': colorVar('--inverse-primary'),

        secondary: {
          DEFAULT: colorVar('--secondary'),
          foreground: colorVar('--secondary-foreground'),
        },
        'secondary-container': colorVar('--secondary-container'),
        'on-secondary': colorVar('--on-secondary'),
        'on-secondary-container': colorVar('--on-secondary-container'),
        'secondary-fixed': colorVar('--secondary-fixed'),
        'secondary-fixed-dim': colorVar('--secondary-fixed-dim'),
        'on-secondary-fixed': colorVar('--on-secondary-fixed'),
        'on-secondary-fixed-variant': colorVar('--on-secondary-fixed-variant'),

        tertiary: colorVar('--tertiary'),
        'tertiary-container': colorVar('--tertiary-container'),
        'on-tertiary': colorVar('--on-tertiary'),
        'on-tertiary-container': colorVar('--on-tertiary-container'),
        'tertiary-fixed': colorVar('--tertiary-fixed'),
        'tertiary-fixed-dim': colorVar('--tertiary-fixed-dim'),
        'on-tertiary-fixed': colorVar('--on-tertiary-fixed'),
        'on-tertiary-fixed-variant': colorVar('--on-tertiary-fixed-variant'),

        background: colorVar('--background'),
        foreground: colorVar('--foreground'),
        'on-background': colorVar('--on-background'),
        surface: colorVar('--surface'),
        'surface-dim': colorVar('--surface-dim'),
        'surface-bright': colorVar('--surface-bright'),
        'surface-tint': colorVar('--surface-tint'),
        'surface-variant': colorVar('--surface-variant'),
        'surface-container-lowest': colorVar('--surface-container-lowest'),
        'surface-container-low': colorVar('--surface-container-low'),
        'surface-container': colorVar('--surface-container'),
        'surface-container-high': colorVar('--surface-container-high'),
        'surface-container-highest': colorVar('--surface-container-highest'),
        'on-surface': colorVar('--on-surface'),
        'on-surface-variant': colorVar('--on-surface-variant'),
        'inverse-surface': colorVar('--inverse-surface'),
        'inverse-on-surface': colorVar('--inverse-on-surface'),

        outline: colorVar('--outline'),
        'outline-variant': colorVar('--outline-variant'),

        error: colorVar('--error'),
        'error-container': colorVar('--error-container'),
        'on-error': colorVar('--on-error'),
        'on-error-container': colorVar('--on-error-container'),
        destructive: {
          DEFAULT: colorVar('--error'),
          foreground: colorVar('--on-error'),
        },

        card: {
          DEFAULT: colorVar('--card'),
          foreground: colorVar('--card-foreground'),
        },
        muted: {
          DEFAULT: colorVar('--muted'),
          foreground: colorVar('--muted-foreground'),
        },
        accent: {
          DEFAULT: colorVar('--accent'),
          foreground: colorVar('--accent-foreground'),
        },
        border: colorVar('--border'),
        input: colorVar('--input'),
        ring: colorVar('--ring'),
        popover: {
          DEFAULT: colorVar('--popover'),
          foreground: colorVar('--popover-foreground'),
        },
      },
      fontFamily: {
        sans: ['var(--font-body)', 'Inter', 'sans-serif'],
        body: ['var(--font-body)', 'Inter', 'sans-serif'],
        headline: ['var(--font-headline)', 'Plus Jakarta Sans', 'sans-serif'],
        label: ['var(--font-body)', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '1rem',
        sm: '0.5rem',
        md: '0.75rem',
        lg: '2rem',
        xl: '3rem',
        full: '9999px',
      },
      boxShadow: {
        ambient: '0 12px 36px rgba(233, 30, 99, 0.18)',
        card: '0 2px 18px rgba(15, 23, 42, 0.08)',
        modal: '0 24px 80px rgba(15, 23, 42, 0.16)',
        glow: '0 0 0 3px rgba(233, 30, 99, 0.28)',
        popover: '0 18px 64px rgba(15, 23, 42, 0.18)',
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px',
        20: '80px',
        24: '96px',
      },
      fontSize: {
        h3: ['1.5rem', { lineHeight: '1.35', fontWeight: '700' }],
        h4: ['1.125rem', { lineHeight: '1.5', fontWeight: '600' }],
      },
    },
  },
  plugins: [],
};

export default config;
