import { useRef } from 'react';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { EmptyState } from '../../../components/EmptyState';
import { Skeleton } from '../../../components/Skeleton';
import { UsuarioRolControl } from './UsuarioRolControl';
import { useUsuario } from '../hooks/useUsuario';
import { useSessionStore } from '../../../stores/session.store';

interface UsuarioDetalleModalProps {
  usuarioId: string | null;
  onClose: () => void;
  onDesactivar: (usuario: { id: string; nombre: string }) => void;
}

// SPEC-011 REQ-E1/S2 — GET /:id se dispara solo mientras la modal está abierta; a diferencia de
// UsuarioListItemDTO, UsuarioDetalleDTO trae `perfil.telefono`. La acción "Desactivar" se oculta
// (reemplazada por una nota) cuando el detalle corresponde al propio usuario de la sesión activa —
// autodesactivación bloqueada preventivamente en UI, dejando `ERR_USER_SELF_DEACTIVATION` del
// backend como red de seguridad ante una carrera, nunca como el camino esperado.
export function UsuarioDetalleModal({ usuarioId, onClose, onDesactivar }: UsuarioDetalleModalProps) {
  const desactivarBtnRef = useRef<HTMLButtonElement>(null);
  const usuarioIdSesion = useSessionStore((state) => state.usuarioId);

  const { data: usuario, isLoading, isError } = useUsuario(usuarioId ?? undefined, { enabled: usuarioId !== null });

  const esUsuarioActual = usuario !== undefined && usuario.usuarioId === usuarioIdSesion;
  const nombreCompleto = usuario ? `${usuario.perfil.nombre} ${usuario.perfil.apellidoPaterno}` : 'Usuario';

  return (
    <Modal isOpen={usuarioId !== null} title={nombreCompleto} onClose={onClose}>
      {isLoading && (
        <div className="flex flex-col gap-3" role="status" aria-busy="true" aria-label="Cargando usuario">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {!isLoading && (isError || !usuario) && (
        <EmptyState title="Usuario no encontrado" description="Puede que haya sido desactivado." />
      )}

      {!isLoading && usuario && (
        <div className="flex flex-col gap-4">
          <p className="text-foreground-secondary">{usuario.email}</p>

          <UsuarioRolControl usuarioId={usuario.usuarioId} role={usuario.role} />

          {usuario.perfil.telefono && (
            <p>
              <span className="text-foreground-muted">Teléfono: </span>
              <span className="text-foreground">{usuario.perfil.telefono}</span>
            </p>
          )}

          <p>
            <span className="text-foreground-muted">Alta: </span>
            <span className="text-foreground">{new Date(usuario.createdAt).toLocaleDateString('es-MX')}</span>
          </p>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            {esUsuarioActual ? (
              <p className="text-xs text-foreground-muted">No puedes desactivar tu propia cuenta.</p>
            ) : (
              <Button
                ref={desactivarBtnRef}
                type="button"
                variant="danger"
                size="sm"
                onClick={() => onDesactivar({ id: usuario.usuarioId, nombre: nombreCompleto })}
              >
                Desactivar
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
