import type { SVGProps } from 'react';
import { TIPO_PRODUCTO, TIPO_LABEL, type TipoProductoDomain } from '../constants/producto.constants';

// SPEC-009 REQ-U14/U34 — mismo trazo que layouts/AppLayout/icons.tsx (viewBox 24x24, stroke 1.75,
// extremos redondeados); no hay librería de íconos instalada (CLAUDE.md exige diseño 100% custom).
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function FisicoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3 3 7.5 12 12l9-4.5L12 3Z" />
      <path d="M3 7.5V16l9 4.5 9-4.5V7.5" />
      <path d="M12 12v8.5" />
    </svg>
  );
}

function ServicioIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base} {...props}>
      <path d="M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 1 5.4-5.4L14.7 12l-3-3 3-2.7Z" />
    </svg>
  );
}

interface TipoIconProps {
  tipo: TipoProductoDomain;
  className?: string;
}

// REQ-U14 — el ícono lleva `aria-label` propio (nunca decorativo sin texto alternativo); el
// consumidor decide si además muestra la palabra completa (REQ-U34, header de Ver/Editar).
export function TipoIcon({ tipo, className = 'h-4 w-4' }: TipoIconProps) {
  const Icon = tipo === TIPO_PRODUCTO.FISICO ? FisicoIcon : ServicioIcon;
  return <Icon className={className} role="img" aria-label={TIPO_LABEL[tipo]} />;
}
