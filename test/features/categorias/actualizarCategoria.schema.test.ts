import { describe, expect, it } from 'vitest';
import { actualizarCategoriaSchema } from '../../../src/features/categorias/schemas/actualizarCategoria.schema';

// spec:SPEC-010:REQ-U4 — actualizarCategoriaSchema valida los campos de CategoriaFormModal en modo editar
describe('actualizarCategoriaSchema', () => {
  it('acepta solo `nombre` (al menos un campo presente)', () => {
    const result = actualizarCategoriaSchema.safeParse({ nombre: 'Ropa Dama' });
    expect(result.success).toBe(true);
  });

  it('acepta `padreId: null` explícito (mover la categoría a raíz)', () => {
    const result = actualizarCategoriaSchema.safeParse({ padreId: null });
    expect(result.success).toBe(true);
  });

  it('acepta `padreId` como uuid válido', () => {
    const result = actualizarCategoriaSchema.safeParse({ padreId: '123e4567-e89b-12d3-a456-426614174000' });
    expect(result.success).toBe(true);
  });

  it('rechaza `padreId` que no es un uuid válido', () => {
    const result = actualizarCategoriaSchema.safeParse({ padreId: 'no-es-un-uuid' });
    expect(result.success).toBe(false);
  });

  // Réplica de SPEC-020 §Esquemas Zod — "al menos un campo requerido (`.refine`)"
  it('rechaza un payload vacío (ningún campo enviado)', () => {
    const result = actualizarCategoriaSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Debes modificar al menos un campo');
    }
  });

  it('rechaza `nombre` vacío cuando sí se envía', () => {
    const result = actualizarCategoriaSchema.safeParse({ nombre: '' });
    expect(result.success).toBe(false);
  });
});
