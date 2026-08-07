import { useRef, useState } from 'react';
import { DataTable, DataTableToolbar } from '../../../components/DataTable';
import { FilterPopover } from '../../../components/FilterPopover';
import { Button } from '../../../components/Button';
import { EmptyState } from '../../../components/EmptyState';
import { LockedActionButton } from '../../../components/LockedActionButton';
import { SolicitarAccesoModal } from '../../../components/SolicitarAccesoModal';
import { Tooltip } from '../../../components/Tooltip';
import { PlusIcon } from '../../../components/icons';
import { almacenesTableColumns } from './almacenesTableColumns';
import { AlmacenesFiltrosContent, type AlmacenesFiltrosDraft } from './AlmacenesFiltrosContent';
import { AlmacenFormModal } from './AlmacenFormModal';
import { useAlmacenesDeSucursal } from '../hooks/useAlmacenesDeSucursal';
import { useDebounce } from '../../../hooks/useDebounce';
import type { AlmacenDTO } from '../types/sucursal.types';

interface SucursalAlmacenesTabProps {
  sucursalId: string;
  sucursalActiva: boolean;
  puedeCrear: boolean;
  puedeEditar: boolean;
  puedeCambiarEstado: boolean;
}

// SPEC-012 REQ-U7 — tabla de almacenes de la sucursal (GET /sucursales/:sucursalId/almacenes),
// independiente del arreglo embebido en SucursalConAlmacenesDTO. Clic en fila abre AlmacenFormModal
// en modo editar (REQ-E6); "+ Agregar" lo abre en modo crear (REQ-E7); REQ-S4 deshabilita "Agregar"
// mientras la sucursal esté inactiva.
export function SucursalAlmacenesTab({
  sucursalId,
  sucursalActiva,
  puedeCrear,
  puedeEditar,
  puedeCambiarEstado,
}: SucursalAlmacenesTabProps) {
  const agregarBtnRef = useRef<HTMLButtonElement>(null);
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 400);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [appliedFiltros, setAppliedFiltros] = useState<AlmacenesFiltrosDraft>({});
  const [draftFiltros, setDraftFiltros] = useState<AlmacenesFiltrosDraft>({});
  const [modal, setModal] = useState<{ mode: 'crear' | 'editar'; almacen: AlmacenDTO | null } | null>(null);
  const [solicitudAccion, setSolicitudAccion] = useState<string | null>(null);

  const filtrosActivos = Object.values(appliedFiltros).filter((v) => v !== undefined).length;
  const hayBusquedaOFiltros = Boolean(debouncedQ) || filtrosActivos > 0;

  const { data, isLoading, isError, refetch } = useAlmacenesDeSucursal(sucursalId, {
    q: debouncedQ || undefined,
    page,
    limit,
    ...appliedFiltros,
  });

  if (isError) {
    return (
      <EmptyState
        title="No se pudieron cargar los almacenes"
        description="Ocurrió un error al conectar con el servidor."
        action={
          <Button size="sm" onClick={() => refetch()}>
            Reintentar
          </Button>
        }
      />
    );
  }

  const sinAlmacenes = !hayBusquedaOFiltros && !isLoading && data?.meta.total === 0;

  const botonAgregar = puedeCrear ? (
    <Tooltip content={sucursalActiva ? 'Agregar almacén' : 'No se pueden agregar almacenes a una sucursal inactiva'}>
      <span>
        <Button
          ref={agregarBtnRef}
          size="sm"
          disabled={!sucursalActiva}
          onClick={() => setModal({ mode: 'crear', almacen: null })}
        >
          <PlusIcon className="h-4 w-4" />
          Agregar
        </Button>
      </span>
    </Tooltip>
  ) : (
    <LockedActionButton
      ref={agregarBtnRef}
      reason="No tienes permiso para agregar almacenes. Solicita acceso a un administrador."
      onRequestAccess={() => setSolicitudAccion('agregar almacenes')}
    />
  );

  return (
    <div className="flex flex-col gap-4">
      <DataTableToolbar
        searchValue={q}
        onSearchChange={(value) => {
          setQ(value);
          setPage(1);
        }}
        searchLabel="Buscar almacenes"
        searchPlaceholder="Buscar por nombre o código..."
        filterPopover={
          <FilterPopover
            activeCount={filtrosActivos}
            onApply={() => {
              setAppliedFiltros(draftFiltros);
              setPage(1);
            }}
            onClear={() => setDraftFiltros({})}
          >
            <AlmacenesFiltrosContent draft={draftFiltros} onChange={setDraftFiltros} />
          </FilterPopover>
        }
        primaryAction={sinAlmacenes ? undefined : botonAgregar}
      />

      {sinAlmacenes ? (
        <EmptyState title="Esta sucursal no tiene almacenes propios todavía" action={botonAgregar} />
      ) : (
        <DataTable
          columns={almacenesTableColumns}
          data={data?.almacenes ?? []}
          keyField="id"
          isLoading={isLoading}
          onRowClick={puedeEditar ? (row) => setModal({ mode: 'editar', almacen: row }) : undefined}
          emptyState={
            <EmptyState
              title="No se encontraron almacenes con estos filtros"
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

      <AlmacenFormModal
        isOpen={modal !== null}
        mode={modal?.mode ?? 'crear'}
        sucursalId={sucursalId}
        almacen={modal?.almacen}
        puedeCambiarEstado={puedeCambiarEstado}
        onClose={() => setModal(null)}
        onSaved={() => setModal(null)}
        originRef={agregarBtnRef}
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
