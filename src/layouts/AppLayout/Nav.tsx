import { Menu, MenuItem, SubMenu } from 'react-pro-sidebar';
import { Link, useLocation } from 'react-router';
import { Skeleton } from '../../components/Skeleton';
import { isNavGroup, type NavEntry, type NavItemConfig } from './navConfig';

interface NavProps {
  items: NavEntry[];
  ariaLabel: string;
  loading?: boolean;
}

// REQ-U14 (adenda) — mismo match por prefijo que el resto del sidebar: una subruta debe seguir
// marcando activo su ítem.
function isItemActive(item: NavItemConfig, pathname: string): boolean {
  return item.to === '/' ? pathname === '/' : pathname.startsWith(`${item.to}/`) || pathname === item.to;
}

// SPEC-008 REQ-S3 — skeleton mientras se resuelve el permiso (TenantChrome), en vez de parpadear
// mostrando todos los ítems y luego ocultando los restringidos (mismo criterio que SPEC-007 REQ-S1).
function NavSkeleton() {
  return (
    <div className="flex flex-col gap-2 pt-1" role="status" aria-busy="true" aria-label="Cargando menú">
      <Skeleton variant="text" className="h-9 w-full" />
      <Skeleton variant="text" className="h-9 w-full" />
      <Skeleton variant="text" className="h-9 w-full" />
      <Skeleton variant="text" className="h-9 w-full" />
    </div>
  );
}

// SPEC-008 REQ-U10/U11 — lista de ítems ya resuelta por el consumidor (TenantChrome filtra por
// permiso, SysadminChrome pasa la lista fija); este componente solo la renderiza y marca el activo.
// `menuItemStyles`/`rootStyles` en CSSObject (emotion) son necesarios porque react-pro-sidebar
// controla su propio DOM interno — no hay forma de estilizarlo solo con className de Tailwind
// (CLAUDE.md §9, caso justificado). Los colores referencian los mismos custom properties de
// src/styles/brand.css que usa el resto del sistema, nunca hex sueltos.
export function Nav({ items, ariaLabel, loading = false }: NavProps) {
  const location = useLocation();

  if (loading) {
    return <NavSkeleton />;
  }

  return (
    <Menu
      aria-label={ariaLabel}
      rootStyles={{ padding: 0, '& > ul': { padding: 0 } }}
      menuItemStyles={{
        button: ({ active }) => ({
          borderRadius: '0.5rem',
          margin: '0 0 2px',
          padding: '9px 10px',
          fontSize: '13.5px',
          fontWeight: 500,
          backgroundColor: active ? 'var(--brand-green-bg)' : 'transparent',
          color: active ? 'var(--brand-green-text)' : 'var(--text-secondary)',
          transition: 'background-color 150ms ease, color 150ms ease',
          '&:hover': {
            backgroundColor: active ? 'var(--brand-green-bg)' : 'var(--bg-tertiary)',
            color: active ? 'var(--brand-green-text)' : 'var(--text-primary)',
          },
          '&:active': { transform: 'scale(0.98)' },
        }),
        icon: ({ active }) => ({
          color: active ? 'var(--brand-green-text)' : 'inherit',
          minWidth: 'auto',
          marginRight: '12px',
        }),
      }}
    >
      {items.map((entry) => {
        const Icon = entry.icon;

        if (isNavGroup(entry)) {
          // El grupo se expande por defecto si alguna de sus rutas hijas está activa (ej. al entrar
          // directo a /categorias por URL) — en cualquier otro caso arranca colapsado.
          const groupActive = entry.items.some((item) => isItemActive(item, location.pathname));
          return (
            <SubMenu key={entry.key} label={entry.label} icon={<Icon className="h-5 w-5" />} defaultOpen={groupActive}>
              {entry.items.map((item) => (
                <MenuItem
                  key={item.key}
                  icon={<item.icon className="h-5 w-5" />}
                  active={isItemActive(item, location.pathname)}
                  component={<Link to={item.to} />}
                >
                  {item.label}
                </MenuItem>
              ))}
            </SubMenu>
          );
        }

        return (
          <MenuItem key={entry.key} icon={<Icon className="h-5 w-5" />} active={isItemActive(entry, location.pathname)} component={<Link to={entry.to} />}>
            {entry.label}
          </MenuItem>
        );
      })}
    </Menu>
  );
}
