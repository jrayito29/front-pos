import { useState } from 'react';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { CopyIcon, CheckIcon } from '../../../components/icons';
import { UsuarioRolBadge } from './UsuarioRolBadge';
import type { UsuarioCreadoDTO } from '../types/usuario.types';

interface UsuarioCreadoModalProps {
  usuario: UsuarioCreadoDTO | null;
  onClose: () => void;
}

const COPIED_FEEDBACK_MS = 2000;

// SPEC-011 REQ-U7/S3 — patrón nuevo "revelar una sola vez", sin precedente en el frontend: el
// backend garantiza que `contraseñaTemporal` no se repite en ninguna otra respuesta
// (usuarios-gestion.spec.md, Flujo A). `dismissible={false}` — a diferencia de cualquier otra modal
// del proyecto, esta NO se cierra con click fuera ni Escape, solo con el botón explícito: su
// contenido es un secreto que no se puede recuperar después de cerrarla. La contraseña nunca pasa
// por `console.log` ni sobrevive fuera del estado local de este componente (CLAUDE.md §9).
export function UsuarioCreadoModal({ usuario, onClose }: UsuarioCreadoModalProps) {
  const [lastUsuario, setLastUsuario] = useState(usuario);
  if (usuario && usuario !== lastUsuario) {
    setLastUsuario(usuario);
  }
  const [copiado, setCopiado] = useState(false);

  async function handleCopiar() {
    if (!lastUsuario) return;
    await navigator.clipboard.writeText(lastUsuario.contraseñaTemporal);
    setCopiado(true);
    window.setTimeout(() => setCopiado(false), COPIED_FEEDBACK_MS);
  }

  function handleClose() {
    setCopiado(false);
    onClose();
  }

  return (
    <Modal isOpen={usuario !== null} title="Usuario creado" onClose={handleClose} dismissible={false}>
      {lastUsuario && (
        <div className="flex flex-col gap-4">
          <p className="flex items-center gap-2">
            <span className="font-medium text-foreground">{lastUsuario.email}</span>
            <UsuarioRolBadge role={lastUsuario.role} />
          </p>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-foreground">Contraseña temporal</span>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg border border-border bg-background-secondary px-3.5 py-2 text-base text-foreground">
                {lastUsuario.contraseñaTemporal}
              </code>
              <Button type="button" variant="secondary" size="sm" onClick={handleCopiar}>
                {copiado ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                {copiado ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
          </div>

          <p className="text-sm text-brand-coral-text">
            Esta contraseña no volverá a mostrarse. Entrégala al usuario; expira en 72 horas.
          </p>

          <div className="flex justify-end pt-2">
            <Button type="button" size="sm" onClick={handleClose}>
              Entendido, cerrar
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
