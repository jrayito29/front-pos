import { useRef, useState } from 'react';
import { Select } from '../../../components/Select';
import { Button } from '../../../components/Button';
import { useCategoriasSelector, CategoriaQuickCreateModal } from '../../categorias';
import { PlusIcon } from '../../../components/icons';

interface CategoriaSelectProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  error?: string;
  required?: boolean;
}

// SPEC-009 (v1.4.0) — reemplaza el mock por datos reales de `GET /categorias/selector?soloRaiz=true`
// (api-pos SPEC-020). Botón "+" abre el registro rápido (CategoriaQuickCreateModal); al crear, la
// nueva categoría se autoselecciona en este campo.
export function CategoriaSelect({ value, onChange, error, required = false }: CategoriaSelectProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { data: categorias, isLoading } = useCategoriasSelector({ soloRaiz: true, limit: 50 });
  const options = (categorias ?? []).map((categoria) => ({ value: categoria.id, label: categoria.nombre }));

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <Select
          label="Categoría"
          required={required}
          options={options}
          value={value}
          onChange={onChange}
          error={error}
          isClearable
          isDisabled={isLoading}
          placeholder="Selecciona una categoría"
        />
      </div>
      <Button
        ref={triggerRef}
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        aria-label="Nueva categoría"
      >
        <PlusIcon className="h-4 w-4" />
      </Button>
      <CategoriaQuickCreateModal
        isOpen={isModalOpen}
        originRef={triggerRef}
        onClose={() => setIsModalOpen(false)}
        onCreated={(categoria) => onChange(categoria.id)}
      />
    </div>
  );
}
