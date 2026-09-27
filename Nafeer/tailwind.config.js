/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontSize: {
        '2xs': ['11px', { lineHeight: '1rem' }],
      },
      fontFamily: {
        arabic:  ['Noto Naskh Arabic', 'serif'],
        display: ['Playfair Display', 'serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // ── Theme-aware scales ───────────────────────────────────────────────
        // Backed by CSS variables defined in src/app/globals.css, which
        // redefines both ramps under :root[data-theme="light"]. The
        // `<alpha-value>` placeholder keeps opacity modifiers working, so
        // `bg-ink-900/20` and `border-sand-700/50` behave exactly as before.
        //
        // This indirection is what makes the ~900 existing `ink-*`/`sand-*`
        // usages across the editor respond to the theme without editing them.
        sand: {
          50:  'rgb(var(--sand-50)  / <alpha-value>)',
          100: 'rgb(var(--sand-100) / <alpha-value>)',
          200: 'rgb(var(--sand-200) / <alpha-value>)',
          300: 'rgb(var(--sand-300) / <alpha-value>)',
          400: 'rgb(var(--sand-400) / <alpha-value>)',
          500: 'rgb(var(--sand-500) / <alpha-value>)',
          600: 'rgb(var(--sand-600) / <alpha-value>)',
          700: 'rgb(var(--sand-700) / <alpha-value>)',
          800: 'rgb(var(--sand-800) / <alpha-value>)',
          900: 'rgb(var(--sand-900) / <alpha-value>)',
        },
        ink: {
          50:  'rgb(var(--ink-50)  / <alpha-value>)',
          100: 'rgb(var(--ink-100) / <alpha-value>)',
          200: 'rgb(var(--ink-200) / <alpha-value>)',
          300: 'rgb(var(--ink-300) / <alpha-value>)',
          400: 'rgb(var(--ink-400) / <alpha-value>)',
          500: 'rgb(var(--ink-500) / <alpha-value>)',
          600: 'rgb(var(--ink-600) / <alpha-value>)',
          700: 'rgb(var(--ink-700) / <alpha-value>)',
          800: 'rgb(var(--ink-800) / <alpha-value>)',
          900: 'rgb(var(--ink-900) / <alpha-value>)',
          950: 'rgb(var(--ink-950) / <alpha-value>)',
        },
        // ── Status palette ───────────────────────────────────────────────────
        // Replaces raw Tailwind emerald/amber/red/blue/purple for anything that
        // conveys state. Those have no light-theme variant, so status badges
        // rendered as bright-on-bright on the cream page (the literary track
        // badge measured 1.11:1). No <alpha-value> here — these already carry
        // their own alpha where needed.
        success: {
          DEFAULT: 'var(--success)',
          surface: 'var(--success-surface)',
          border:  'var(--success-border)',
        },
        warn: {
          DEFAULT: 'var(--warn)',
          surface: 'var(--warn-surface)',
          border:  'var(--warn-border)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          surface: 'var(--danger-surface)',
          border:  'var(--danger-border)',
        },
        info: {
          DEFAULT: 'var(--info)',
          surface: 'var(--info-surface)',
          border:  'var(--info-border)',
        },
        special: {
          DEFAULT: 'var(--special)',
          surface: 'var(--special-surface)',
          border:  'var(--special-border)',
        },
        ember: {
          400: '#f97316',
          500: '#ea6c0a',
          600: '#c2540a',
        },
      },
      screens: {
        xs: '375px',
      },
      animation: {
        'fade-up':    'fadeUp 0.7s ease forwards',
        'fade-in':    'fadeIn 0.5s ease forwards',
        'slide-right':'slideRight 0.6s ease forwards',
        'float':      'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideRight: {
          '0%':   { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
      },
    },
  },
  plugins: [],
};
