import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { RefObject } from 'react';
import { Modal } from '../../../components/Modal';
import { Input } from '../../../components/Input';
import { Select } from '../../../components/Select';
import { Button } from '../../../components/Button';
import { SaveIcon } from '../../../components/icons';
import { crearCategoriaSchema, type CrearCategoriaValues } from '../schemas/crearCategoria.schema';
import { useCrearCategoria } from '../hooks/useCrearCategoria';
import { useCategoriasSelector } from '../hooks/useCategoriasSelector';
import { applyCategoriaApiError } from '../hooks/applyCategoriaApiError';
import type { CategoriaDTO } from '../types/categoria.types';

interface SubcategoriaQuickCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (categoria: CategoriaDTO) => void;
  defaultPadreId?: string;
  originRef?: RefObject<HTMLElement | null>;
}

// Registro rápido de subcategoría — a diferencia de CategoriaQuickCreateModal, sí incluye el
// selector "Categoría padre" (requerido, precargado con la categoría activa del formulario que
// disparó la modal, pero bloqueado en ese contexto — ver comentario más abajo). SPEC-001 (Design
// System) — el consumidor lo renderiza SIEMPRE, mismo criterio que CategoriaQuickCreateModal
// (permite la animación de salida del `Modal` interno); el formulario se resetea al abrir.
export function SubcategoriaQuickCreateModal({ isOpen, onClose, onCreated, defaultPadreId, originRef }: SubcategoriaQuickCreateModalProps) {
  const crearCategoria = useCrearCategoria();
  const { data: raices, isLoading: raicesLoading } = useCategoriasSelector({ soloRaiz: true, limit: 50 });
  const raizOptions = (raices ?? []).map((raiz) => ({ value: raiz.id, label: raiz.nombre }));

  const form = useForm<CrearCategoriaValues>({
    resolver: zodResolver(crearCategoriaSchema),
    defaultValues: { padreId: defaultPadreId },
  });

  useEffect(() => {
    if (isOpen) form.reset({ padreId: defaultPadreId });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `form` se asume estable por invocación de useForm; solo debe re-ejecutar cuando `isOpen`/`defaultPadreId` cambian
  }, [isOpen, defaultPadreId]);

  function onSubmit(values: CrearCategoriaValues) {
    crearCategoria.mutate(values, {
      onSuccess: (categoria) => {
        toast.success('Subcategoría creada');
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
    <Modal isOpen={isOpen} title="Nueva subcategoría" onClose={onClose} originRef={originRef}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Controller
          control={form.control}
          name="padreId"
          render={({ field }) => (
            <Select
              label="Categoría padre"
              required
              options={raizOptions}
              value={field.value}
              onChange={field.onChange}
              // Bloqueado cuando llega precargado desde un contexto ya determinado (ej. el botón "+"
              // de SubcategoriaSelect, que solo se habilita con una categoría ya elegida en el
              // formulario que lo contiene) — evita crear una subcategoría cuyo padre real no
              // coincida con la categoría que el formulario de origen espera seleccionar después.
              isDisabled={raicesLoading || Boolean(defaultPadreId)}
              error={form.formState.errors.padreId?.message}
            />
          )}
        />
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
