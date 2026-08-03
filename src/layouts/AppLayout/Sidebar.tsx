import { Sidebar as ProSidebar, sidebarClasses } from 'react-pro-sidebar';
import { SidebarBrand } from './SidebarBrand';
import { Nav } from './Nav';
import { SidebarFooter } from './SidebarFooter';
import type { NavItemConfig } from './navConfig';

interface SidebarProps {
  collapsed: boolean;
  navItems: NavItemConfig[];
  navAriaLabel: string;
  navLoading?: boolean;
  logoUrl?: string;
  companyName?: string;
}

// SPEC-008 REQ-U2 — el colapso es la prop controlada `collapsed`; react-pro-sidebar resuelve la
// transición de ancho y el modo solo-ícono internamente, no se reimplementa con CSS de ancho propio.
// REQ-U3 — `backgroundColor` usa el mismo token que el fondo de la página (--bg-secondary), sin
// costura visible. REQ-U4 — la librería aplica `overflow-y: auto` por defecto a su contenedor
// interno (`ps-sidebar-container`); se neutraliza explícitamente vía `rootStyles`, la sidebar nunca
// debe producir su propio scroll.
export function Sidebar({ collapsed, navItems, navAriaLabel, navLoading, logoUrl, companyName }: SidebarProps) {
  return (
    <ProSidebar
      collapsed={collapsed}
      width="264px"
      collapsedWidth="76px"
      backgroundColor="var(--bg-secondary)"
      transitionDuration={220}
      rootStyles={{
        border: 'none',
        height: '100vh',
        position: 'sticky',
        top: 0,
        color: 'var(--text-secondary)',
        [`.${sidebarClasses.container}`]: {
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <div className="flex h-full flex-col px-4 py-5">
        <SidebarBrand collapsed={collapsed} logoUrl={logoUrl} companyName={companyName} />
        <div className="min-h-0 flex-1 overflow-hidden">
          <Nav items={navItems} ariaLabel={navAriaLabel} loading={navLoading} />
        </div>
        <SidebarFooter collapsed={collapsed} />
      </div>
    </ProSidebar>
  );
}
