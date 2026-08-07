import { Navigate } from 'react-router';
import { SucursalCrearForm } from '../components/SucursalCrearForm';
import { usePermisos, puedeAccion } from '../../auth/hooks/usePermisos';
import { useBreadcrumbExtra } from '../../../hooks/useBreadcrumbExtra';
import { ROUTES } from '../../../constants/routes';
import { SUCURSAL_ACCION } from '../constants/sucursal.constants';

// SPEC-012 REQ-X3 — redirige a /sucursales si el rol no tiene permiso de escritura, en vez de
// depender únicamente de ocultar el botón "Agregar" del listado como control de acceso.
export function SucursalCrearPage() {
  const { data, isLoading } = usePermisos();
  useBreadcrumbExtra('Nueva sucursal');

  if (isLoading) return null;

  if (!puedeAccion(data, SUCURSAL_ACCION.CREAR)) return <Navigate to={ROUTES.SUCURSALES} replace />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold text-foreground">Nueva sucursal</h1>
      <SucursalCrearForm />
    </div>
  );
}
