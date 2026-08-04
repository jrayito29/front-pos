import { toast } from 'sonner';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { useEliminarProducto } from '../hooks/useEliminarProducto';

interface EliminarProductoModalProps {
  isOpen: boolean;
  onClose: () => void;
  productoId: string;
  nombreCorto: string;
  onDeleted: () => void;
}

// SPEC-009 REQ-E11 — el copy advierte explícitamente que no hay forma de deshacerlo desde el
// sistema: no existe endpoint de restauración (`DELETE /:id` es soft-delete, pero irreversible desde
// la UI). `onDeleted` difiere según el origen (listado permanece, detalle navega — REQ-E12).
export function EliminarProductoModal({ isOpen, onClose, productoId, nombreCorto, onDeleted }: EliminarProductoModalProps) {
  const eliminarProducto = useEliminarProducto();

  function handleConfirm() {
    eliminarProducto.mutate(productoId, {
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
    <Modal isOpen={isOpen} title="Eliminar producto" onClose={onClose}>
      <p>
        ¿Eliminar <strong className="text-foreground">{nombreCorto}</strong>? Esta acción no se puede deshacer desde el
        sistema.
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
