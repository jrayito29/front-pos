import { useEffect } from 'react';
import { useUiStore } from '../../stores/ui.store';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ContentArea } from './ContentArea';
import type { NavItemConfig } from './navConfig';

interface ShellProps {
  navItems: NavItemConfig[];
  navAriaLabel: string;
  navLoading?: boolean;
  role: string | undefined;
  nombre?: string;
  logoUrl?: string;
  companyName?: string;
}

// SPEC-008 REQ-U1 — estructura visual compartida (sidebar + topbar + contenido) por ambos
// contextos. `TenantChrome`/`SysadminChrome` deciden qué nav/rol le pasan; este componente no sabe
// nada de permisos ni de sesión.
export function Shell({ navItems, navAriaLabel, navLoading, role, nombre, logoUrl, companyName }: ShellProps) {
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const theme = useUiStore((state) => state.theme);

  // SPEC-008 REQ-E6 — el cambio de tema actualiza `data-theme` en la raíz del documento; el resto
  // del sistema de color ya responde a ese atributo vía las CSS variables de brand.css.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <div className="flex min-h-dvh bg-background-secondary">
      <Sidebar
        collapsed={collapsed}
        navItems={navItems}
        navAriaLabel={navAriaLabel}
        navLoading={navLoading}
        logoUrl={logoUrl}
        companyName={companyName}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar navItems={navItems} role={role} nombre={nombre} />
        <ContentArea />
      </div>
    </div>
  );
}
