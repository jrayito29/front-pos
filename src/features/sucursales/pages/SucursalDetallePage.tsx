import { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router';
import { Skeleton } from '../../../components/Skeleton';
import { Button } from '../../../components/Button';
import { EmptyState } from '../../../components/EmptyState';
import { Tabs, type TabItem } from '../../../components/Tabs';
import { SucursalDetalleHeader } from '../components/SucursalDetalleHeader';
import { SucursalInfoGeneralTab } from '../components/SucursalInfoGeneralTab';
import { SucursalAlmacenesTab } from '../components/SucursalAlmacenesTab';
import { useSucursal } from '../hooks/useSucursal';
import { usePermisos, puedeAccion } from '../../auth/hooks/usePermisos';
import { useBreadcrumbExtra } from '../../../hooks/useBreadcrumbExtra';
import { ROUTES } from '../../../constants/routes';
import { SUCURSAL_ACCION, ALMACEN_ACCION } from '../constants/sucursal.constants';

// SPEC-012 REQ-U6 — misma ruta/componente para Ver y Editar (dos modos, no dos rutas), mismo patrón
// que ProductoDetallePage. REQ-U7/S5 — la tab "Almacenes" solo aparece si el rol activo tiene
// `almacenes.ver`.
export function SucursalDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: permisos, isLoading: isLoadingPermisos } = usePermisos();

  const puedeVer = puedeAccion(permisos, SUCURSAL_ACCION.VER);
  const puedeEditar = puedeAccion(permisos, SUCURSAL_ACCION.EDITAR);
  const puedeCambiarEstado = puedeAccion(permisos, SUCURSAL_ACCION.CAMBIAR_ESTADO);
  const puedeVerAlmacenes = puedeAccion(permisos, ALMACEN_ACCION.VER);
  const puedeCrearAlmacenes = puedeAccion(permisos, ALMACEN_ACCION.CREAR);
  const puedeEditarAlmacenes = puedeAccion(permisos, ALMACEN_ACCION.EDITAR);
  const puedeCambiarEstadoAlmacenes = puedeAccion(permisos, ALMACEN_ACCION.CAMBIAR_ESTADO);

  const { data: sucursal, isLoading, isError } = useSucursal(id, { enabled: !isLoadingPermisos && puedeVer });
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);

  useBreadcrumbExtra(sucursal?.nombre);

  // REQ-S1 — skeleton mientras se resuelve el permiso, nunca redirigir antes de tener el dato real.
  if (isLoadingPermisos) {
    return (
      <div className="flex flex-col gap-4" role="status" aria-busy="true" aria-label="Verificando permisos">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!puedeVer) {
    return <Navigate to={ROUTES.NO_AUTORIZADO} replace />;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4" role="status" aria-busy="true" aria-label="Cargando sucursal">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // REQ-X8 — 404/sucursal de otra empresa: estado dedicado, nunca un formulario vacío.
  if (isError || !sucursal) {
    return (
      <EmptyState
        title="Sucursal no encontrada"
        description="Puede que la sucursal no exista o haya sido eliminada."
        action={
          <Button size="sm" onClick={() => navigate(ROUTES.SUCURSALES)}>
            Volver
          </Button>
        }
      />
    );
  }

  const tabs: TabItem[] = [
    { key: 'info', label: 'Información general' },
    ...(puedeVerAlmacenes ? [{ key: 'almacenes', label: `Almacenes (${sucursal.almacenes.length})` }] : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
        <SucursalDetalleHeader
          sucursal={sucursal}
          isEditing={isEditing}
          onToggleEdit={() => setIsEditing((v) => !v)}
          puedeEditar={puedeEditar}
          puedeCambiarEstado={puedeCambiarEstado}
        />

        <Tabs tabs={tabs} activeKey={activeTab} onChange={setActiveTab} />

        <div role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`} className="pt-4">
          {activeTab === 'info' && (
            <SucursalInfoGeneralTab
              sucursal={sucursal}
              isEditing={isEditing}
              onSaved={() => setIsEditing(false)}
              onCancel={() => setIsEditing(false)}
            />
          )}
          {activeTab === 'almacenes' && puedeVerAlmacenes && (
            <SucursalAlmacenesTab
              sucursalId={sucursal.id}
              sucursalActiva={sucursal.activo}
              puedeCrear={puedeCrearAlmacenes}
              puedeEditar={puedeEditarAlmacenes}
              puedeCambiarEstado={puedeCambiarEstadoAlmacenes}
            />
          )}
        </div>
      </div>
    </div>
  );
}
