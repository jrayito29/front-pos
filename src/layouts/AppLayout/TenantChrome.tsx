// SPEC-006 REQ-U1 (misma excepción que app/router.tsx / app/RequirePermission.tsx) — import directo
// al archivo, no al barrel `features/auth`: AppLayout se monta eager para toda ruta protegida, y el
// barrel también re-exporta los componentes de auth que hoy viven en chunks async separados.
import { usePermisos, tieneAccesoTotal, tieneModuloActivo } from '../../features/auth/hooks/usePermisos';
import { usePerfil } from '../../features/auth/hooks/usePerfil';
import { isNavGroup, TENANT_NAV, type NavEntry } from './navConfig';
import { Shell } from './Shell';

// SPEC-008 REQ-U10/U12/S3 — único punto donde se llama usePermisos()/usePerfil() para el contexto
// tenant. Filtra TENANT_NAV por tieneModuloActivo (SPEC-007 REQ-U3), saltando el filtro por completo
// cuando `accesoTotal` es true (RESPUESTA-003-datos-usuario-y-logo-empresa.md — hoy solo
// `superadmin`) — implementa el contrato que SPEC-007 REQ-U6 dejó pendiente ("el menú de navegación
// de AppLayout"). `nombre`/`empresa.nombre` ya tienen fuente real (usePerfil); `logoUrl` sigue
// `null` siempre — Fase 2 de branding (subida de logo) diferida del lado del backend, Shell/
// SidebarBrand ya resuelven el fallback a la marca del sistema (REQ-X3/S2).
export function TenantChrome() {
  const { data, isLoading } = usePermisos();
  const { data: perfil } = usePerfil();

  // REQ-U6 — mismo criterio para ítems planos y sub-ítems de grupo; un grupo (ej. "Configuración")
  // se descarta por completo si, tras filtrar sus `items`, no queda ninguno visible para el usuario.
  // SPEC-011 REQ-U8 — `soloRol` (ej. "Usuarios") es un gate por rol estático, independiente del
  // catálogo dinámico de permisos: se resuelve antes y en vez de `modulo`, nunca combinado con él.
  const puedeVerItem = (item: { modulo?: string; soloRol?: string }) =>
    item.soloRol ? data?.role === item.soloRol : !item.modulo || tieneAccesoTotal(data) || tieneModuloActivo(data?.modulos, item.modulo);
  const visibleItems: NavEntry[] = TENANT_NAV.flatMap((entry) => {
    if (!isNavGroup(entry)) return puedeVerItem(entry) ? [entry] : [];
    const items = entry.items.filter(puedeVerItem);
    return items.length > 0 ? [{ ...entry, items }] : [];
  });

  return (
    <Shell
      navItems={visibleItems}
      navAriaLabel="Navegación principal"
      navLoading={isLoading}
      role={data?.role}
      nombre={perfil?.nombre ?? undefined}
      companyName={perfil?.empresa?.nombre}
      logoUrl={perfil?.empresa?.logoUrl ?? undefined}
    />
  );
}
