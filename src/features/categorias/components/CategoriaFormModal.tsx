import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { RefObject } from 'react';
import { Modal } from '../../../components/Modal';
import { Input } from '../../../components/Input';
import { Select } from '../../../components/Select';
import { Switch } from '../../../components/Switch';
import { Button } from '../../../components/Button';
import { SaveIcon } from '../../../components/icons';
import { crearCategoriaSchema, type CrearCategoriaValues } from '../schemas/crearCategoria.schema';
import { useCrearCategoria } from '../hooks/useCrearCategoria';
import { useActualizarCategoria } from '../hooks/useActualizarCategoria';
import { useCategoriasSelector } from '../hooks/useCategoriasSelector';
import { applyCategoriaApiError } from '../hooks/applyCategoriaApiError';
import { ESTADO_CATEGORIA } from '../constants/categoria.constants';
import type { CategoriaDTO } from '../types/categoria.types';

interface CategoriaFormModalProps {
  isOpen: boolean;
  mode: 'crear' | 'editar';
  categoria?: CategoriaDTO | null;
  onClose: () => void;
  onSaved: (categoria: CategoriaDTO) => void;
  originRef?: RefObject<HTMLElement | null>;
}

// Formulario único de crear/editar (decisión del usuario: pocos campos, no ameritan páginas propias
// como Productos). Reutiliza `crearCategoriaSchema` para la validación de campos en ambos modos — el
// modo edición nunca envía `padreId: null` a través del resolver (RHF solo maneja `string | undefined`
// aquí); ese caso especial ("mover a raíz") se arma a mano en `onSubmit` antes de llamar a la mutación.
export function CategoriaFormModal({ isOpen, mode, categoria, onClose, onSaved, originRef }: CategoriaFormModalProps) {
  const crearCategoria = useCrearCategoria();
  const actualizarCategoria = useActualizarCategoria();
  const isPending = crearCategoria.isPending || actualizarCategoria.isPending;

  const [esSubcategoria, setEsSubcategoria] = useState(Boolean(categoria?.padreId));

  const { data: raices, isLoading: raicesLoading } = useCategoriasSelector({ soloRaiz: true, limit: 50 }, esSubcategoria);
  const raizOptions = (raices ?? []).filter((raiz) => raiz.id !== categoria?.id).map((raiz) => ({ value: raiz.id, label: raiz.nombre }));

  // REQ-E5(a)/REQ-X10 — no se puede convertir en subcategoría (ni reasignar su padre) una categoría
  // que ya tiene subcategorías activas propias. Solo relevante en edición: crear siempre parte de una
  // categoría sin hijos todavía.
  const subcategoriasActivas = categoria?.subcategorias.filter((sub) => sub.estado === ESTADO_CATEGORIA.ACTIVO).length ?? 0;
  const jerarquiaBloqueada = mode === 'editar' && subcategoriasActivas > 0;

  const form = useForm<CrearCategoriaValues>({ resolver: zodResolver(crearCategoriaSchema) });

  // Patrón "ajustar estado durante el render" (mismo criterio que components/Modal.tsx en este mismo
  // proyecto) para `esSubcategoria` — evita el lint `react-hooks/set-state-in-effect` que dispara un
  // `setState` de React crudo dentro de un efecto. `form.reset()` sí vive en el efecto de abajo: no es
  // un setState de React, es una llamada imperativa a React Hook Form.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) setEsSubcategoria(Boolean(categoria?.padreId));
  }

  useEffect(() => {
    if (!isOpen) return;
    form.reset({
      nombre: categoria?.nombre ?? '',
      descripcion: categoria?.descripcion ?? undefined,
      padreId: categoria?.padreId ?? undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `form` se asume estable por invocación de useForm; solo debe re-ejecutar cuando `isOpen`/`categoria` cambian
  }, [isOpen, categoria]);

  function onSubmit(values: CrearCategoriaValues) {
    const padreId = esSubcategoria ? values.padreId : undefined;

    if (mode === 'crear') {
      crearCategoria.mutate(
        { nombre: values.nombre, descripcion: values.descripcion || undefined, padreId },
        {
          onSuccess: (creada) => {
            toast.success('Categoría creada');
            onSaved(creada);
            onClose();
          },
          onError: (error) => {
            const mapped = applyCategoriaApiError(error, form.setError);
            if (!mapped) toast.error(error.message);
          },
        }
      );
      return;
    }

    if (!categoria) return;
    actualizarCategoria.mutate(
      {
        id: categoria.id,
        payload: { nombre: values.nombre, descripcion: values.descripcion || undefined, padreId: padreId ?? null },
      },
      {
        onSuccess: (actualizada) => {
          toast.success('Categoría actualizada');
          onSaved(actualizada);
          onClose();
        },
        onError: (error) => {
          const mapped = applyCategoriaApiError(error, form.setError);
          if (!mapped) toast.error(error.message);
        },
      }
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      title={mode === 'crear' ? 'Nueva categoría' : `Editar ${categoria?.nombre ?? 'categoría'}`}
      onClose={onClose}
      originRef={originRef}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Nombre" required error={form.formState.errors.nombre?.message} {...form.register('nombre')} />
        <Input label="Descripción" error={form.formState.errors.descripcion?.message} {...form.register('descripcion')} />

        <Switch
          label="Es subcategoría de otra categoría"
          checked={esSubcategoria}
          onChange={(checked) => {
            if (jerarquiaBloqueada) return;
            setEsSubcategoria(checked);
            if (!checked) form.setValue('padreId', undefined);
          }}
        />
        {jerarquiaBloqueada && (
          <p className="text-xs text-foreground-muted">
            Esta categoría tiene subcategorías activas — no puede convertirse en subcategoría de otra.
          </p>
        )}

        {esSubcategoria && (
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
                isDisabled={raicesLoading || jerarquiaBloqueada}
                error={form.formState.errors.padreId?.message}
              />
            )}
          />
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" isLoading={isPending} loadingText="Guardando...">
            <SaveIcon className="h-4 w-4" />
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
