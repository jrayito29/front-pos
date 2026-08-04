// Barrel de la feature Categorías — expone únicamente lo que otras features (Productos) necesitan
// consumir (CLAUDE.md §3). Los modales de registro rápido también se exponen aquí porque son la
// única superficie de UI que esta feature aporta por ahora (sin vista de gestión propia todavía).
export { useCategoriasSelector } from './hooks/useCategoriasSelector';
export { useCrearCategoria } from './hooks/useCrearCategoria';
export { applyCategoriaApiError } from './hooks/applyCategoriaApiError';
export { CategoriaQuickCreateModal } from './components/CategoriaQuickCreateModal';
export { SubcategoriaQuickCreateModal } from './components/SubcategoriaQuickCreateModal';
export type { CategoriaSelectorDTO, CategoriaDTO } from './types/categoria.types';
