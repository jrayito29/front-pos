import { useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { DataTable, DataTableToolbar } from '../../../components/DataTable';
import { FilterPopover } from '../../../components/FilterPopover';
import { Button } from '../../../components/Button';
import { EmptyState } from '../../../components/EmptyState';
import { LockedActionButton } from '../../../components/LockedActionButton';
import { SolicitarAccesoModal } from '../../../components/SolicitarAccesoModal';
import { PlusIcon } from '../../../components/icons';
import { Skeleton } from '../../../components/Skeleton';
import { sucursalesTableColumns } from '../components/sucursalesTableColumns';
import { SucursalesFiltrosContent, type SucursalesFiltrosDraft } from '../components/SucursalesFiltrosContent';
import { useSucursales } from '../hooks/useSucursales';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePermisos, puedeAccion } from '../../auth/hooks/usePermisos';
import { sucursalDetalleRoute, ROUTES } from '../../../constants/routes';
import { SUCURSAL_ACCION } from '../constants/sucursal.constants';

// SPEC-012 REQ-U1 a U3 — listado con DataTable genérico, toolbar de filtros y paginación
// server-side. Sin columna de acciones/eliminar: el módulo no expone DELETE (api-pos SPEC-014).
export function SucursalesListPage() {
  const navigate = useNavigate();
  const { data: permisos, isLoading: isLoadingPermisos } = usePermisos();
  const agregarBtnRef = useRef<HTMLButtonElement>(null);

  const puedeVer = puedeAccion(permisos, SUCURSAL_ACCION.VER);
  const puedeCrear = puedeAccion(permisos, SUCURSAL_ACCION.CREAR);

  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 400);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [appliedFiltros, setAppliedFiltros] = useState<SucursalesFiltrosDraft>({});
  const [draftFiltros, setDraftFiltros] = useState<SucursalesFiltrosDraft>({});
  const [solicitudAccion, setSolicitudAccion] = useState<string | null>(null);

  const filtrosActivos = Object.values(appliedFiltros).filter((v) => v !== undefined).length;
  const hayBusquedaOFiltros = Boolean(debouncedQ) || filtrosActivos > 0;

  const { data, isLoading, isError, refetch } = useSucursales(
    { q: debouncedQ || undefined, page, limit, ...appliedFiltros },
    { enabled: !isLoadingPermisos && puedeVer }
  );

  // REQ-S1 — skeleton mientras se resuelve el permiso, nunca redirigir antes de tener el dato real.
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

  // REQ-X1 — error de red/servidor: no se renderiza DataTable, bloque de error con "Reintentar".
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

  const sinSucursalesRegistradas = !hayBusquedaOFiltros && !isLoading && data?.meta.total === 0;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-foreground">Sucursales</h1>

      <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
        <DataTableToolbar
          searchValue={q}
          onSearchChange={(value) => {
            setQ(value);
            setPage(1);
          }}
          searchLabel="Buscar sucursales"
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
              <SucursalesFiltrosContent draft={draftFiltros} onChange={setDraftFiltros} />
            </FilterPopover>
          }
          primaryAction={
            sinSucursalesRegistradas ? undefined : puedeCrear ? (
              <Button ref={agregarBtnRef} size="sm" onClick={() => navigate(ROUTES.SUCURSALES_NUEVO)}>
                <PlusIcon className="h-4 w-4" />
                Agregar
              </Button>
            ) : (
              <LockedActionButton
                ref={agregarBtnRef}
                reason="No tienes permiso para agregar sucursales. Solicita acceso a un administrador."
                onRequestAccess={() => setSolicitudAccion('agregar sucursales')}
              />
            )
          }
        />

        <div className="mt-4">
          {sinSucursalesRegistradas ? (
            <EmptyState
              title="Aún no has registrado sucursales"
              description="Crea tu primera sucursal para empezar a operar."
              action={
                puedeCrear ? (
                  <Button size="sm" onClick={() => navigate(ROUTES.SUCURSALES_NUEVO)}>
                    <PlusIcon className="h-4 w-4" />
                    Agregar
                  </Button>
                ) : (
                  <LockedActionButton
                    reason="No tienes permiso para agregar sucursales. Solicita acceso a un administrador."
                    onRequestAccess={() => setSolicitudAccion('agregar sucursales')}
                  />
                )
              }
            />
          ) : (
            <DataTable
              columns={sucursalesTableColumns}
              data={data?.sucursales ?? []}
              keyField="id"
              isLoading={isLoading}
              onRowClick={(row) => navigate(sucursalDetalleRoute(row.id))}
              // REQ-X2 — sin resultados con filtros/búsqueda activos: CTA distinto ("Limpiar").
              emptyState={
                <EmptyState
                  title="No se encontraron sucursales con estos filtros"
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

      <SolicitarAccesoModal
        isOpen={solicitudAccion !== null}
        accion={solicitudAccion ?? ''}
        onClose={() => setSolicitudAccion(null)}
        originRef={agregarBtnRef}
      />
    </div>
  );
}
