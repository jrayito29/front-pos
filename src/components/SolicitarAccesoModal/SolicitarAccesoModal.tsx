import { useId, useState, type RefObject } from 'react';
import { toast } from 'sonner';
import { Modal } from '../Modal';
import { Button } from '../Button';

interface SolicitarAccesoModalProps {
  isOpen: boolean;
  // Descripción legible de la acción bloqueada, ej. "Agregar productos" — se interpola en el copy.
  accion: string;
  onClose: () => void;
  originRef?: RefObject<HTMLElement | null>;
}

// Placeholder de UI mientras no existe backend para esto (ver src/docs/pendings.md). NO llama a
// ningún endpoint — solo confirma visualmente el envío (toast) y cierra. Genérico y sin lógica de
// negocio: cualquier feature puede reusarlo pasando su propio `accion`, no exclusivo de Productos.
export function SolicitarAccesoModal({ isOpen, accion, onClose, originRef }: SolicitarAccesoModalProps) {
  const [mensaje, setMensaje] = useState('');
  const [lastAccion, setLastAccion] = useState(accion);
  const textareaId = useId();

  if (isOpen && accion !== lastAccion) {
    setLastAccion(accion);
  }

  function handleSubmit() {
    toast.success('Solicitud enviada. Un administrador de tu empresa la revisará.');
    setMensaje('');
    onClose();
  }

  return (
    <Modal isOpen={isOpen} title="Solicitar acceso" onClose={onClose} originRef={originRef}>
      <p>
        No tienes permiso para <strong className="text-foreground">{lastAccion}</strong>. Puedes enviar una solicitud
        a un administrador de tu empresa para que te lo conceda.
      </p>

      <div className="mt-4 flex flex-col gap-1.5">
        <label htmlFor={textareaId} className="text-sm font-medium text-foreground">
          Mensaje (opcional)
        </label>
        <textarea
          id={textareaId}
          value={mensaje}
          onChange={(event) => setMensaje(event.target.value)}
          rows={3}
          placeholder="Ej. Necesito registrar productos nuevos del proveedor de hoy."
          className="w-full resize-none rounded-lg border border-border bg-background px-3.5 py-2.5 text-base text-foreground transition-colors duration-150 placeholder:text-foreground-muted focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/40"
        />
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="button" size="sm" onClick={handleSubmit}>
          Enviar solicitud
        </Button>
      </div>
    </Modal>
  );
}
