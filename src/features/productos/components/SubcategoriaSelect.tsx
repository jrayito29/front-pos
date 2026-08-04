import { Select } from '../../../components/Select';
import { getSubcategoriasDe } from '../constants/producto.constants';

interface SubcategoriaSelectProps {
  categoriaId: string | undefined;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  error?: string;
}

// SPEC-009 REQ-U46 — opcional, siempre hija de la categoría padre seleccionada (`getSubcategoriasDe`,
// mock). Deshabilitado y sin opciones mientras no haya `categoriaId` — nunca muestra el catálogo
// completo de subcategorías de todas las categorías a la vez.
export function SubcategoriaSelect({ categoriaId, value, onChange, error }: SubcategoriaSelectProps) {
  const options = getSubcategoriasDe(categoriaId).map((sub) => ({ value: sub.id, label: sub.nombre }));

  return (
    <Select
      label="Subcategoría"
      options={options}
      value={value}
      onChange={onChange}
      error={error}
      isClearable
      isDisabled={!categoriaId}
      placeholder={categoriaId ? 'Selecciona una subcategoría' : 'Primero elige una categoría'}
    />
  );
}
