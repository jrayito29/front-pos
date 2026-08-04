import { useState } from 'react';
import { useNavigate } from 'react-router';
import { DataTable, DataTableToolbar } from '../../../components/DataTable';
import { FilterPopover } from '../../../components/FilterPopover';
import { Button } from '../../../components/Button';
import { EmptyState } from '../../../components/EmptyState';
import { PlusIcon } from '../../../components/icons';
import { productosTableColumns } from '../components/productosTableColumns';
import { ProductosFiltrosContent, type ProductosFiltrosDraft } from '../components/ProductosFiltrosContent';
import { EliminarProductoModal } from '../components/EliminarProductoModal';
import { useProductos } from '../hooks/useProductos';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePermisos } from '../../auth/hooks/usePermisos';
import { productoDetalleRoute, ROUTES } from '../../../constants/routes';
import { PRODUCTO_ROLES_ESCRITURA } from '../constants/producto.constants';
import type { ProductoResumenDTO } from '../types/producto.types';

// SPEC-009 REQ-U13 a U18 — listado con DataTable genérico, toolbar de filtros y paginación server-side.
export function ProductosListPage() {
  const navigate = useNavigate();
  const { data: permisos } = usePermisos();
  const puedeCrear = Boolean(permisos?.role && (PRODUCTO_ROLES_ESCRITURA as readonly string[]).includes(permisos.role));

  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 400);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [appliedFiltros, setAppliedFiltros] = useState<ProductosFiltrosDraft>({});
  const [draftFiltros, setDraftFiltros] = useState<ProductosFiltrosDraft>({});
  const [productoAEliminar, setProductoAEliminar] = useState<ProductoResumenDTO | null>(null);

  const filtrosActivos = Object.values(appliedFiltros).filter((v) => v !== undefined && v !== '').length;
  const hayBusquedaOFiltros = Boolean(debouncedQ) || filtrosActivos > 0;

  const { data, isLoading, isError, refetch } = useProductos({
    q: debouncedQ || undefined,
    page,
    limit,
    ...appliedFiltros,
  });

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
            puedeCrear && !sinProductosRegistrados ? (
              <Button size="sm" onClick={() => navigate(ROUTES.PRODUCTOS_NUEVO)}>
                <PlusIcon className="h-4 w-4" />
                Agregar
              </Button>
            ) : undefined
          }
        />

        <div className="mt-4">
          {sinProductosRegistrados ? (
            <EmptyState
              title="Aún no has registrado productos"
              description="Crea tu primer producto para empezar a construir tu catálogo."
              action={
                puedeCrear && (
                  <Button size="sm" onClick={() => navigate(ROUTES.PRODUCTOS_NUEVO)}>
                    <PlusIcon className="h-4 w-4" />
                    Agregar
                  </Button>
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
              rowActions={
                puedeCrear
                  ? (row) => (
                      <Button variant="ghost" size="sm" onClick={() => setProductoAEliminar(row)}>
                        Eliminar
                      </Button>
                    )
                  : undefined
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
    </div>
  );
}
