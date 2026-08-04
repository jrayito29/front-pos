import { Select } from '../../../components/Select';
import { CATEGORIAS_PADRE_MOCK } from '../constants/producto.constants';

const OPTIONS = CATEGORIAS_PADRE_MOCK.map((categoria) => ({ value: categoria.id, label: categoria.nombre }));

interface CategoriaSelectProps {
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  error?: string;
  required?: boolean;
}

// SPEC-009 REQ-U20/U46 — selector estático mock (no existe endpoint de Categorías en el backend
// todavía); IDs con formato UUID real para pasar la validación del backend aunque no exista FK.
// Solo muestra categorías padre (`parentId: null`) — las hijas viven en SubcategoriaSelect.
export function CategoriaSelect({ value, onChange, error, required = false }: CategoriaSelectProps) {
  return (
    <Select
      label="Categoría"
      required={required}
      options={OPTIONS}
      value={value}
      onChange={onChange}
      error={error}
      isClearable
      placeholder="Selecciona una categoría"
    />
  );
}
