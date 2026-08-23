/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0A0C11',
        canvas: '#0B0D12',
        surface: '#12151C',
        raised: '#171B24',
        line: '#242938',
        'line-soft': '#1B2029',
        fg: {
          hi: '#EDEFF3',
          mid: '#9AA1B2',
          low: '#5B6274'
        },
        primary: {
          DEFAULT: '#12151C',
          light: '#171B24',
          dark: '#0A0C11'
        },
        brass: {
          DEFAULT: '#C6A15B',
          light: '#DDBE84',
          dark: '#8F7238',
          glow: 'rgba(198,161,91,0.16)'
        },
        accent: {
          DEFAULT: '#2BB3A3',
          light: '#5FD1C4',
          dark: '#1D8578'
        },
        danger: '#E1596A',
        amber: '#E3A23C',
        success: '#2BB3A3'
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      boxShadow: {
        card: '0 1px 0 rgba(255,255,255,0.02) inset, 0 12px 28px -16px rgba(0,0,0,0.6)',
        pop: '0 24px 52px -16px rgba(0,0,0,0.7)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        brass: '0 0 0 1px rgba(198,161,91,0.25), 0 8px 24px -8px rgba(198,161,91,0.25)'
      },
      borderRadius: {
        xl2: '1.25rem'
      },
      backgroundImage: {
        'grid-fade': 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
        'brass-fade': 'linear-gradient(180deg, rgba(198,161,91,0.5) 0%, rgba(198,161,91,0) 100%)'
      }
    }
  },
  plugins: []
}
