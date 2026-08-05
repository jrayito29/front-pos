import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { useEliminarCategoria } from '../hooks/useEliminarCategoria';

interface EliminarCategoriaTarget {
  id: string;
  nombre: string;
}

interface EliminarCategoriaModalProps {
  categoria: EliminarCategoriaTarget | null;
  onClose: () => void;
  onDeleted: () => void;
}

// Mirror EliminarProductoModal — se renderiza siempre (nunca `{categoria && <.../>}`), alternando solo
// `categoria`, para que la animación de salida del `Modal` interno pueda reproducirse. `lastCategoria`
// cachea el último valor no nulo para que el nombre siga visible mientras la modal se anima al cerrar.
// Si la categoría tiene subcategorías activas o productos asociados, el backend rechaza con 409
// (`ERR_CATEGORIA_CON_SUBCATEGORIAS_ACTIVAS`/`ERR_CATEGORIA_CON_PRODUCTOS_ASOCIADOS`) — sin campo de
// formulario asociado, se muestra vía toast igual que cualquier otro error no mapeable.
export function EliminarCategoriaModal({ categoria, onClose, onDeleted }: EliminarCategoriaModalProps) {
  const [lastCategoria, setLastCategoria] = useState(categoria);
  if (categoria && categoria !== lastCategoria) {
    setLastCategoria(categoria);
  }

  const eliminarCategoria = useEliminarCategoria();

  function handleConfirm() {
    if (!lastCategoria) return;
    eliminarCategoria.mutate(lastCategoria.id, {
      onSuccess: () => {
        toast.success('Categoría eliminada');
        onClose();
        onDeleted();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  }

  return (
    <Modal isOpen={categoria !== null} title="Eliminar categoría" onClose={onClose}>
      <p>
        ¿Eliminar <strong className="text-foreground">{lastCategoria?.nombre}</strong>? Esta acción no se puede
        deshacer desde el sistema.
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="button" variant="danger" size="sm" isLoading={eliminarCategoria.isPending} onClick={handleConfirm}>
          Eliminar
        </Button>
      </div>
    </Modal>
  );
}
