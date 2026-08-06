import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { useDesactivarUsuario } from '../hooks/useDesactivarUsuario';

interface DesactivarUsuarioTarget {
  id: string;
  nombre: string;
}

interface DesactivarUsuarioModalProps {
  usuario: DesactivarUsuarioTarget | null;
  onClose: () => void;
  onDesactivado: () => void;
}

// Mirror EliminarCategoriaModal — se renderiza siempre (nunca `{usuario && <.../>}`), alternando solo
// `usuario`, para que la animación de salida del Modal interno pueda reproducirse. `lastUsuario`
// cachea el último valor no nulo para que el nombre siga visible mientras la modal se anima al
// cerrar. SPEC-011 REQ-E4: el copy explica que se revocan las sesiones activas y se bloquea el acceso
// de inmediato (usuarios-gestion.spec.md, Flujo B) — mayor consecuencia que un soft delete
// silencioso, por eso se hace explícito en el texto de confirmación.
export function DesactivarUsuarioModal({ usuario, onClose, onDesactivado }: DesactivarUsuarioModalProps) {
  const [lastUsuario, setLastUsuario] = useState(usuario);
  if (usuario && usuario !== lastUsuario) {
    setLastUsuario(usuario);
  }

  const desactivarUsuario = useDesactivarUsuario();

  function handleConfirm() {
    if (!lastUsuario) return;
    desactivarUsuario.mutate(lastUsuario.id, {
      onSuccess: () => {
        toast.success('Usuario desactivado');
        onClose();
        onDesactivado();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  }

  return (
    <Modal isOpen={usuario !== null} title="Desactivar usuario" onClose={onClose}>
      <p>
        ¿Desactivar a <strong className="text-foreground">{lastUsuario?.nombre}</strong>? Se revocarán todas sus
        sesiones activas y perderá acceso al sistema de inmediato. Esta acción no se puede deshacer desde el sistema.
      </p>
      <div className="mt-6 flex justify-end gap-3">
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="button" variant="danger" size="sm" isLoading={desactivarUsuario.isPending} onClick={handleConfirm}>
          Desactivar
        </Button>
      </div>
    </Modal>
  );
}
