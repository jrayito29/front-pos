import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Button } from '../../../components/Button';
import { productoDetalleRoute, ROUTES } from '../../../constants/routes';
import { crearProductoSchema, type CrearProductoInput, type CrearProductoOutput } from '../schemas/crearProducto.schema';
import { useCrearProducto } from '../hooks/useCrearProducto';
import { applyProductoApiError } from '../hooks/applyProductoApiError';
import { TIPO_PRODUCTO } from '../constants/producto.constants';
import { ProductoIdentificacionFields } from './ProductoIdentificacionFields';
import { ProductoClasificacionFields } from './ProductoClasificacionFields';
import { ProductoCostosFields } from './ProductoCostosFields';
import { SaveIcon } from './icons';

// SPEC-009 REQ-U19 — formulario de creación completo (identificación, clasificación, costos y
// precio), organizado en secciones delimitadas por línea. Card sobre `bg-background` (blanco/
// --bg-primary), no `bg-background-secondary` — el fondo de página del shell ya es --bg-secondary
// (Shell.tsx), así que la card necesita un tono distinto para leerse como superficie elevada
// (SPEC-008 REQ-U7).
export function ProductoCrearForm() {
  const navigate = useNavigate();
  const crearProducto = useCrearProducto();

  const form = useForm<CrearProductoInput, unknown, CrearProductoOutput>({
    resolver: zodResolver(crearProductoSchema),
    defaultValues: { tipo: TIPO_PRODUCTO.FISICO, costoEstimado: '0.00', precioVenta: '0.00' },
  });

  const tipo = useWatch({ control: form.control, name: 'tipo' });

  function onSubmit(values: CrearProductoOutput) {
    crearProducto.mutate(values, {
      onSuccess: (producto) => {
        toast.success('Producto creado', {
          action: { label: 'Ir al listado', onClick: () => navigate(ROUTES.PRODUCTOS) },
        });
        navigate(productoDetalleRoute(producto.id));
      },
      onError: (error) => {
        const mapped = applyProductoApiError(error, form.setError);
        if (!mapped) toast.error(error.message);
      },
    });
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex max-w flex-col gap-6 rounded-lg border border-border bg-background p-6 shadow-sm"
      >
        <ProductoIdentificacionFields tipo={tipo} />
        <ProductoClasificacionFields tipo={tipo} />
        <ProductoCostosFields tipo={tipo} />

        <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
          <p className="text-xs text-foreground-muted">
            <span className="text-brand-coral-text">*</span> Campos requeridos
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => navigate(ROUTES.PRODUCTOS)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" isLoading={crearProducto.isPending} loadingText="Creando...">
              <SaveIcon className="h-4 w-4" />
              Guardar
            </Button>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
