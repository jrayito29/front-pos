import { useNavigate } from 'react-router';
import { Button } from '../../../components/Button';
import { TipoIcon } from './TipoIcon';
import { ProductoEstadoControl } from './ProductoEstadoControl';
import { ROUTES } from '../../../constants/routes';
import { tipoLabel } from '../constants/producto.constants';
import type { ProductoDTO } from '../types/producto.types';

interface ProductoDetalleHeaderProps {
  producto: ProductoDTO;
  isEditing: boolean;
  onToggleEdit: () => void;
  onDeleteClick: () => void;
  puedeEditar: boolean;
}

// SPEC-009 REQ-U23/U24/U33/U34 — header de la vista Ver/Editar: ícono + nombre + tipo (REQ-U34,
// inmutable, nunca dentro del form), control de Estado, y las acciones Editar/Eliminar gateadas por rol.
export function ProductoDetalleHeader({ producto, isEditing, onToggleEdit, onDeleteClick, puedeEditar }: ProductoDetalleHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.PRODUCTOS)}>
          ‹ Volver
        </Button>
        <div className="flex items-center gap-2">
          <TipoIcon tipo={producto.tipo} className="h-5 w-5 text-foreground-secondary" />
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-foreground">{producto.nombreCorto}</h1>
            <span className="text-xs text-foreground-secondary">
              {producto.sku ?? 'Sin SKU'} · {tipoLabel(producto.tipo)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ProductoEstadoControl productoId={producto.id} estado={producto.estado} puedeEditar={puedeEditar} />
        {puedeEditar && (
          <>
            <Button variant="secondary" size="sm" onClick={onToggleEdit}>
              {isEditing ? 'Cancelar' : 'Editar'}
            </Button>
            <Button variant="danger" size="sm" onClick={onDeleteClick}>
              Eliminar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
