/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // The two smallest steps sit one notch above Tailwind's defaults: Noto
      // Naskh closes up below 12px, and 300+ Arabic labels were set at 11px.
      // This used to be an override scoped to `.admin-shell`; it is now the
      // scale itself (docs/design-system.md §3.2).
      fontSize: {
        '2xs': ['0.75rem',   { lineHeight: '1.125rem' }],
        xs:    ['0.8125rem', { lineHeight: '1.25rem' }],
      },
      fontFamily: {
        arabic:  ['Noto Naskh Arabic', 'serif'],
        // Interface face (docs/design-system.md §3.1). Naskh stays for
        // headings and reading text.
        ui:      ['IBM Plex Sans Arabic', 'Noto Naskh Arabic', 'system-ui', 'sans-serif'],
        // Naskh behind the mono face: Arabic inside a mono run keeps its joins.
        mono:    ['JetBrains Mono', 'Noto Naskh Arabic', 'ui-monospace', 'monospace'],
      },
      // Wide tracking pulls joined Arabic letters apart, and these utilities
      // were used almost entirely on Arabic labels. Neutralised rather than
      // removed so the ~70 call sites keep compiling until they migrate;
      // `npm run lint:design` counts them.
      letterSpacing: {
        wide:    'normal',
        wider:   'normal',
        widest:  'normal',
      },
      // Semantic radii — named for what they round, so they never collide
      // with Tailwind's size-named defaults the existing code relies on.
      borderRadius: {
        chip:    '6px',
        control: '10px',
        card:    '14px',
        panel:   '20px',
      },
      // One stacking order, so layering stops being guesswork. Named for the
      // layer, never a raw number in a component.
      zIndex: {
        sticky:  '10',
        nav:     '20',
        popover: '30',
        modal:   '40',
        toast:   '50',
      },
      boxShadow: {
        overlay: 'var(--shadow-overlay)',
        lift:    'var(--shadow-lift)',
      },
      transitionDuration: {
        fast: '120ms',
        base: '200ms',
        slow: '400ms',
      },
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(.2, .8, .2, 1)',
      },
      colors: {
        // ── Semantic roles ───────────────────────────────────────────────────
        // The vocabulary new code uses (docs/design-system.md §2.1). Each one
        // resolves to a CSS variable in globals.css, which in turn points at a
        // ramp step, so a role follows the theme by itself. Roles carry their
        // own alpha where they need one, so opacity modifiers (`/50`) are not
        // supported on them — pick the role that means what you want instead.
        page:     'var(--surface-page)',
        raised:   'var(--surface-raised)',
        sunken:   'var(--surface-sunken)',
        overlay:  'var(--surface-overlay)',
        chrome:   'var(--surface-chrome)',
        hover:    'var(--surface-hover)',
        selected: 'var(--surface-selected)',
        scrim:    'var(--scrim)',
        fg: {
          strong:      'var(--fg-strong)',
          DEFAULT:     'var(--fg)',
          muted:       'var(--fg-muted)',
          subtle:      'var(--fg-subtle)',
          accent:      'var(--fg-accent)',
          'on-accent': 'var(--fg-on-accent)',
        },
        line: {
          DEFAULT: 'var(--line)',
          strong:  'var(--line-strong)',
          accent:  'var(--line-accent)',
        },
        accent: {
          DEFAULT: 'var(--accent-fill)',
          hover:   'var(--accent-fill-hover)',
          wash:    'var(--accent-wash)',
        },

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
