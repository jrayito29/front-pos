import type { ReactNode } from 'react';

type BadgeTone = 'green' | 'coral' | 'purple' | 'neutral';

interface BadgeProps {
  tone: BadgeTone;
  children: ReactNode;
  icon?: ReactNode;
}

const TONE_STYLES: Record<BadgeTone, string> = {
  green: 'bg-brand-green-bg text-brand-green-text',
  coral: 'bg-brand-coral-bg text-brand-coral-text',
  purple: 'bg-brand-purple-bg text-brand-purple-text',
  neutral: 'bg-background-tertiary text-foreground-secondary',
};

// Componente genérico de estado puntual (badge) — combina color y texto siempre (regla
// `color-not-only`, nunca solo un punto de color). Reutilizable por cualquier feature con estados
// de negocio (SPEC-009 REQ-U16, estado de producto).
export function Badge({ tone, children, icon }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${TONE_STYLES[tone]}`}
    >
      {icon}
      {children}
    </span>
  );
}
