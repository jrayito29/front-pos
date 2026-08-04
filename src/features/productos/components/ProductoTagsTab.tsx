import { toast } from 'sonner';
import { TagChip } from './TagChip';
import { usePermisos } from '../../auth/hooks/usePermisos';
import { useDesasignarTag } from '../hooks/useAsignarTags';
import { PRODUCTO_ROLES_ESCRITURA } from '../constants/producto.constants';
import type { ProductoDTO } from '../types/producto.types';

// SPEC-009 §Contexto punto 6 — "quitar" es funcional (usa el `id` real que ya trae el producto
// cargado, `DELETE /:id/tags/:tagId`). "Agregar" queda deshabilitado: no existe `GET /tags` en el
// backend (prisma/seed.ts genera IDs aleatorios en tiempo de seed, no hay forma de conocerlos desde
// el front) — nunca se inventa un ID, eso produciría 404 `ERR_TAG_NOT_FOUND` garantizado.
export function ProductoTagsTab({ producto }: { producto: ProductoDTO }) {
  const { data } = usePermisos();
  const role = data?.role;
  const puedeEditar = Boolean(role && (PRODUCTO_ROLES_ESCRITURA as readonly string[]).includes(role));
  const desasignarTag = useDesasignarTag();

  function handleQuitar(tagId: string) {
    desasignarTag.mutate(
      { id: producto.id, tagId },
      {
        onSuccess: () => toast.success('Tag quitado'),
        onError: (error) => toast.error(error.message),
      }
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {producto.tags.length === 0 && <p className="text-sm text-foreground-secondary">Sin tags asignados.</p>}
        {producto.tags.map((tag) => (
          <TagChip key={tag.id} nombre={tag.nombre} color={tag.color} onRemove={puedeEditar ? () => handleQuitar(tag.id) : undefined} />
        ))}
      </div>
      {puedeEditar && (
        <p className="rounded-md bg-background-tertiary px-3.5 py-2.5 text-xs text-foreground-secondary">
          Agregar tags nuevos no está disponible todavía — el backend no expone un catálogo completo de tags
          (falta endpoint <code>GET /tags</code>). Puedes quitar los tags ya asignados.
        </p>
      )}
    </div>
  );
}
