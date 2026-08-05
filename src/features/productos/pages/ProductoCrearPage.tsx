import { Navigate } from 'react-router';
import { ProductoCrearForm } from '../components/ProductoCrearForm';
import { usePermisos, puedeAccion } from '../../auth/hooks/usePermisos';
import { ROUTES } from '../../../constants/routes';
import { PRODUCTO_ACCION } from '../constants/producto.constants';

// SPEC-009 REQ-X5 — redirige a /productos si el rol no tiene permiso de escritura, en vez de
// depender únicamente de ocultar el botón "Nuevo producto" del listado como control de acceso.
export function ProductoCrearPage() {
  const { data, isLoading } = usePermisos();

  if (isLoading) return null;

  if (!puedeAccion(data, PRODUCTO_ACCION.CREAR)) return <Navigate to={ROUTES.PRODUCTOS} replace />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-lg font-semibold text-foreground">Nuevo producto</h1>
      <ProductoCrearForm />
    </div>
  );
}
