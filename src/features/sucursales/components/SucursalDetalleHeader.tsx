import { useRef, useState } from 'react';
import { Button } from '../../../components/Button';
import { LockedActionButton } from '../../../components/LockedActionButton';
import { SolicitarAccesoModal } from '../../../components/SolicitarAccesoModal';
import { SucursalEstadoControl } from './SucursalEstadoControl';
import type { SucursalDTO } from '../types/sucursal.types';

interface SucursalDetalleHeaderProps {
  sucursal: SucursalDTO;
  isEditing: boolean;
  onToggleEdit: () => void;
  puedeEditar: boolean;
  puedeCambiarEstado: boolean;
}

// SPEC-012 REQ-U6 — header de la vista Ver/Editar: nombre + código + control de Estado + acción
// Editar. A diferencia de Productos, no hay acción "Eliminar" — el módulo no expone DELETE
// (api-pos SPEC-014 §Endpoints CONSTRAINT, solo soft delete/desactivación).
export function SucursalDetalleHeader({
  sucursal,
  isEditing,
  onToggleEdit,
  puedeEditar,
  puedeCambiarEstado,
}: SucursalDetalleHeaderProps) {
  const editarBtnRef = useRef<HTMLButtonElement>(null);
  const [solicitud, setSolicitud] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold text-foreground">{sucursal.nombre}</h1>
        <span className="text-xs text-foreground-secondary">{sucursal.codigoPersonalizable ?? sucursal.codigoInterno}</span>
      </div>

      <div className="flex items-center gap-2">
        <SucursalEstadoControl sucursal={sucursal} puedeCambiarEstado={puedeCambiarEstado} />

        {puedeEditar ? (
          <Button ref={editarBtnRef} variant="secondary" size="sm" onClick={onToggleEdit} disabled={isEditing}>
            Editar
          </Button>
        ) : (
          <LockedActionButton
            ref={editarBtnRef}
            reason="No tienes permiso para editar sucursales. Solicita acceso a un administrador."
            onRequestAccess={() => setSolicitud('editar sucursales')}
          />
        )}
      </div>

      <SolicitarAccesoModal
        isOpen={solicitud !== null}
        accion={solicitud ?? ''}
        onClose={() => setSolicitud(null)}
        originRef={editarBtnRef}
      />
    </div>
  );
}
