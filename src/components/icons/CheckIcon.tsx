import type { SVGProps } from 'react';

// SPEC-011 — feedback de "copiado" en UsuarioCreadoModal (reemplaza temporalmente a CopyIcon).
export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
