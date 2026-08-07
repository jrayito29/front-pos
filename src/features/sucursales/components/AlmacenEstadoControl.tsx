import { toast } from 'sonner';
import { Switch } from '../../../components/Switch';
import { EstadoActivoBadge } from './EstadoActivoBadge';
import { useCambiarEstadoAlmacen } from '../hooks/useCambiarEstadoAlmacen';
import type { AlmacenDTO } from '../types/sucursal.types';

interface AlmacenEstadoControlProps {
  almacen: AlmacenDTO;
  puedeCambiarEstado: boolean;
}

// SPEC-012 REQ-E8 — vive dentro de AlmacenFormModal (no inline en la tabla, para no competir con el
// clic de fila que abre el modal de edición — REQ-E6). A diferencia de SucursalEstadoControl, no hay
// confirmación previa: el backend no expone el stock de un almacén individual antes del intento. Si
// falla con 409 ERR_ALMACEN_CON_STOCK, se muestra vía toast.
export function AlmacenEstadoControl({ almacen, puedeCambiarEstado }: AlmacenEstadoControlProps) {
  const cambiarEstado = useCambiarEstadoAlmacen();

  function handleChange(checked: boolean) {
    cambiarEstado.mutate(
      { id: almacen.id, activo: checked },
      {
        onSuccess: () => toast.success('Estado actualizado'),
        onError: (error) => toast.error(error.message),
      }
    );
  }

  if (!puedeCambiarEstado) return <EstadoActivoBadge activo={almacen.activo} />;

  return <Switch label="Almacén activo" checked={almacen.activo} onChange={handleChange} />;
}
