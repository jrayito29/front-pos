import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { RefObject } from 'react';
import { Modal } from '../../../components/Modal';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { SaveIcon } from '../../../components/icons';
import { crearCategoriaSchema, type CrearCategoriaValues } from '../schemas/crearCategoria.schema';
import { useCrearCategoria } from '../hooks/useCrearCategoria';
import { applyCategoriaApiError } from '../hooks/applyCategoriaApiError';
import type { CategoriaDTO } from '../types/categoria.types';

interface CategoriaQuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (categoria: CategoriaDTO) => void;
  originRef?: RefObject<HTMLElement | null>;
}

// Registro rápido de categoría raíz (sin `padreId`) — disparado por el botón "+" junto al select de
// Categoría en Productos. SPEC-001 (Design System) — el consumidor lo renderiza SIEMPRE (nunca
// `{isOpen && <CategoriaQuickCreateModal .../>}`): si el wrapper se desmonta al cerrar, el `Modal`
// interno nunca llega a reproducir su animación de salida. Como ahora el componente permanece
// montado entre aperturas, el formulario se resetea explícitamente cada vez que `isOpen` pasa a
// `true` — de otro modo arrastraría lo que el usuario haya escrito la vez anterior.
export function CategoriaQuickCreateModal({ isOpen, onClose, onCreated, originRef }: CategoriaQuickCreateModalProps) {
  const crearCategoria = useCrearCategoria();
  const form = useForm<CrearCategoriaValues>({
    resolver: zodResolver(crearCategoriaSchema),
  });

  useEffect(() => {
    if (isOpen) form.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `form` se asume estable por invocación de useForm; solo debe re-ejecutar cuando `isOpen` cambia
  }, [isOpen]);

  function onSubmit(values: CrearCategoriaValues) {
    crearCategoria.mutate(values, {
      onSuccess: (categoria) => {
        toast.success('Categoría creada');
        onCreated(categoria);
        onClose();
      },
      onError: (error) => {
        const mapped = applyCategoriaApiError(error, form.setError);
        if (!mapped) toast.error(error.message);
      },
    });
  }

  return (
    <Modal isOpen={isOpen} title="Nueva categoría" onClose={onClose} originRef={originRef}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Nombre" required error={form.formState.errors.nombre?.message} {...form.register('nombre')} />
        <Input label="Descripción" error={form.formState.errors.descripcion?.message} {...form.register('descripcion')} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" isLoading={crearCategoria.isPending} loadingText="Guardando...">
            <SaveIcon className="h-4 w-4" />
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
