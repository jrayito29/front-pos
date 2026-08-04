import { Menu, MenuItem } from 'react-pro-sidebar';
import { Link, useLocation } from 'react-router';
import { Skeleton } from '../../components/Skeleton';
import type { NavItemConfig } from './navConfig';

interface NavProps {
  items: NavItemConfig[];
  ariaLabel: string;
  loading?: boolean;
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
      {items.map((item) => {
        const Icon = item.icon;
        // SPEC-008 REQ-U14 (adenda) — match por prefijo, no solo igualdad exacta: un módulo con
        // subrutas (ej. Productos: /productos/nuevo, /productos/:id) debe seguir marcado como activo
        // en el sidebar mientras se navega dentro de él. El `/` final evita que `/productos` matchee
        // por accidente algo como `/productos-x`.
        const active = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(`${item.to}/`) || location.pathname === item.to;
        return (
          <MenuItem key={item.key} icon={<Icon className="h-5 w-5" />} active={active} component={<Link to={item.to} />}>
            {item.label}
          </MenuItem>
        );
      })}
    </Menu>
  );
}
