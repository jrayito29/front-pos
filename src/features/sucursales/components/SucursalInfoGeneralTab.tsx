import { SucursalInfoGeneralReadOnly } from './SucursalInfoGeneralReadOnly';
import { SucursalInfoGeneralForm } from './SucursalInfoGeneralForm';
import type { SucursalDTO } from '../types/sucursal.types';

interface SucursalInfoGeneralTabProps {
  sucursal: SucursalDTO;
  isEditing: boolean;
  onSaved: () => void;
  onCancel: () => void;
}

// SPEC-012 REQ-U6 — alterna lectura/formulario según el modo global de la vista (botón "Editar" del
// header), sin duplicar el layout de campos entre ambos modos. Mismo patrón que ProductoInfoGeneralTab.
export function SucursalInfoGeneralTab({ sucursal, isEditing, onSaved, onCancel }: SucursalInfoGeneralTabProps) {
  return isEditing ? (
    <SucursalInfoGeneralForm sucursal={sucursal} onSaved={onSaved} onCancel={onCancel} />
  ) : (
    <SucursalInfoGeneralReadOnly sucursal={sucursal} />
  );
}
