import { useRef, useState } from 'react';
import { Button } from '../../../components/Button';
import { LockedActionButton } from '../../../components/LockedActionButton';
import { SolicitarAccesoModal } from '../../../components/SolicitarAccesoModal';
import { TipoIcon } from './TipoIcon';
import { ProductoEstadoControl } from './ProductoEstadoControl';
import { tipoLabel } from '../constants/producto.constants';
import type { ProductoDTO } from '../types/producto.types';

interface ProductoDetalleHeaderProps {
  producto: ProductoDTO;
  isEditing: boolean;
  onToggleEdit: () => void;
  onDeleteClick: () => void;
  puedeEditar: boolean;
  puedeEliminar: boolean;
  puedeCambiarEstado: boolean;
}

// SPEC-009 REQ-U23/U24/U33/U34 — header de la vista Ver/Editar: ícono + nombre + tipo (REQ-U34,
// inmutable, nunca dentro del form), control de Estado, y las acciones Editar/Eliminar gateadas por
// permiso (RESPUESTA-006 — cada acción con su propia clave del catálogo dinámico, ya no un único
// `puedeEditar` compartido).
export function ProductoDetalleHeader({
  producto,
  isEditing,
  onToggleEdit,
  onDeleteClick,
  puedeEditar,
  puedeEliminar,
  puedeCambiarEstado,
}: ProductoDetalleHeaderProps) {
  const editarBtnRef = useRef<HTMLButtonElement>(null);
  const eliminarBtnRef = useRef<HTMLButtonElement>(null);
  const [solicitud, setSolicitud] = useState<{ accion: string; origen: 'editar' | 'eliminar' } | null>(null);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      {/* RESPUESTA visual 2026-08-05 — el botón "‹ Volver" se retira: quedaba fuera de contexto
          duplicando al breadcrumb, que ahora resuelve el regreso al listado (Breadcrumb.tsx, primer
          nivel clickeable cuando hay un segundo nivel registrado vía useBreadcrumbExtra). */}
      <div className="flex items-center gap-2">
        <TipoIcon tipo={producto.tipo} className="h-5 w-5 text-foreground-secondary" />
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold text-foreground">{producto.nombreCorto}</h1>
          <span className="text-xs text-foreground-secondary">
            {producto.sku ?? 'Sin SKU'} · {tipoLabel(producto.tipo)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ProductoEstadoControl productoId={producto.id} estado={producto.estado} puedeCambiarEstado={puedeCambiarEstado} />

        {puedeEditar ? (
          // RESPUESTA visual 2026-08-05 — el label ya no alterna a "Cancelar": el cambio de ancho de
          // texto desplazaba al botón "Eliminar" contiguo. Se deshabilita mientras isEditing=true
          // (posición y label fijos); cancelar la edición ahora vive junto a "Guardar" en el footer
          // del form (ProductoInfoGeneralForm), mismo criterio que ProductoCrearForm.
          <Button ref={editarBtnRef} variant="secondary" size="sm" onClick={onToggleEdit} disabled={isEditing}>
            Editar
          </Button>
        ) : (
          <LockedActionButton
            ref={editarBtnRef}
            reason="No tienes permiso para editar productos. Solicita acceso a un administrador."
            onRequestAccess={() => setSolicitud({ accion: 'editar productos', origen: 'editar' })}
          />
        )}

        {puedeEliminar ? (
          <Button ref={eliminarBtnRef} variant="danger" size="sm" onClick={onDeleteClick}>
            Eliminar
          </Button>
        ) : (
          <LockedActionButton
            ref={eliminarBtnRef}
            reason="No tienes permiso para eliminar productos. Solicita acceso a un administrador."
            onRequestAccess={() => setSolicitud({ accion: 'eliminar productos', origen: 'eliminar' })}
          />
        )}
      </div>

      <SolicitarAccesoModal
        isOpen={solicitud !== null}
        accion={solicitud?.accion ?? ''}
        onClose={() => setSolicitud(null)}
        originRef={solicitud?.origen === 'eliminar' ? eliminarBtnRef : editarBtnRef}
      />
    </div>
  );
}
