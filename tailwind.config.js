/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F7F5EF',
        ink: '#132A1F',
        forest: {
          50: '#EAF3EE',
          100: '#CFE5D8',
          300: '#7FB89A',
          500: '#2E8259',
          600: '#1E6B45',
          700: '#0F5132',
          900: '#0A3A24',
        },
        gold: {
          100: '#F4E8CB',
          300: '#DEBD73',
          500: '#C89B3C',
          700: '#96712A',
        },
        teal: {
          500: '#0E7C86',
          700: '#0A5C64',
        },
        amber: {
          500: '#B45309',
          100: '#FBE8D2',
        },
        rust: {
          500: '#A83C2E',
          100: '#F7DFDA',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      backgroundImage: {
        'stamp-lines': 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(19,42,31,0.04) 3px, rgba(19,42,31,0.04) 4px)',
      },
      boxShadow: {
        card: '0 1px 2px rgba(19,42,31,0.06), 0 4px 14px rgba(19,42,31,0.06)',
        stamp: 'inset 0 0 0 1.5px currentColor',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
}
