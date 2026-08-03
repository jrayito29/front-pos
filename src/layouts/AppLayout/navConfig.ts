import type { ComponentType, SVGProps } from 'react';
import { ROUTES } from '../../constants/routes';
import {
  AlmacenesIcon,
  AuditoriaIcon,
  ClientesIcon,
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
}

// SPEC-008 REQ-U10 — lista única compartida por todos los roles de contexto tenant (admin,
// superadmin, cajero, ...). La visibilidad de cada ítem se resuelve por permiso en TenantChrome,
// nunca hardcodeada aquí por rol.
export const TENANT_NAV: NavItemConfig[] = [
  { key: 'panel', label: 'Panel', to: ROUTES.DASHBOARD, icon: PanelIcon },
  { key: 'ventas', label: 'Ventas', to: ROUTES.VENTAS, icon: VentasIcon, modulo: 'modulo.ventas' },
  { key: 'cotizaciones', label: 'Cotizaciones', to: ROUTES.COTIZACIONES, icon: CotizacionesIcon, modulo: 'modulo.cotizaciones' },
  { key: 'inventario', label: 'Inventario', to: ROUTES.INVENTARIO, icon: InventarioIcon, modulo: 'modulo.inventario' },
  { key: 'productos', label: 'Productos', to: ROUTES.PRODUCTOS, icon: ProductosIcon, modulo: 'modulo.productos' },
  { key: 'almacenes', label: 'Almacenes', to: ROUTES.ALMACENES, icon: AlmacenesIcon, modulo: 'modulo.almacenes' },
  { key: 'clientes', label: 'Clientes', to: ROUTES.CLIENTES, icon: ClientesIcon, modulo: 'modulo.clientes' },
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
