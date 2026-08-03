import { useUiStore } from '../../stores/ui.store';
import { Breadcrumb } from './Breadcrumb';
import { NotificationsDropdown } from './NotificationsDropdown';
import { UserChip } from './UserChip';
import { MenuToggleIcon } from './icons';
import type { NavItemConfig } from './navConfig';

interface TopbarProps {
  navItems: NavItemConfig[];
  role: string | undefined;
  nombre?: string;
}

// SPEC-008 REQ-U5/U14 — siempre visible (sticky), independiente del scroll del contenido. Nada en
// este componente lee `sidebarCollapsed` para su propio render (REQ-X1: el colapso de la sidebar
// nunca debe afectar lo que se muestra aquí — regresión real encontrada en la revisión de diseño).
export function Topbar({ navItems, role, nombre }: TopbarProps) {
  const toggleSidebarCollapsed = useUiStore((state) => state.toggleSidebarCollapsed);
  const collapsed = useUiStore((state) => state.sidebarCollapsed);

  return (
    <header className="sticky top-0 z-20 flex h-16 flex-shrink-0 items-center justify-between bg-background-secondary px-6">
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          onClick={toggleSidebarCollapsed}
          aria-label={collapsed ? 'Expandir la sidebar' : 'Colapsar la sidebar'}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-foreground-secondary transition-colors duration-150 hover:bg-background-tertiary active:scale-[0.94]"
        >
          <MenuToggleIcon className="h-5 w-5" />
        </button>
        <Breadcrumb items={navItems} />
      </div>

      <div className="flex items-center gap-3.5">
        <NotificationsDropdown />
        <UserChip role={role} nombre={nombre} />
      </div>
    </header>
  );
}
