import type { SVGProps } from 'react';

// SPEC-001 (Design System) — ícono "+" compartido por todo botón primario de creación/alta en el
// proyecto (no exclusivo de una feature) — mismo ícono, mismo lugar, siempre.
export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
