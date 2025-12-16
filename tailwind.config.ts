import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--accent-primary))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
      },
      fontSize: {
        display: [
          'var(--text-display)',
          {
            lineHeight: 'var(--text-display-line-height)',
            fontWeight: 'var(--text-display-weight)',
          },
        ],
        h1: [
          'var(--text-h1)',
          { lineHeight: 'var(--text-h1-line-height)', fontWeight: 'var(--text-h1-weight)' },
        ],
        h2: [
          'var(--text-h2)',
          { lineHeight: 'var(--text-h2-line-height)', fontWeight: 'var(--text-h2-weight)' },
        ],
        h3: [
          'var(--text-h3)',
          { lineHeight: 'var(--text-h3-line-height)', fontWeight: 'var(--text-h3-weight)' },
        ],
        h4: [
          'var(--text-h4)',
          { lineHeight: 'var(--text-h4-line-height)', fontWeight: 'var(--text-h4-weight)' },
        ],
        body: [
          'var(--text-body)',
          { lineHeight: 'var(--text-body-line-height)', fontWeight: 'var(--text-body-weight)' },
        ],
        'body-lg': [
          'var(--text-body-lg)',
          {
            lineHeight: 'var(--text-body-lg-line-height)',
            fontWeight: 'var(--text-body-lg-weight)',
          },
        ],
        'body-sm': [
          'var(--text-body-sm)',
          {
            lineHeight: 'var(--text-body-sm-line-height)',
            fontWeight: 'var(--text-body-sm-weight)',
          },
        ],
        caption: [
          'var(--text-caption)',
          {
            lineHeight: 'var(--text-caption-line-height)',
            fontWeight: 'var(--text-caption-weight)',
          },
        ],
      },
      spacing: {
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        5: 'var(--space-5)',
        6: 'var(--space-6)',
        8: 'var(--space-8)',
        10: 'var(--space-10)',
        12: 'var(--space-12)',
        16: 'var(--space-16)',
        20: 'var(--space-20)',
        24: 'var(--space-24)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        popover: 'var(--shadow-popover)',
        modal: 'var(--shadow-modal)',
      },
    },
  },
  plugins: [],
};

export default config;
