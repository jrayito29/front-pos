import type { SVGProps } from 'react';

// Mismo trazo que PlusIcon/SaveIcon (viewBox 24, stroke 2, extremos redondeados) — candado compartido
// por cualquier acción bloqueada por permiso en el proyecto (no exclusivo de una feature).
export function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}
