import type { Config } from 'tailwindcss'

/**
 * Tokens de color mapeados a las CSS variables de src/brand.css.
 * Al referenciar var(--...) en vez de hex fijos, cualquier clase de Tailwind
 * (bg-*, text-*, border-*) responde automáticamente al cambio de tema via
 * el atributo [data-theme] en la raíz, sin necesitar el prefijo `dark:`.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
        },
        foreground: {
          DEFAULT: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
        },
        brand: {
          green: {
            DEFAULT: 'var(--brand-green)',
            hover: 'var(--brand-green-hover)',
            bg: 'var(--brand-green-bg)',
            text: 'var(--brand-green-text)',
          },
          coral: {
            DEFAULT: 'var(--brand-coral)',
            hover: 'var(--brand-coral-hover)',
            bg: 'var(--brand-coral-bg)',
            text: 'var(--brand-coral-text)',
          },
          purple: {
            DEFAULT: 'var(--brand-purple)',
            bg: 'var(--brand-purple-bg)',
            text: 'var(--brand-purple-text)',
          },
        },
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
      },
      transitionTimingFunction: {
        // SPEC-002 REQ-S6 — easing de entrada para transiciones de contenido (crossfade login/registro).
        // cubic-bezier con más "punch" que el ease-out nativo de CSS (ver emil-design-eng).
        'out-strong': 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config
