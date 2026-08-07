import type { ComponentType, SVGProps } from 'react';
import { ROUTES } from '../../constants/routes';
import {
  AlmacenesIcon,
  AuditoriaIcon,
  CategoriasIcon,
  ClientesIcon,
  ConfiguracionIcon,
  CotizacionesIcon,
  EmpresasIcon,
  InventarioIcon,
  PanelIcon,
  PlanesIcon,
  ProductosIcon,
  UsuariosIcon,
  VentasIcon,
} from './icons';

export interface NavItemConfig {
  key: string;
  label: string;
  to: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  // Clave `modulo.<x>` a resolver con tieneModuloActivo (SPEC-007 REQ-U3). `undefined` = siempre
  // visible, sin gate de permiso (ej. Panel, la vista de aterrizaje de cualquier usuario tenant).
  modulo?: string;
  // SPEC-011 REQ-U8 — gate por rol estático de plataforma (ej. "superadmin"), en vez de `modulo`
  // dinámico. Mutuamente excluyente con `modulo` en la práctica: hoy solo "Usuarios" lo usa, porque
  // no existe una clave `modulo.usuarios` en el catálogo de permisos (SPEC-011 REQ-U3) — ver
  // TenantChrome.tsx, `puedeVerItem`.
  soloRol?: string;
}

// Grupo expandible del sidebar (ej. "Configuración") — agrupación puramente visual del frontend, sin
// gate de permiso propio: cada sub-ítem resuelve su propio `modulo` como cualquier NavItemConfig. El
// grupo se oculta por completo si, tras filtrar `items` por permiso, no queda ninguno visible
// (TenantChrome.tsx).
export interface NavGroupConfig {
  key: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  items: NavItemConfig[];
}

export type NavEntry = NavItemConfig | NavGroupConfig;

export function isNavGroup(entry: NavEntry): entry is NavGroupConfig {
  return 'items' in entry;
}

// Topbar/Breadcrumb solo necesitan la lista plana de rutas+labels para resolver el nivel activo
// (nunca renderizan la agrupación visual) — aplana un `NavEntry[]` a `NavItemConfig[]`.
export function flattenNavItems(entries: NavEntry[]): NavItemConfig[] {
  return entries.flatMap((entry) => (isNavGroup(entry) ? entry.items : [entry]));
}

// SPEC-008 REQ-U10 — lista única compartida por todos los roles de contexto tenant (admin,
// superadmin, cajero, ...). La visibilidad de cada ítem se resuelve por permiso en TenantChrome,
// nunca hardcodeada aquí por rol. El grupo "Configuración" hoy solo agrupa Categorías — estructura
// lista para sumar más sub-ítems de configuración del sistema sin rehacerla.
export const TENANT_NAV: NavEntry[] = [
  { key: 'panel', label: 'Panel', to: ROUTES.DASHBOARD, icon: PanelIcon },
  { key: 'ventas', label: 'Ventas', to: ROUTES.VENTAS, icon: VentasIcon, modulo: 'modulo.ventas' },
  { key: 'cotizaciones', label: 'Cotizaciones', to: ROUTES.COTIZACIONES, icon: CotizacionesIcon, modulo: 'modulo.cotizaciones' },
  { key: 'inventario', label: 'Inventario', to: ROUTES.INVENTARIO, icon: InventarioIcon, modulo: 'modulo.inventario' },
  { key: 'productos', label: 'Productos', to: ROUTES.PRODUCTOS, icon: ProductosIcon, modulo: 'modulo.productos' },
  { key: 'clientes', label: 'Clientes', to: ROUTES.CLIENTES, icon: ClientesIcon, modulo: 'modulo.clientes' },
  {
    key: 'configuracion',
    label: 'Configuración',
    icon: ConfiguracionIcon,
    items: [
      { key: 'categorias', label: 'Categorías', to: ROUTES.CATEGORIAS, icon: CategoriasIcon, modulo: 'modulo.categorias' },
      // SPEC-012 — reemplaza al antiguo ítem raíz "Almacenes" (modulo.almacenes, RouteStub sin
      // implementar): el backend no expone un listado global de almacenes, solo por sucursal
      // (GET /sucursales/:sucursalId/almacenes) — toda la gestión de almacenes vive dentro del
      // detalle de cada sucursal (tab "Almacenes"). Reutiliza AlmacenesIcon (sin ícono nuevo).
      { key: 'sucursales', label: 'Sucursales', to: ROUTES.SUCURSALES, icon: AlmacenesIcon, modulo: 'modulo.sucursales' },
      // SPEC-011 REQ-U8 — sin `modulo`: gate por `soloRol`, no por el catálogo dinámico de permisos.
      { key: 'usuarios', label: 'Usuarios', to: ROUTES.USUARIOS, icon: UsuariosIcon, soloRol: 'superadmin' },
    ],
  },
];

// SPEC-008 REQ-U11 — menú estructuralmente distinto, no una variante filtrada del tenant. Sysadmin
// no pasa por resolución de permisos (SPEC-007 §Contexto), por eso ningún ítem tiene `modulo`.
export const SYSADMIN_NAV: NavItemConfig[] = [
  { key: 'panel', label: 'Panel', to: ROUTES.SYSADMIN, icon: PanelIcon },
  { key: 'empresas', label: 'Empresas', to: ROUTES.SYSADMIN_EMPRESAS, icon: EmpresasIcon },
  { key: 'planes', label: 'Planes', to: ROUTES.SYSADMIN_PLANES, icon: PlanesIcon },
  { key: 'usuarios', label: 'Usuarios', to: ROUTES.SYSADMIN_USUARIOS, icon: UsuariosIcon },
  { key: 'auditoria', label: 'Auditoría', to: ROUTES.SYSADMIN_AUDITORIA, icon: AuditoriaIcon },
];
