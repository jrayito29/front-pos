import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { Switch } from '../../../components/Switch';
import { EstadoActivoBadge } from './EstadoActivoBadge';
import { useCambiarEstadoSucursal } from '../hooks/useCambiarEstadoSucursal';
import type { DesactivacionConWarningDTO, SucursalDTO } from '../types/sucursal.types';

interface SucursalEstadoControlProps {
  sucursal: SucursalDTO;
  puedeCambiarEstado: boolean;
}

function esWarning(data: SucursalDTO | DesactivacionConWarningDTO): data is DesactivacionConWarningDTO {
  return 'requiereConfirmacion' in data;
}

// SPEC-014 §Flujo de Desactivación / SPEC-012 REQ-E4/E5 — desactivar dispara `PATCH /:id/estado`; si
// el backend responde con `requiereConfirmacion: true` (almacenes con stock), se abre un modal
// listando esos almacenes antes de reenviar con `confirmarConStock: true`. Reactivar siempre aplica
// de inmediato, sin modal (mismo criterio que CategoriaEstadoControl, pero la confirmación aquí
// depende de la respuesta del servidor, no de datos ya cargados en el cliente).
export function SucursalEstadoControl({ sucursal, puedeCambiarEstado }: SucursalEstadoControlProps) {
  const [warning, setWarning] = useState<DesactivacionConWarningDTO | null>(null);
  const cambiarEstado = useCambiarEstadoSucursal();

  function handleChange(checked: boolean) {
    cambiarEstado.mutate(
      { id: sucursal.id, activo: checked },
      {
        onSuccess: (result) => {
          if (esWarning(result)) {
            setWarning(result);
            return;
          }
          toast.success('Estado actualizado');
        },
        onError: (error) => toast.error(error.message),
      }
    );
  }

  function confirmarConStock() {
    cambiarEstado.mutate(
      { id: sucursal.id, activo: false, confirmarConStock: true },
      {
        onSuccess: () => {
          toast.success('Estado actualizado');
          setWarning(null);
        },
        onError: (error) => {
          toast.error(error.message);
          setWarning(null);
        },
      }
    );
  }

  if (!puedeCambiarEstado) return <EstadoActivoBadge activo={sucursal.activo} />;

  return (
    <>
      <Switch label="Sucursal activa" checked={sucursal.activo} onChange={handleChange} />

      <Modal isOpen={warning !== null} title="Sucursal con almacenes en stock" onClose={() => setWarning(null)}>
        <p>
          Los siguientes almacenes de esta sucursal tienen stock registrado. Al desactivarla, esos almacenes también
          quedarán inactivos:
        </p>
        <ul className="mt-3 flex flex-col gap-1">
          {warning?.almacenesConStock.map((almacen) => (
            <li key={almacen.id} className="text-sm text-foreground">
              {almacen.nombre} <span className="text-foreground-muted">· {almacen.codigoInterno}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="secondary" size="sm" onClick={() => setWarning(null)}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            isLoading={cambiarEstado.isPending}
            onClick={confirmarConStock}
          >
            Confirmar y desactivar
          </Button>
        </div>
      </Modal>
    </>
  );
}
