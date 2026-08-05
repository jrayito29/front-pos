import type { SVGProps } from 'react';

// Iconos propios, trazo consistente (1.75, redondeado) — no hay librería de iconos instalada en el
// proyecto (package.json) y CLAUDE.md exige diseño 100% custom sin librerías de UI de terceros.
// Mismo set validado visualmente en el wireframe interactivo de SPEC-008.
type IconProps = SVGProps<SVGSVGElement>;

const base: IconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function PanelIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

export function VentasIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
      <path d="M2.5 3h2.4l2.2 11.4a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L20.5 7H6" />
    </svg>
  );
}

export function CotizacionesIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M14 3v4h4" />
      <path d="M9 13h6M9 17h4" />
    </svg>
  );
}

export function InventarioIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 8l9-5 9 5-9 5-9-5z" />
      <path d="M3 8v9l9 5 9-5V8" />
      <path d="M12 13v9" />
    </svg>
  );
}

export function ProductosIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20.5 8.5L12 4 3.5 8.5 12 13l8.5-4.5z" />
      <path d="M3.5 8.5v7L12 20l8.5-4.5v-7" />
      <path d="M12 13v7" />
    </svg>
  );
}

export function AlmacenesIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 10l9-6 9 6v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9z" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

export function ClientesIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.8 19.5a6.2 6.2 0 0 1 12.4 0" />
      <path d="M16.5 5.5a3.2 3.2 0 0 1 0 6.2" />
      <path d="M18.5 13.8a6 6 0 0 1 3 5.2" />
    </svg>
  );
}

// Sub-ítem "Categorías" del grupo "Configuración" (navConfig.ts) — forma de etiqueta/tag, distinta
// del rombo de ProductosIcon para no confundirse visualmente en el sidebar.
export function CategoriasIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M11.5 3H5a2 2 0 0 0-2 2v6.5a2 2 0 0 0 .59 1.41l8.5 8.5a2 2 0 0 0 2.82 0l6.5-6.5a2 2 0 0 0 0-2.82l-8.5-8.5A2 2 0 0 0 11.5 3z" />
      <circle cx="8" cy="8" r="1.3" />
    </svg>
  );
}

// Ítem de grupo "Configuración" (navConfig.ts, NavGroupConfig) — engrane, mismo trazo base que el
// resto del set. Agrupación puramente visual del frontend, sin relación con `modulo.configuracion`
// del backend (SPEC-003, exclusivo superadmin).
export function ConfiguracionIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 13.5a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V19.5a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H4.5a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 6.1 8.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H10.5a1.65 1.65 0 0 0 1-1.51V2.5a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V8.5a1.65 1.65 0 0 0 1.51 1h.09a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export function EmpresasIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M3 21V6l7-3 7 3v15" />
      <path d="M14 21V10l7 3v8" />
      <path d="M7 9h.01M7 13h.01M7 17h.01" />
    </svg>
  );
}

export function PlanesIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 19l5-11 5 7 3-4 3 8H4z" />
    </svg>
  );
}

export function UsuariosIcon(props: IconProps) {
  return <ClientesIcon {...props} />;
}

export function AuditoriaIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" />
    </svg>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export function MenuToggleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20.2a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 9v4M12 17h.01M10.3 3.9L2.8 17a1.7 1.7 0 0 0 1.5 2.5h15.4a1.7 1.7 0 0 0 1.5-2.5L13.7 3.9a1.7 1.7 0 0 0-3 0z" />
    </svg>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 12l2 2 4-4" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}
