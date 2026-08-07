// DTOs del módulo de Sucursales y Almacenes. Espejo 1:1 de
// api-pos/src/interfaces/sucursales.interfaces.ts (SPEC-014, api-pos) — no se importan
// directamente, proyectos separados. Ref: SPEC-012.
import type { TipoAlmacenDomain } from '../constants/sucursal.constants';

export interface AlmacenResumenDTO {
  id: string;
  nombre: string;
  tipo: TipoAlmacenDomain;
  codigoInterno: string;
  codigoPersonalizable: string | null;
  permitirVenta: boolean;
  permitirTraspaso: boolean;
  esVirtual: boolean;
  activo: boolean;
}

// GET /sucursales/:sucursalId/almacenes (listado paginado) y detalle de un almacén — mismo shape,
// el backend no distingue resumen/detalle para Almacén (a diferencia de Sucursal solo por el
// arreglo embebido de SucursalConAlmacenesDTO, no por Almacen mismo).
export interface AlmacenDTO extends AlmacenResumenDTO {
  sucursalId: string;
  empresaId: string;
  calle: string | null;
  numeroExterior: string | null;
  numeroInterior: string | null;
  colonia: string | null;
  municipio: string | null;
  estado: string | null;
  codigoPostal: string | null;
  direccionCompleta: string | null;
  createdAt: string;
  updatedAt: string;
}

// GET /sucursales (listado) y GET /sucursales/:id (detalle, sin `almacenes`) comparten este shape
// completo — el backend no tiene un DTO reducido para Sucursal (confirmado contra
// api-pos/src/services/sucursales.service.ts, `sucursalSelect`).
export interface SucursalDTO {
  id: string;
  nombre: string;
  codigoInterno: string;
  codigoPersonalizable: string | null;
  telefono: string | null;
  email: string | null;
  calle: string;
  numeroExterior: string;
  numeroInterior: string | null;
  colonia: string;
  municipio: string;
  estado: string;
  codigoPostal: string;
  direccionCompleta: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

// GET /sucursales/:id — único endpoint que embebe almacenes (solo activos, sin paginar). Ref:
// SPEC-012 REQ-U7 — no se usa como fuente de la tabla de la tab Almacenes, solo del badge de conteo.
export interface SucursalConAlmacenesDTO extends SucursalDTO {
  almacenes: AlmacenResumenDTO[];
}

// Respuesta del paso 1 de desactivación cuando hay almacenes con stock. Ref: SPEC-014 §Flujo de
// Desactivación, SPEC-012 REQ-E4.
export interface AlmacenConStockResumen {
  id: string;
  nombre: string;
  codigoInterno: string;
}

export interface DesactivacionConWarningDTO {
  requiereConfirmacion: true;
  motivo: string;
  almacenesConStock: AlmacenConStockResumen[];
}

export interface ListarSucursalesParams {
  q?: string;
  activo?: boolean;
  page: number;
  limit: number;
}

export interface ListarSucursalesResult {
  sucursales: SucursalDTO[];
  meta: { page: number; limit: number; total: number };
}

export interface ListarAlmacenesDeSucursalParams {
  q?: string;
  activo?: boolean;
  tipo?: TipoAlmacenDomain;
  page: number;
  limit: number;
}

export interface ListarAlmacenesDeSucursalResult {
  almacenes: AlmacenResumenDTO[];
  meta: { page: number; limit: number; total: number };
}
