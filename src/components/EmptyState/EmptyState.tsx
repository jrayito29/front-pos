import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

// Componente genérico para estados vacíos y de error (CLAUDE.md §8 — todo componente que consuma
// datos remotos maneja loading/error/empty explícitamente). Reutilizable: SPEC-009 lo usa en tres
// variantes distintas (sin productos, sin resultados de filtro, error de red — REQ-X1/X2/X3), cada
// una con su propio `title`/`description`/`action`, nunca el mismo mensaje genérico para las tres.
export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      {icon}
      <p className="text-base font-medium text-foreground">{title}</p>
      {description && <p className="max-w-sm text-sm text-foreground-secondary">{description}</p>}
      {action}
    </div>
  );
}
