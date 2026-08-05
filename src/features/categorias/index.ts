// Barrel de la feature Categorías — expone lo que otras features (Productos) consumen para sus
// selects (selector + registro rápido) y, desde esta implementación, el módulo de gestión completo
// (`CategoriasListPage`, montada en `/categorias` — ver `app/router.tsx`, mismo criterio de import
// directo al archivo que Productos, SPEC-006 REQ-U1: este export solo es para quien SÍ debe usar el
// barrel).
export { useCategoriasSelector } from './hooks/useCategoriasSelector';
export { useCrearCategoria } from './hooks/useCrearCategoria';
export { applyCategoriaApiError } from './hooks/applyCategoriaApiError';
export { CategoriaQuickCreateModal } from './components/CategoriaQuickCreateModal';
export { SubcategoriaQuickCreateModal } from './components/SubcategoriaQuickCreateModal';
export { CategoriasListPage } from './pages/CategoriasListPage';
export type { CategoriaSelectorDTO, CategoriaDTO } from './types/categoria.types';
