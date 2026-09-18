/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        surface: {
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
          muted: 'var(--card-muted)'
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)'
        },
        border: {
          DEFAULT: 'var(--border)',
          subtle: 'var(--border-subtle)',
        },
        input: {
          DEFAULT: 'var(--input)',
          bg: 'var(--input-bg)',
        },
        ring: 'var(--ring)',
        smriti: {
          navy: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            400: '#94a3b8',
            500: '#64748b',
            600: '#475569',
            700: '#334155',
            800: '#1e293b',
            900: '#0f172a',
            950: '#020617',
          },
          teal: {
            50: '#f0fdfa',
            100: '#ccfbf1',
            200: '#99f6e4',
            300: '#5eead4',
            400: '#2dd4bf',
            500: '#14b8a6',
            600: '#0d9488',
            700: '#0f766e',
            800: '#115e59',
            900: '#134e4a',
            950: '#042f2e',
          },
          orange: {
            50: '#fff7ed',
            100: '#ffedd5',
            200: '#fed7aa',
            300: '#fdba74',
            400: '#fb923c',
            500: '#f97316',
            600: '#ea580c',
            700: '#c2410c',
            800: '#9a3412',
            900: '#7c2d12',
          },
          terracotta: {
            50: '#fdf4f2',
            100: '#fbe8e4',
            200: '#f7d5cd',
            300: '#f0b5a7',
            400: '#e48a76',
            500: '#d5644d',
            600: '#c04a33',
            700: '#a13b27',
            800: '#843323',
            900: '#6e2f22',
          },
          jade: {
            50: '#f0fdf4',
            100: '#dcfce7',
            200: '#bbf7d0',
            300: '#86efac',
            400: '#4ade80',
            500: '#22c55e',
            600: '#16a34a',
            700: '#15803d',
            800: '#166534',
            900: '#14532d',
          },
          coral: {
            50: '#fff1f2',
            100: '#ffe4e6',
            200: '#fecdd3',
            300: '#fda4af',
            400: '#fb7185',
            500: '#f43f5e',
            600: '#e11d48',
            700: '#be123c',
            800: '#9f1239',
            900: '#881337',
          },
          cream: '#FAF8F5',
          sand: '#F5F0E8',
          linen: '#F9F6F0',
          bark: '#1E1B18',
          forest: {
            DEFAULT: '#183C33',
            50: '#f2f8f6',
            100: '#e1efe9',
            200: '#c5ded4',
            300: '#9cc4b6',
            400: '#6ea494',
            500: '#4c8676',
            600: '#386a5d',
            700: '#2c534a',
            800: '#23423b',
            900: '#183c33',
            950: '#0c221c',
          },
          dark: {
            bg: '#081014',
            surface: '#0d181e',
            card: '#112028',
            border: '#1a2e38',
            accent: '#14b8a6',
          }
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Lora', 'Georgia', 'Cambria', 'serif'],
        display: ['Outfit', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        handwriting: ['Caveat', 'cursive'],
      },
      boxShadow: {
        'healthcare': '0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
        'healthcare-hover': '0 12px 30px -4px rgba(15, 23, 42, 0.1), 0 4px 12px -2px rgba(15, 23, 42, 0.06)',
        'elder': '0 8px 30px rgba(13, 148, 136, 0.16)',
        'elder-orange': '0 8px 30px rgba(234, 88, 12, 0.18)',
        'tactile': '0 6px 0 0 rgba(0, 0, 0, 0.15)',
        'tactile-teal': '0 5px 0 0 #0f766e',
        'tactile-orange': '0 5px 0 0 #c2410c',
        'tactile-active': '0 2px 0 0 rgba(0, 0, 0, 0.15)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      fontSize: {
        'elder-sm': ['1.125rem', { lineHeight: '1.75rem' }],   // 18px
        'elder-base': ['1.25rem', { lineHeight: '1.85rem' }],   // 20px
        'elder-lg': ['1.5rem', { lineHeight: '2.1rem' }],       // 24px
        'elder-xl': ['1.875rem', { lineHeight: '2.35rem' }],    // 30px
        'elder-2xl': ['2.25rem', { lineHeight: '2.75rem' }],    // 36px
        'elder-3xl': ['3rem', { lineHeight: '3.5rem' }],        // 48px
      },
      minHeight: {
        'tap': '56px',
        'tap-lg': '68px',
      }
    },
  },
  plugins: [],
}
