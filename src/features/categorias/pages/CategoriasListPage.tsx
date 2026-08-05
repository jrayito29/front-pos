import { useRef, useState } from 'react';
import { Navigate } from 'react-router';
import { DataTable, DataTableToolbar } from '../../../components/DataTable';
import { FilterPopover } from '../../../components/FilterPopover';
import { Button } from '../../../components/Button';
import { EmptyState } from '../../../components/EmptyState';
import { LockedActionButton } from '../../../components/LockedActionButton';
import { SolicitarAccesoModal } from '../../../components/SolicitarAccesoModal';
import { Tooltip } from '../../../components/Tooltip';
import { PlusIcon, TrashIcon } from '../../../components/icons';
import { Skeleton } from '../../../components/Skeleton';
import { categoriasTableColumns } from '../components/categoriasTableColumns';
import { CategoriasFiltrosContent, type CategoriasFiltrosDraft } from '../components/CategoriasFiltrosContent';
import { CategoriaFormModal } from '../components/CategoriaFormModal';
import { CategoriaDetalleModal } from '../components/CategoriaDetalleModal';
import { EliminarCategoriaModal } from '../components/EliminarCategoriaModal';
import { useCategorias } from '../hooks/useCategorias';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePermisos, puedeAccion } from '../../auth/hooks/usePermisos';
import { ROUTES } from '../../../constants/routes';
import { CATEGORIA_ACCION } from '../constants/categoria.constants';
import type { CategoriaDTO, CategoriaResumenDTO } from '../types/categoria.types';

interface FormModalState {
  mode: 'crear' | 'editar';
  categoria?: CategoriaDTO;
}

// Decisión del usuario: crear/editar/detalle viven en modales sobre este listado (no en rutas
// propias, a diferencia de Productos) — el patrón de toolbar/filtros/tabla/paginación sí replica
// ProductosListPage 1:1.
export function CategoriasListPage() {
  const { data: permisos, isLoading: isLoadingPermisos } = usePermisos();
  const agregarBtnRef = useRef<HTMLButtonElement>(null);

  const puedeVer = puedeAccion(permisos, CATEGORIA_ACCION.VER);
  const puedeCrear = puedeAccion(permisos, CATEGORIA_ACCION.CREAR);
  const puedeEditar = puedeAccion(permisos, CATEGORIA_ACCION.EDITAR);
  const puedeEliminar = puedeAccion(permisos, CATEGORIA_ACCION.ELIMINAR);
  const puedeCambiarEstado = puedeAccion(permisos, CATEGORIA_ACCION.CAMBIAR_ESTADO);

  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 400);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [appliedFiltros, setAppliedFiltros] = useState<CategoriasFiltrosDraft>({});
  const [draftFiltros, setDraftFiltros] = useState<CategoriasFiltrosDraft>({});

  const [formModal, setFormModal] = useState<FormModalState | null>(null);
  const [categoriaIdEnDetalle, setCategoriaIdEnDetalle] = useState<string | null>(null);
  const [categoriaAEliminar, setCategoriaAEliminar] = useState<{ id: string; nombre: string } | null>(null);
  const [solicitudAccion, setSolicitudAccion] = useState<string | null>(null);

  const filtrosActivos = Object.values(appliedFiltros).filter((v) => v !== undefined && v !== '').length;
  const hayBusquedaOFiltros = Boolean(debouncedQ) || filtrosActivos > 0;

  const { data, isLoading, isError, refetch } = useCategorias(
    { q: debouncedQ || undefined, page, limit, ...appliedFiltros },
    { enabled: !isLoadingPermisos && puedeVer }
  );

  if (isLoadingPermisos) {
    return (
      <div className="flex flex-col gap-4" role="status" aria-busy="true" aria-label="Verificando permisos">
        <Skeleton className="h-10 w-full max-w-xs" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!puedeVer) {
    return <Navigate to={ROUTES.NO_AUTORIZADO} replace />;
  }

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

  const sinCategoriasRegistradas = !hayBusquedaOFiltros && !isLoading && data?.meta.total === 0;

  function abrirDetalle(row: CategoriaResumenDTO) {
    setCategoriaIdEnDetalle(row.id);
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-foreground">Categorías</h1>

      <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
        <DataTableToolbar
          searchValue={q}
          onSearchChange={(value) => {
            setQ(value);
            setPage(1);
          }}
          searchLabel="Buscar categorías"
          searchPlaceholder="Buscar por nombre..."
          filterPopover={
            <FilterPopover
              activeCount={filtrosActivos}
              onApply={() => {
                setAppliedFiltros(draftFiltros);
                setPage(1);
              }}
              onClear={() => setDraftFiltros({})}
            >
              <CategoriasFiltrosContent draft={draftFiltros} onChange={setDraftFiltros} />
            </FilterPopover>
          }
          primaryAction={
            sinCategoriasRegistradas ? undefined : puedeCrear ? (
              <Button ref={agregarBtnRef} size="sm" onClick={() => setFormModal({ mode: 'crear' })}>
                <PlusIcon className="h-4 w-4" />
                Agregar
              </Button>
            ) : (
              <LockedActionButton
                ref={agregarBtnRef}
                reason="No tienes permiso para agregar categorías. Solicita acceso a un administrador."
                onRequestAccess={() => setSolicitudAccion('agregar categorías')}
              />
            )
          }
        />

        <div className="mt-4">
          {sinCategoriasRegistradas ? (
            <EmptyState
              title="Aún no has registrado categorías"
              description="Crea tu primera categoría para empezar a organizar tu catálogo."
              action={
                puedeCrear ? (
                  <Button size="sm" onClick={() => setFormModal({ mode: 'crear' })}>
                    <PlusIcon className="h-4 w-4" />
                    Agregar
                  </Button>
                ) : (
                  <LockedActionButton
                    reason="No tienes permiso para agregar categorías. Solicita acceso a un administrador."
                    onRequestAccess={() => setSolicitudAccion('agregar categorías')}
                  />
                )
              }
            />
          ) : (
            <DataTable
              columns={categoriasTableColumns}
              data={data?.categorias ?? []}
              keyField="id"
              isLoading={isLoading}
              onRowClick={abrirDetalle}
              rowActions={(row) =>
                puedeEliminar ? (
                  <Tooltip content="Eliminar">
                    <Button
                      variant="danger"
                      size="sm"
                      aria-label={`Eliminar ${row.nombre}`}
                      onClick={() => setCategoriaAEliminar({ id: row.id, nombre: row.nombre })}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </Tooltip>
                ) : (
                  <LockedActionButton
                    iconOnly
                    reason="No tienes permiso para eliminar categorías. Solicita acceso a un administrador."
                    onRequestAccess={() => setSolicitudAccion('eliminar categorías')}
                  />
                )
              }
              emptyState={
                <EmptyState
                  title="No se encontraron categorías con estos filtros"
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

      <CategoriaFormModal
        isOpen={formModal !== null}
        mode={formModal?.mode ?? 'crear'}
        categoria={formModal?.categoria}
        originRef={agregarBtnRef}
        onClose={() => setFormModal(null)}
        onSaved={() => setFormModal(null)}
      />

      <CategoriaDetalleModal
        categoriaId={categoriaIdEnDetalle}
        onClose={() => setCategoriaIdEnDetalle(null)}
        onEditar={(categoria) => {
          setCategoriaIdEnDetalle(null);
          setFormModal({ mode: 'editar', categoria });
        }}
        onEliminar={(categoria) => {
          setCategoriaIdEnDetalle(null);
          setCategoriaAEliminar({ id: categoria.id, nombre: categoria.nombre });
        }}
        puedeEditar={puedeEditar}
        puedeEliminar={puedeEliminar}
        puedeCambiarEstado={puedeCambiarEstado}
      />

      <EliminarCategoriaModal
        categoria={categoriaAEliminar}
        onClose={() => setCategoriaAEliminar(null)}
        onDeleted={() => setCategoriaAEliminar(null)}
      />

      <SolicitarAccesoModal
        isOpen={solicitudAccion !== null}
        accion={solicitudAccion ?? ''}
        onClose={() => setSolicitudAccion(null)}
        originRef={agregarBtnRef}
      />
    </div>
  );
}
