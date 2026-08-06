import { useRef, useState } from 'react';
import { DataTable, DataTableToolbar } from '../../../components/DataTable';
import { FilterPopover } from '../../../components/FilterPopover';
import { Button } from '../../../components/Button';
import { EmptyState } from '../../../components/EmptyState';
import { Tooltip } from '../../../components/Tooltip';
import { PlusIcon, TrashIcon } from '../../../components/icons';
import { usuariosTableColumns } from '../components/usuariosTableColumns';
import { UsuariosFiltrosContent, type UsuariosFiltrosDraft } from '../components/UsuariosFiltrosContent';
import { UsuarioFormModal } from '../components/UsuarioFormModal';
import { UsuarioCreadoModal } from '../components/UsuarioCreadoModal';
import { UsuarioDetalleModal } from '../components/UsuarioDetalleModal';
import { DesactivarUsuarioModal } from '../components/DesactivarUsuarioModal';
import { useUsuarios } from '../hooks/useUsuarios';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePermisos } from '../../auth/hooks/usePermisos';
import { useSessionStore } from '../../../stores/session.store';
import type { UsuarioCreadoDTO, UsuarioListItemDTO } from '../types/usuario.types';

// SPEC-011 — decisión de producto: crear/detalle viven en modales sobre este único listado (no en
// rutas propias, mismo criterio que Categorías). A diferencia de esa feature, este módulo no tiene
// catálogo USUARIO_ACCION/puedeAccion (REQ-U3): el gate real ya ocurrió en la ruta
// (app/RequireRole role="superadmin"), esta vista solo replica el mismo criterio defensivo de
// `enabled` que useCategorias/useProductos aplican sobre su propio catálogo de permisos.
export function UsuariosListPage() {
  const { data: permisos } = usePermisos();
  const usuarioIdSesion = useSessionStore((state) => state.usuarioId);
  const agregarBtnRef = useRef<HTMLButtonElement>(null);

  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 400);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [appliedFiltros, setAppliedFiltros] = useState<UsuariosFiltrosDraft>({});
  const [draftFiltros, setDraftFiltros] = useState<UsuariosFiltrosDraft>({});

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [usuarioCreado, setUsuarioCreado] = useState<UsuarioCreadoDTO | null>(null);
  const [usuarioIdEnDetalle, setUsuarioIdEnDetalle] = useState<string | null>(null);
  const [usuarioADesactivar, setUsuarioADesactivar] = useState<{ id: string; nombre: string } | null>(null);

  const filtrosActivos = Object.values(appliedFiltros).filter((v) => v !== undefined && v !== '').length;
  const hayBusquedaOFiltros = Boolean(debouncedQ) || filtrosActivos > 0;

  const { data, isLoading, isError, refetch } = useUsuarios(
    { search: debouncedQ || undefined, page, limit, ...appliedFiltros },
    { enabled: permisos?.role === 'superadmin' }
  );

  if (isError) {
    return (
      <EmptyState
        title="No se pudo cargar el listado"
        description="Ocurrió un error al conectar con el servidor."
        action={
          <Button size="sm" onClick={() => refetch()}>
            Reintentar
          </Button>
        }
      />
    );
  }

  const sinUsuariosRegistrados = !hayBusquedaOFiltros && !isLoading && data?.meta.total === 0;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-foreground">Usuarios</h1>

      <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
        <DataTableToolbar
          searchValue={q}
          onSearchChange={(value) => {
            setQ(value);
            setPage(1);
          }}
          searchLabel="Buscar usuarios"
          searchPlaceholder="Buscar por nombre o email..."
          filterPopover={
            <FilterPopover
              activeCount={filtrosActivos}
              onApply={() => {
                setAppliedFiltros(draftFiltros);
                setPage(1);
              }}
              onClear={() => setDraftFiltros({})}
            >
              <UsuariosFiltrosContent draft={draftFiltros} onChange={setDraftFiltros} />
            </FilterPopover>
          }
          primaryAction={
            sinUsuariosRegistrados ? undefined : (
              <Button ref={agregarBtnRef} size="sm" onClick={() => setFormModalOpen(true)}>
                <PlusIcon className="h-4 w-4" />
                Agregar
              </Button>
            )
          }
        />

        <div className="mt-4">
          {sinUsuariosRegistrados ? (
            <EmptyState
              title="Aún no has creado usuarios"
              description="Crea tu primer usuario para dar acceso al sistema."
              action={
                <Button size="sm" onClick={() => setFormModalOpen(true)}>
                  <PlusIcon className="h-4 w-4" />
                  Agregar
                </Button>
              }
            />
          ) : (
            <DataTable
              columns={usuariosTableColumns}
              data={data?.usuarios ?? []}
              keyField="usuarioId"
              isLoading={isLoading}
              onRowClick={(row: UsuarioListItemDTO) => setUsuarioIdEnDetalle(row.usuarioId)}
              rowActions={(row: UsuarioListItemDTO) =>
                row.usuarioId === usuarioIdSesion ? (
                  <Tooltip content="No puedes desactivar tu propia cuenta">
                    <Button variant="danger" size="sm" aria-label="Desactivar (bloqueado)" disabled>
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </Tooltip>
                ) : (
                  <Tooltip content="Desactivar">
                    <Button
                      variant="danger"
                      size="sm"
                      aria-label={`Desactivar ${row.nombre}`}
                      onClick={() => setUsuarioADesactivar({ id: row.usuarioId, nombre: `${row.nombre} ${row.apellidoPaterno}` })}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </Tooltip>
                )
              }
              emptyState={
                <EmptyState
                  title="No se encontraron usuarios con estos filtros"
                  action={
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setQ('');
                        setAppliedFiltros({});
                        setDraftFiltros({});
                        setPage(1);
                      }}
                    >
                      Limpiar
                    </Button>
                  }
                />
              }
              pagination={{
                page,
                limit,
                total: data?.meta.total ?? 0,
                onPageChange: setPage,
                onLimitChange: (newLimit) => {
                  setLimit(newLimit);
                  setPage(1);
                },
              }}
            />
          )}
        </div>
      </div>

      <UsuarioFormModal
        isOpen={formModalOpen}
        originRef={agregarBtnRef}
        onClose={() => setFormModalOpen(false)}
        onCreated={(creado) => setUsuarioCreado(creado)}
      />

      <UsuarioCreadoModal usuario={usuarioCreado} onClose={() => setUsuarioCreado(null)} />

      <UsuarioDetalleModal
        usuarioId={usuarioIdEnDetalle}
        onClose={() => setUsuarioIdEnDetalle(null)}
        onDesactivar={(usuario) => {
          setUsuarioIdEnDetalle(null);
          setUsuarioADesactivar(usuario);
        }}
      />

      <DesactivarUsuarioModal
        usuario={usuarioADesactivar}
        onClose={() => setUsuarioADesactivar(null)}
        onDesactivado={() => setUsuarioADesactivar(null)}
      />
    </div>
  );
}
