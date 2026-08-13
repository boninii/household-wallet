import type { Config } from 'tailwindcss'

// Cores via CSS variables (definidas em app/globals.css por tema claro/escuro).
// Cada variável guarda os canais "R G B" para permitir o modificador de opacidade
// do Tailwind (ex.: bg-bg-900/60).
function token(name: string) {
  return `rgb(var(${name}) / <alpha-value>)`
}

const config: Config = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          950: token('--bg-950'),
          900: token('--bg-900'),
          800: token('--bg-800'),
          700: token('--bg-700'),
          600: token('--bg-600')
        },
        text: {
          50: token('--text-50'),
          100: token('--text-100'),
          300: token('--text-300'),
          500: token('--text-500')
        },
        brand: {
          DEFAULT: token('--brand'),
          dark: token('--brand-dark'),
          light: token('--brand-light'),
          ink: token('--brand-ink')
        },
        positive: {
          DEFAULT: token('--positive'),
          soft: token('--positive-soft')
        },
        negative: {
          DEFAULT: token('--negative'),
          soft: token('--negative-soft')
        },
        // Cores de dados (donut, dots) — iguais nos dois temas.
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
        card: 'var(--shadow-card)'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
}

export default config
