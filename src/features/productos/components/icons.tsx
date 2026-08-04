import type { SVGProps } from 'react';

// SPEC-009 REQ-U43 — ícono "+" compartido por todos los botones equivalentes de creación
// ("Nuevo producto"/"Crear producto", listado) — mismo ícono, mismo lugar, siempre.
export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

// SPEC-009 REQ-U47 — disco de guardar, compartido por todos los botones "Guardar" equivalentes
// (Crear, Información general, Ajustar costo) — distinto de PlusIcon: "guardar" no es "crear".
export function SaveIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M17 21v-8H7v8" />
      <path d="M7 3v5h8" />
    </svg>
  );
}
