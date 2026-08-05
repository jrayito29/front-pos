import { useRef, useState } from 'react';
import { Modal } from '../../../components/Modal';
import { Button } from '../../../components/Button';
import { LockedActionButton } from '../../../components/LockedActionButton';
import { SolicitarAccesoModal } from '../../../components/SolicitarAccesoModal';
import { EmptyState } from '../../../components/EmptyState';
import { Skeleton } from '../../../components/Skeleton';
import { EstadoCategoriaBadge } from './EstadoCategoriaBadge';
import { CategoriaEstadoControl } from './CategoriaEstadoControl';
import { useCategoria } from '../hooks/useCategoria';
import { useCategoriasSelector } from '../hooks/useCategoriasSelector';
import type { CategoriaDTO } from '../types/categoria.types';

interface CategoriaDetalleModalProps {
  categoriaId: string | null;
  onClose: () => void;
  onEditar: (categoria: CategoriaDTO) => void;
  onEliminar: (categoria: CategoriaDTO) => void;
  puedeEditar: boolean;
  puedeEliminar: boolean;
  puedeCambiarEstado: boolean;
}

// Decisión del usuario: el detalle vive en una modal (no en una página propia), con el desglose de
// subcategorías cuando la categoría es raíz. `useCategoria` solo se activa mientras la modal está
// abierta (`enabled: categoriaId !== null`) — GET /:id trae `subcategorias` (activas), la misma data
// que consume CategoriaEstadoControl para decidir si hace falta confirmar la cascada.
export function CategoriaDetalleModal({
  categoriaId,
  onClose,
  onEditar,
  onEliminar,
  puedeEditar,
  puedeEliminar,
  puedeCambiarEstado,
}: CategoriaDetalleModalProps) {
  const editarBtnRef = useRef<HTMLButtonElement>(null);
  const eliminarBtnRef = useRef<HTMLButtonElement>(null);
  const [solicitud, setSolicitud] = useState<{ accion: string; origen: 'editar' | 'eliminar' } | null>(null);

  const { data: categoria, isLoading, isError } = useCategoria(categoriaId ?? undefined, { enabled: categoriaId !== null });
  // Resuelve el nombre de la categoría padre para mostrarlo en texto — GET /:id solo trae `padreId`
  // crudo. Solo se dispara cuando hay padre que resolver (`enabled`).
  const { data: raices } = useCategoriasSelector({ soloRaiz: true, limit: 50 }, Boolean(categoria?.padreId));
  const padreNombre = raices?.find((raiz) => raiz.id === categoria?.padreId)?.nombre;

  return (
    <Modal isOpen={categoriaId !== null} title={categoria?.nombre ?? 'Categoría'} onClose={onClose}>
      {isLoading && (
        <div className="flex flex-col gap-3" role="status" aria-busy="true" aria-label="Cargando categoría">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {!isLoading && (isError || !categoria) && (
        <EmptyState title="Categoría no encontrada" description="Puede que haya sido eliminada." />
      )}

      {!isLoading && categoria && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            {puedeCambiarEstado ? (
              <CategoriaEstadoControl categoria={categoria} puedeCambiarEstado={puedeCambiarEstado} />
            ) : (
              <EstadoCategoriaBadge estado={categoria.estado} />
            )}
          </div>

          {categoria.descripcion && <p className="text-foreground-secondary">{categoria.descripcion}</p>}

          {categoria.padreId && (
            <p>
              <span className="text-foreground-muted">Categoría padre: </span>
              <span className="text-foreground">{padreNombre ?? '—'}</span>
            </p>
          )}

          {!categoria.padreId && (
            <div>
              <p className="mb-2 font-medium text-foreground">
                Subcategorías {categoria.subcategorias.length > 0 && `(${categoria.subcategorias.length})`}
              </p>
              {categoria.subcategorias.length === 0 ? (
                <p className="text-foreground-muted">Sin subcategorías.</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {categoria.subcategorias.map((sub) => (
                    <li key={sub.id} className="flex items-center justify-between gap-2 rounded-md bg-background-secondary px-3 py-1.5">
                      <span className="text-foreground">{sub.nombre}</span>
                      <EstadoCategoriaBadge estado={sub.estado} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            {puedeEditar ? (
              <Button ref={editarBtnRef} type="button" variant="secondary" size="sm" onClick={() => onEditar(categoria)}>
                Editar
              </Button>
            ) : (
              <LockedActionButton
                ref={editarBtnRef}
                reason="No tienes permiso para editar categorías. Solicita acceso a un administrador."
                onRequestAccess={() => setSolicitud({ accion: 'editar categorías', origen: 'editar' })}
              />
            )}

            {puedeEliminar ? (
              <Button ref={eliminarBtnRef} type="button" variant="danger" size="sm" onClick={() => onEliminar(categoria)}>
                Eliminar
              </Button>
            ) : (
              <LockedActionButton
                ref={eliminarBtnRef}
                reason="No tienes permiso para eliminar categorías. Solicita acceso a un administrador."
                onRequestAccess={() => setSolicitud({ accion: 'eliminar categorías', origen: 'eliminar' })}
              />
            )}
          </div>
        </div>
      )}

      <SolicitarAccesoModal
        isOpen={solicitud !== null}
        accion={solicitud?.accion ?? ''}
        onClose={() => setSolicitud(null)}
        originRef={solicitud?.origen === 'eliminar' ? eliminarBtnRef : editarBtnRef}
      />
    </Modal>
  );
}
