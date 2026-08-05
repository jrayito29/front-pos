// DTOs del módulo de Categorías. Espejo 1:1 de api-pos/src/interfaces/categorias.interfaces.ts
// (SPEC-020) — no se importan directamente, proyectos separados. Ref: SPEC-009 (v1.4.0).
import type { EstadoCategoriaDomain } from '../constants/categoria.constants';

export interface CategoriaSelectorDTO {
  id: string;
  nombre: string;
  padreId: string | null;
}

// GET /api/v1/categorias (listado) — shape reducido, sin descripcion/timestamps/subcategorias.
export interface CategoriaResumenDTO {
  id: string;
  nombre: string;
  padreId: string | null;
  estado: EstadoCategoriaDomain;
}

export interface CategoriaSubcategoriaDTO {
  id: string;
  nombre: string;
  estado: EstadoCategoriaDomain;
}

export interface CategoriaDTO {
  id: string;
  nombre: string;
  padreId: string | null;
  estado: EstadoCategoriaDomain;
  descripcion: string | null;
  createdAt: string;
  updatedAt: string;
  subcategorias: CategoriaSubcategoriaDTO[];
}

export interface SelectorCategoriasParams {
  q?: string;
  padreId?: string;
  soloRaiz?: boolean;
  limit?: number;
}

// GET /api/v1/categorias — listado paginado/filtrado, consumido por CategoriasListPage.
export interface ListarCategoriasParams {
  q?: string;
  estado?: EstadoCategoriaDomain;
  padreId?: string;
  soloRaiz?: boolean;
  page: number;
  limit: number;
}

export interface ListarCategoriasResult {
  categorias: CategoriaResumenDTO[];
  meta: { page: number; limit: number; total: number };
}
