/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        arabic: ['Noto Naskh Arabic', 'serif'],
        display: ['Playfair Display', 'serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        sand: {
          50:  '#fdf8f0',
          100: '#faefd9',
          200: '#f4dba8',
          300: '#ecc26e',
          400: '#e4a83a',
          500: '#d4891e',
          600: '#b86c14',
          700: '#924f12',
          800: '#773f16',
          900: '#623516',
        },
        ink: {
          50:  '#f5f4f2',
          100: '#e8e6e1',
          200: '#d3cfc6',
          300: '#b7b0a3',
          400: '#978e7e',
          500: '#7d7366',
          600: '#665e52',
          700: '#534d44',
          800: '#46403a',
          900: '#1a1713',
          950: '#0e0c09',
        },
        ember: {
          400: '#f97316',
          500: '#ea6c0a',
          600: '#c2540a',
        }
      },
      animation: {
        'fade-up': 'fadeUp 0.7s ease forwards',
        'fade-in': 'fadeIn 0.5s ease forwards',
        'slide-right': 'slideRight 0.6s ease forwards',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
      },
    },
  },
  plugins: [],
};
