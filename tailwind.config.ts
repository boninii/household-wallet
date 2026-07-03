import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          950: '#0F141C',
          900: '#1F2937',
          800: '#2A3441',
          700: '#3B4654',
          600: '#4B5563'
        },
        text: {
          50: '#F3F4F6',
          100: '#E5E7EB',
          300: '#9CA3AF',
          500: '#6B7280'
        },
        brand: {
          DEFAULT: '#E8A95A',
          dark: '#C28A3B',
          light: '#F2C684'
        },
        positive: {
          DEFAULT: '#047857',
          soft: '#10B981'
        },
        negative: {
          DEFAULT: '#DC2626',
          soft: '#F87171'
        },
        category: {
          custos: '#3B82F6',
          conforto: '#22D3EE',
          metas: '#FACC15',
          prazeres: '#EC4899',
          liberdade: '#6366F1',
          conhecimento: '#F97316'
        }
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        xl: '0.875rem'
      },
      boxShadow: {
        card: '0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.25)'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
}

export default config
