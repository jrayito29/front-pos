import { useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { DataTable, DataTableToolbar } from '../../../components/DataTable';
import { FilterPopover } from '../../../components/FilterPopover';
import { Button } from '../../../components/Button';
import { EmptyState } from '../../../components/EmptyState';
import { LockedActionButton } from '../../../components/LockedActionButton';
import { SolicitarAccesoModal } from '../../../components/SolicitarAccesoModal';
import { Tooltip } from '../../../components/Tooltip';
import { PlusIcon, TrashIcon } from '../../../components/icons';
import { Skeleton } from '../../../components/Skeleton';
import { productosTableColumns } from '../components/productosTableColumns';
import { ProductosFiltrosContent, type ProductosFiltrosDraft } from '../components/ProductosFiltrosContent';
import { EliminarProductoModal } from '../components/EliminarProductoModal';
import { useProductos } from '../hooks/useProductos';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePermisos, puedeAccion } from '../../auth/hooks/usePermisos';
import { productoDetalleRoute, ROUTES } from '../../../constants/routes';
import { PRODUCTO_ACCION } from '../constants/producto.constants';
import type { ProductoResumenDTO } from '../types/producto.types';

// SPEC-009 REQ-U13 a U18 — listado con DataTable genérico, toolbar de filtros y paginación server-side.
export function ProductosListPage() {
  const navigate = useNavigate();
  const { data: permisos, isLoading: isLoadingPermisos } = usePermisos();
  const agregarBtnRef = useRef<HTMLButtonElement>(null);

  const puedeVer = puedeAccion(permisos, PRODUCTO_ACCION.VER);
  const puedeCrear = puedeAccion(permisos, PRODUCTO_ACCION.CREAR);
  const puedeEliminar = puedeAccion(permisos, PRODUCTO_ACCION.ELIMINAR);

  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 400);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [appliedFiltros, setAppliedFiltros] = useState<ProductosFiltrosDraft>({});
  const [draftFiltros, setDraftFiltros] = useState<ProductosFiltrosDraft>({});
  const [productoAEliminar, setProductoAEliminar] = useState<ProductoResumenDTO | null>(null);
  const [solicitudAccion, setSolicitudAccion] = useState<string | null>(null);

  const filtrosActivos = Object.values(appliedFiltros).filter((v) => v !== undefined && v !== '').length;
  const hayBusquedaOFiltros = Boolean(debouncedQ) || filtrosActivos > 0;

  const { data, isLoading, isError, refetch } = useProductos(
    { q: debouncedQ || undefined, page, limit, ...appliedFiltros },
    { enabled: !isLoadingPermisos && puedeVer }
  );

  // REQ-S1 — skeleton mientras se resuelve el permiso, nunca redirigir antes de tener el dato real
  // (fail-closed pero sin falso negativo por carrera de carga).
  if (isLoadingPermisos) {
    return (
      <div className="flex flex-col gap-4" role="status" aria-busy="true" aria-label="Verificando permisos">
        <Skeleton className="h-10 w-full max-w-xs" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // RESPUESTA-006-cambio-permisos-productos.md — rol sin `producto.ver` (hoy: `cajero`): no debe
  // llegar al listado aunque el módulo esté activo para el tenant, mismo criterio de REQ-X5 que ya
  // aplica `ProductoCrearPage` para escritura.
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

  // Sin ningún producto registrado (sin filtros activos) — un único CTA, nunca dos con el mismo
  // objetivo (REQ-X2): la toolbar oculta "Nuevo producto" y el estado vacío es el único que lo ofrece.
  const sinProductosRegistrados = !hayBusquedaOFiltros && !isLoading && data?.meta.total === 0;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold text-foreground">Productos</h1>

      <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
        <DataTableToolbar
          searchValue={q}
          onSearchChange={(value) => {
            setQ(value);
            setPage(1);
          }}
          searchLabel="Buscar productos"
          searchPlaceholder="Buscar por nombre, SKU o código de barras..."
          filterPopover={
            <FilterPopover
              activeCount={filtrosActivos}
              onApply={() => {
                setAppliedFiltros(draftFiltros);
                setPage(1);
              }}
              onClear={() => setDraftFiltros({})}
            >
              <ProductosFiltrosContent draft={draftFiltros} onChange={setDraftFiltros} />
            </FilterPopover>
          }
          primaryAction={
            sinProductosRegistrados ? undefined : puedeCrear ? (
              <Button ref={agregarBtnRef} size="sm" onClick={() => navigate(ROUTES.PRODUCTOS_NUEVO)}>
                <PlusIcon className="h-4 w-4" />
                Agregar
              </Button>
            ) : (
              <LockedActionButton
                ref={agregarBtnRef}
                reason="No tienes permiso para agregar productos. Solicita acceso a un administrador."
                onRequestAccess={() => setSolicitudAccion('agregar productos')}
              />
            )
          }
        />

        <div className="mt-4">
          {sinProductosRegistrados ? (
            <EmptyState
              title="Aún no has registrado productos"
              description="Crea tu primer producto para empezar a construir tu catálogo."
              action={
                puedeCrear ? (
                  <Button size="sm" onClick={() => navigate(ROUTES.PRODUCTOS_NUEVO)}>
                    <PlusIcon className="h-4 w-4" />
                    Agregar
                  </Button>
                ) : (
                  <LockedActionButton
                    reason="No tienes permiso para agregar productos. Solicita acceso a un administrador."
                    onRequestAccess={() => setSolicitudAccion('agregar productos')}
                  />
                )
              }
            />
          ) : (
            <DataTable
              columns={productosTableColumns}
              data={data?.productos ?? []}
              keyField="id"
              isLoading={isLoading}
              onRowClick={(row) => navigate(productoDetalleRoute(row.id))}
              rowActions={(row) =>
                puedeEliminar ? (
                  <Tooltip content="Eliminar">
                    <Button
                      variant="danger"
                      size="sm"
                      aria-label={`Eliminar ${row.nombreCorto}`}
                      onClick={() => setProductoAEliminar(row)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </Tooltip>
                ) : (
                  <LockedActionButton
                    iconOnly
                    reason="No tienes permiso para eliminar productos. Solicita acceso a un administrador."
                    onRequestAccess={() => setSolicitudAccion('eliminar productos')}
                  />
                )
              }
              // REQ-X3 — sin resultados con filtros/búsqueda activos: CTA distinto ("Limpiar filtros").
              emptyState={
                <EmptyState
                  title="No se encontraron productos con estos filtros"
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

      <EliminarProductoModal
        producto={productoAEliminar}
        onClose={() => setProductoAEliminar(null)}
        onDeleted={() => setProductoAEliminar(null)}
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
