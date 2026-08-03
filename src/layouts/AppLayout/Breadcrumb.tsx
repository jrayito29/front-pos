import { useLocation } from 'react-router';
import { ChevronRightIcon } from './icons';
import type { NavItemConfig } from './navConfig';

interface BreadcrumbProps {
  items: NavItemConfig[];
}

// SPEC-008 REQ-E2 — recalculado dinámicamente a partir de la ruta activa (no un valor fijo por
// página). Hoy solo puebla un nivel (módulo actual) porque ninguna feature tiene subrutas todavía
// (constants/routes.ts) — el lookup por pathname es el punto de extensión para N niveles cuando
// existan, sin cambiar el mecanismo.
export function Breadcrumb({ items }: BreadcrumbProps) {
  const location = useLocation();
  const current = items.find((item) => item.to === location.pathname);

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13.5px] text-foreground-muted">
      <span className="whitespace-nowrap">Inicio</span>
      {current && (
        <>
          <ChevronRightIcon className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="whitespace-nowrap font-semibold text-foreground" aria-current="page">
            {current.label}
          </span>
        </>
      )}
    </nav>
  );
}
