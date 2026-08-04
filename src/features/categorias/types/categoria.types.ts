// DTOs del módulo de Categorías. Espejo 1:1 de api-pos/src/interfaces/categorias.interfaces.ts
// (SPEC-020) — no se importan directamente, proyectos separados. Ref: SPEC-009 (v1.4.0).

export interface CategoriaSelectorDTO {
  id: string;
  nombre: string;
  padreId: string | null;
}

export interface CategoriaSubcategoriaDTO {
  id: string;
  nombre: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface CategoriaDTO {
  id: string;
  nombre: string;
  padreId: string | null;
  estado: 'ACTIVO' | 'INACTIVO';
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
