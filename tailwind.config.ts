import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Primary — Deep Rose
        primary: {
          DEFAULT: '#ba0048',
          foreground: '#ffffff',
        },
        'primary-container': '#e0245e',
        'on-primary': '#ffffff',
        'on-primary-container': '#fffeff',
        'primary-fixed': '#ffd9dd',
        'primary-fixed-dim': '#ffb2bd',
        'on-primary-fixed': '#400013',
        'on-primary-fixed-variant': '#900036',
        'inverse-primary': '#ffb2bd',

        // Secondary — Sky Blue
        secondary: {
          DEFAULT: '#006399',
          foreground: '#ffffff',
        },
        'secondary-container': '#35adff',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#003f63',
        'secondary-fixed': '#cde5ff',
        'secondary-fixed-dim': '#95ccff',
        'on-secondary-fixed': '#001d32',
        'on-secondary-fixed-variant': '#004a75',

        // Tertiary — Crimson
        tertiary: '#bc002d',
        'tertiary-container': '#eb003b',
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#fffeff',
        'tertiary-fixed': '#ffdad9',
        'tertiary-fixed-dim': '#ffb3b3',
        'on-tertiary-fixed': '#400009',
        'on-tertiary-fixed-variant': '#920021',

        // Surface & Background
        background: '#fbf8ff',
        foreground: '#1b1b20',
        'on-background': '#1b1b20',
        surface: '#fbf8ff',
        'surface-dim': '#dcd9e0',
        'surface-bright': '#fbf8ff',
        'surface-tint': '#bd0049',
        'surface-variant': '#e4e1e9',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f6f2fa',
        'surface-container': '#f0ecf4',
        'surface-container-high': '#eae7ee',
        'surface-container-highest': '#e4e1e9',
        'on-surface': '#1b1b20',
        'on-surface-variant': '#5b4043',
        'inverse-surface': '#303035',
        'inverse-on-surface': '#f3eff7',

        // Outline
        outline: '#8f6f73',
        'outline-variant': '#e3bdc1',

        // Error
        error: '#ba1a1a',
        'error-container': '#ffdad6',
        'on-error': '#ffffff',
        'on-error-container': '#93000a',
        destructive: {
          DEFAULT: '#ba1a1a',
          foreground: '#ffffff',
        },

        // shadcn compatibility
        card: {
          DEFAULT: '#ffffff',
          foreground: '#1b1b20',
        },
        muted: {
          DEFAULT: '#f0ecf4',
          foreground: '#5b4043',
        },
        accent: {
          DEFAULT: '#f0ecf4',
          foreground: '#1b1b20',
        },
        border: '#e4e1e9',
        input: '#e4e1e9',
        ring: '#ffd9dd',
        popover: {
          DEFAULT: '#ffffff',
          foreground: '#1b1b20',
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
        ambient: '0 8px 32px rgba(186, 0, 72, 0.08)',
        card: '0 2px 16px rgba(27, 27, 32, 0.06)',
        modal: '0 16px 64px rgba(27, 27, 32, 0.12)',
        glow: '0 0 0 3px rgba(255, 217, 221, 0.6)',
        popover: '0 16px 64px rgba(27, 27, 32, 0.12)',
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
