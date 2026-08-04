import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { useEliminarProducto } from '../hooks/useEliminarProducto';

interface EliminarProductoTarget {
  id: string;
  nombreCorto: string;
}

interface EliminarProductoModalProps {
  producto: EliminarProductoTarget | null;
  onClose: () => void;
  onDeleted: () => void;
}

// SPEC-009 REQ-E11 — el copy advierte explícitamente que no hay forma de deshacerlo desde el
// sistema: no existe endpoint de restauración (`DELETE /:id` es soft-delete, pero irreversible desde
// la UI). `onDeleted` difiere según el origen (listado permanece, detalle navega — REQ-E12).
//
// SPEC-001 (Design System) — animación de salida del Modal: el consumidor DEBE renderizar este
// componente siempre (nunca `{producto && <EliminarProductoModal .../>}`), alternando solo si
// `producto` es `null`. Si el padre desmonta el wrapper completo al cerrar, el `Modal` interno nunca
// llega a reproducir su transición de cierre (React lo retira del árbol antes de que el timeout de
// salida corra). `lastProducto` cachea el último valor no nulo para que el nombre siga visible
// mientras la modal se anima hacia afuera, incluso después de que el padre ya puso `producto` en `null`.
export function EliminarProductoModal({ producto, onClose, onDeleted }: EliminarProductoModalProps) {
  const [lastProducto, setLastProducto] = useState(producto);
  if (producto && producto !== lastProducto) {
    setLastProducto(producto);
  }

  const eliminarProducto = useEliminarProducto();

  function handleConfirm() {
    if (!lastProducto) return;
    eliminarProducto.mutate(lastProducto.id, {
      onSuccess: () => {
        toast.success('Producto eliminado');
        onClose();
        onDeleted();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  }

  return (
    <Modal isOpen={producto !== null} title="Eliminar producto" onClose={onClose}>
      <p>
        ¿Eliminar <strong className="text-foreground">{lastProducto?.nombreCorto}</strong>? Esta acción no se puede
        deshacer desde el sistema.
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="button" variant="danger" size="sm" isLoading={eliminarProducto.isPending} onClick={handleConfirm}>
          Eliminar
        </Button>
      </div>
    </Modal>
  );
}
