import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { Select } from '../../../components/Select';
import { EstadoBadge } from './EstadoBadge';
import { useCambiarEstadoProducto } from '../hooks/useCambiarEstadoProducto';
import { ESTADO_PRODUCTO, TRANSICIONES_ESTADO, type EstadoProductoDomain } from '../constants/producto.constants';

interface ProductoEstadoControlProps {
  productoId: string;
  estado: EstadoProductoDomain;
  puedeCambiarEstado: boolean;
}

// SPEC-009 REQ-S4/E9/E10 — transiciones limitadas a la matriz del backend; solo la transición hacia
// DISCONTINUADO pasa por confirmación (no puede revertirse directo a ACTIVO, mayor consecuencia).
export function ProductoEstadoControl({ productoId, estado, puedeCambiarEstado }: ProductoEstadoControlProps) {
  const [pendiente, setPendiente] = useState<EstadoProductoDomain | null>(null);
  const cambiarEstado = useCambiarEstadoProducto();

  function aplicar(nuevoEstado: EstadoProductoDomain) {
    cambiarEstado.mutate(
      { id: productoId, estado: nuevoEstado },
      {
        onSuccess: () => toast.success('Estado actualizado'),
        onError: (error) => toast.error(error.message),
      }
    );
  }

  function handleChange(value: string | undefined) {
    if (!value) return;
    const nuevoEstado = value as EstadoProductoDomain;
    if (nuevoEstado === ESTADO_PRODUCTO.DISCONTINUADO) {
      setPendiente(nuevoEstado);
      return;
    }
    aplicar(nuevoEstado);
  }

  if (!puedeCambiarEstado) return <EstadoBadge estado={estado} />;

  const opciones = [estado, ...TRANSICIONES_ESTADO[estado]].map((value) => ({ value, label: value }));

  return (
    <>
      <div className="w-44">
        <Select
          label="Estado del producto"
          hideLabel
          options={opciones}
          value={estado}
          onChange={handleChange}
          isDisabled={cambiarEstado.isPending}
        />
      </div>

      <Modal isOpen={pendiente !== null} title="Discontinuar producto" onClose={() => setPendiente(null)}>
        <p>
          Un producto discontinuado no puede volver a estado Activo directamente (debe pasar por Inactivo primero).
          ¿Continuar?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="secondary" size="sm" onClick={() => setPendiente(null)}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => {
              if (pendiente) aplicar(pendiente);
              setPendiente(null);
            }}
          >
            Discontinuar
          </Button>
        </div>
      </Modal>
    </>
  );
}
