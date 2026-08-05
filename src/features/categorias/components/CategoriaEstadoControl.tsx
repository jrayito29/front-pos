import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { Switch } from '../../../components/Switch';
import { EstadoCategoriaBadge } from './EstadoCategoriaBadge';
import { useCambiarEstadoCategoria } from '../hooks/useCambiarEstadoCategoria';
import { ESTADO_CATEGORIA } from '../constants/categoria.constants';
import type { CategoriaDTO } from '../types/categoria.types';

interface CategoriaEstadoControlProps {
  categoria: CategoriaDTO;
  puedeCambiarEstado: boolean;
}

// SPEC-020 REQ-E6/E6b/E6c — desactivar una raíz con subcategorías activas requiere `confirmarCascada`
// (desactiva también a las hijas); reactivar nunca reactiva subcategorías. `CategoriaDTO.subcategorias`
// ya viene cargado desde GET /:id (CategoriaDetalleModal), así que la decisión de pedir confirmación
// se toma de forma preventiva con ese dato — sin depender de que el PATCH falle primero con
// `ERR_CATEGORIA_CONFIRMACION_REQUERIDA` (aunque ese código sigue siendo la red de seguridad ante una
// carrera, ver `onError`). Control binario (`Switch`), a diferencia de `ProductoEstadoControl`
// (`Select`, 4 estados posibles) — Categoría solo tiene 2.
export function CategoriaEstadoControl({ categoria, puedeCambiarEstado }: CategoriaEstadoControlProps) {
  const [confirmandoCascada, setConfirmandoCascada] = useState(false);
  const cambiarEstado = useCambiarEstadoCategoria();

  const subcategoriasActivas = categoria.subcategorias.filter((sub) => sub.estado === ESTADO_CATEGORIA.ACTIVO).length;

  function handleChange(checked: boolean) {
    const nuevoEstado = checked ? ESTADO_CATEGORIA.ACTIVO : ESTADO_CATEGORIA.INACTIVO;
    if (nuevoEstado === ESTADO_CATEGORIA.INACTIVO && subcategoriasActivas > 0) {
      setConfirmandoCascada(true);
      return;
    }
    cambiarEstado.mutate(
      { id: categoria.id, estado: nuevoEstado, confirmarCascada: false },
      {
        onSuccess: () => toast.success('Estado actualizado'),
        onError: (error) => toast.error(error.message),
      }
    );
  }

  if (!puedeCambiarEstado) return <EstadoCategoriaBadge estado={categoria.estado} />;

  return (
    <>
      <Switch
        label="Categoría activa"
        checked={categoria.estado === ESTADO_CATEGORIA.ACTIVO}
        onChange={handleChange}
      />

      <Modal isOpen={confirmandoCascada} title="Desactivar categoría con subcategorías" onClose={() => setConfirmandoCascada(false)}>
        <p>
          Esta categoría tiene <strong className="text-foreground">{subcategoriasActivas}</strong>{' '}
          {subcategoriasActivas === 1 ? 'subcategoría activa' : 'subcategorías activas'}. Al desactivarla, esas
          subcategorías también quedarán inactivas. ¿Continuar?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="secondary" size="sm" onClick={() => setConfirmandoCascada(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            isLoading={cambiarEstado.isPending}
            onClick={() => {
              cambiarEstado.mutate(
                { id: categoria.id, estado: ESTADO_CATEGORIA.INACTIVO, confirmarCascada: true },
                {
                  onSuccess: () => {
                    toast.success('Estado actualizado');
                    setConfirmandoCascada(false);
                  },
                  onError: (error) => {
                    toast.error(error.message);
                    setConfirmandoCascada(false);
                  },
                }
              );
            }}
          >
            Desactivar
          </Button>
        </div>
      </Modal>
    </>
  );
}
