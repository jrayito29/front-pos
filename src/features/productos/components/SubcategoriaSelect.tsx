import { useRef, useState } from 'react';
import { Select } from '../../../components/Select';
import { Button } from '../../../components/Button';
import { useCategoriasSelector, SubcategoriaQuickCreateModal } from '../../categorias';
import { PlusIcon } from '../../../components/icons';

interface SubcategoriaSelectProps {
  categoriaId: string | undefined;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  error?: string;
}

// SPEC-009 (v1.4.0) — reemplaza el mock por datos reales de `GET /categorias/selector?padreId=...`
// (api-pos SPEC-020). Deshabilitado (select y botón "+") mientras no haya `categoriaId` — nunca
// muestra el catálogo completo de subcategorías de todas las categorías a la vez.
export function SubcategoriaSelect({ categoriaId, value, onChange, error }: SubcategoriaSelectProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { data: subcategorias, isLoading } = useCategoriasSelector({ padreId: categoriaId, limit: 50 }, Boolean(categoriaId));
  const options = (subcategorias ?? []).map((sub) => ({ value: sub.id, label: sub.nombre }));

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <Select
          label="Subcategoría"
          options={options}
          value={value}
          onChange={onChange}
          error={error}
          isClearable
          isDisabled={!categoriaId || isLoading}
          placeholder={categoriaId ? 'Selecciona una subcategoría' : 'Primero elige una categoría'}
        />
      </div>
      <Button
        ref={triggerRef}
        type="button"
        variant="secondary"
        size="sm"
        disabled={!categoriaId}
        onClick={() => setIsModalOpen(true)}
        aria-label="Nueva subcategoría"
      >
        <PlusIcon className="h-4 w-4" />
      </Button>
      <SubcategoriaQuickCreateModal
        isOpen={isModalOpen && Boolean(categoriaId)}
        originRef={triggerRef}
        defaultPadreId={categoriaId}
        onClose={() => setIsModalOpen(false)}
        onCreated={(subcategoria) => onChange(subcategoria.id)}
      />
    </div>
  );
}
