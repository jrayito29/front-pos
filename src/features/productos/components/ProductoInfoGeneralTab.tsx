import { ProductoInfoGeneralReadOnly } from './ProductoInfoGeneralReadOnly';
import { ProductoInfoGeneralForm } from './ProductoInfoGeneralForm';
import type { ProductoDTO } from '../types/producto.types';

interface ProductoInfoGeneralTabProps {
  producto: ProductoDTO;
  isEditing: boolean;
  onSaved: () => void;
}

// SPEC-009 REQ-U23/U25 — alterna lectura/formulario según el modo global de la vista (botón "Editar"
// del header, REQ-E5), sin duplicar el layout de campos entre ambos modos.
export function ProductoInfoGeneralTab({ producto, isEditing, onSaved }: ProductoInfoGeneralTabProps) {
  return isEditing ? (
    <ProductoInfoGeneralForm producto={producto} onSaved={onSaved} />
  ) : (
    <ProductoInfoGeneralReadOnly producto={producto} />
  );
}
