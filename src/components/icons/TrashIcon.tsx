import type { SVGProps } from 'react';

// Mismo trazo que PlusIcon/SaveIcon/LockIcon (viewBox 24, stroke 2, extremos redondeados) — usado por
// cualquier acción destructiva del proyecto (no exclusivo de una feature).
export function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 7h16" />
      <path d="M9 7V4h6v3" />
      <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}
