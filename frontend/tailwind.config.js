/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          base: '#080D18',
          nav: '#0C1424',
          card: 'rgba(20, 34, 56, 0.72)',
          popover: '#111C30',
          border: 'rgba(148, 163, 184, 0.16)',
          hover: 'rgba(28, 48, 78, 0.82)',
        },
        aurora: {
          jade: '#2DD4BF',
          violet: '#A78BFA',
          cyan: '#67E8F9',
          amber: '#FBBF24',
          coral: '#FB7185',
        },
        slate: {
          100: '#F1F5F9',
          300: '#CBD5E1',
          400: '#9AA8BD',
          500: '#64748B',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
        glass: '16px',
      },
      boxShadow: {
        glass: '0 4px 24px -2px rgba(0, 0, 0, 0.45), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        'glass-hover': '0 8px 32px -2px rgba(0, 0, 0, 0.6), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
        'aurora-glow': '0 0 30px -5px rgba(45, 212, 191, 0.15)',
      }
    },
  },
  plugins: [],
}
