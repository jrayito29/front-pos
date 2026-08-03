import { useNavigate } from 'react-router';
import { useUiStore } from '../../stores/ui.store';
import { useSessionStore } from '../../stores/session.store';
import { ROUTES } from '../../constants/routes';
import { SunIcon, MoonIcon, LogoutIcon } from './icons';

interface SidebarFooterProps {
  collapsed: boolean;
}

const itemClass =
  'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-[13.5px] font-medium text-foreground-secondary transition-colors duration-150 hover:bg-background-tertiary hover:text-foreground active:scale-[0.98]';

// SPEC-008 REQ-U13 — footer fijo de la sidebar (fuera del <Menu> con scroll propio): cambio de tema
// (REQ-E6) y cerrar sesión (REQ-E5), siempre visibles.
export function SidebarFooter({ collapsed }: SidebarFooterProps) {
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const navigate = useNavigate();

  function handleLogout() {
    useSessionStore.getState().clearSession();
    navigate(ROUTES.LOGIN, { replace: true });
  }

  return (
    <div className="flex flex-col gap-1 border-t border-border pt-2">
      <button
        type="button"
        onClick={toggleTheme}
        className={`cursor-pointer ${itemClass} ${collapsed ? 'justify-center' : ''}`}
        aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      >
        {theme === 'dark' ? <SunIcon className="h-5 w-5 flex-shrink-0" /> : <MoonIcon className="h-5 w-5 flex-shrink-0" />}
        {!collapsed && <span>{theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}</span>}
      </button>
      <button
        type="button"
        onClick={handleLogout}
        className={`${itemClass} cursor-pointer text-brand-coral-text hover:bg-brand-coral-bg hover:text-brand-coral-text ${collapsed ? 'justify-center' : ''}`}
      >
        <LogoutIcon className="h-5 w-5 flex-shrink-0" />
        {!collapsed && <span>Cerrar sesión</span>}
      </button>
    </div>
  );
}
