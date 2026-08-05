import { Link, useLocation } from 'react-router';
import { ChevronRightIcon } from './icons';
import { useBreadcrumbStore } from '../../stores/breadcrumb.store';
import type { NavItemConfig } from './navConfig';

interface BreadcrumbProps {
  items: NavItemConfig[];
}

// SPEC-008 REQ-E2 — recalculado dinámicamente a partir de la ruta activa (no un valor fijo por
// página). Match por prefijo (adenda, mismo criterio que Nav.tsx REQ-U14): un módulo con subrutas
// (ej. Productos: /productos/nuevo, /productos/:id) debe seguir mostrando su nivel en el breadcrumb
// mientras se navega dentro de él, no solo en la ruta exacta del ítem de menú. Segundo nivel (ej.
// "Nuevo producto", el nombre del producto) vía `useBreadcrumbStore` (ver hooks/useBreadcrumbExtra) —
// cuando existe, el primer nivel se vuelve un `Link` de regreso al listado del módulo (`back-behavior`,
// `breadcrumb-web` — ui-ux-pro-max §9).
export function Breadcrumb({ items }: BreadcrumbProps) {
  const location = useLocation();
  const extra = useBreadcrumbStore((state) => state.extra);
  const current = items.find((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`));

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13.5px] text-foreground-muted">
      <span className="whitespace-nowrap">Inicio</span>
      {current && (
        <>
          <ChevronRightIcon className="h-3.5 w-3.5 flex-shrink-0" />
          {extra ? (
            <Link
              to={current.to}
              className="whitespace-nowrap text-foreground-muted transition-colors duration-150 hover:text-foreground hover:underline"
            >
              {current.label}
            </Link>
          ) : (
            <span className="whitespace-nowrap font-semibold text-foreground" aria-current="page">
              {current.label}
            </span>
          )}
        </>
      )}
      {extra && (
        <>
          <ChevronRightIcon className="h-3.5 w-3.5 flex-shrink-0" />
          <span
            className="max-w-[240px] truncate whitespace-nowrap font-semibold text-foreground"
            aria-current="page"
            title={extra}
          >
            {extra}
          </span>
        </>
      )}
    </nav>
  );
}
