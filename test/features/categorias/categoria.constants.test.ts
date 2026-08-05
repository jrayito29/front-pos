import { describe, expect, it } from 'vitest';
import {
  CATEGORIA_ACCION,
  CATEGORIA_ERROR_CODE_TO_FIELD,
  CATEGORIA_ERRORS,
} from '../../../src/features/categorias/constants/categoria.constants';

describe('CATEGORIA_ACCION — spec:SPEC-010:REQ-U9', () => {
  it('cada clave sigue el formato "categorias.<accion>" del catálogo dinámico de SPEC-020/SPEC-003', () => {
    Object.values(CATEGORIA_ACCION).forEach((clave) => {
      expect(clave).toMatch(/^categorias\.[a-z_]+$/);
    });
  });

  it('expone las 5 acciones documentadas en SPEC-020 §Roles por Operación', () => {
    expect(CATEGORIA_ACCION).toEqual({
      VER: 'categorias.ver',
      CREAR: 'categorias.crear',
      EDITAR: 'categorias.editar',
      CAMBIAR_ESTADO: 'categorias.cambiar_estado',
      ELIMINAR: 'categorias.eliminar',
    });
  });
});

// spec:SPEC-010:REQ-X4 — códigos de negocio mapeables a un campo del formulario
describe('CATEGORIA_ERROR_CODE_TO_FIELD', () => {
  it('mapea nombre duplicado al campo "nombre"', () => {
    expect(CATEGORIA_ERROR_CODE_TO_FIELD[CATEGORIA_ERRORS.NOMBRE_DUPLICADO]).toBe('nombre');
  });

  it('mapea los 3 códigos de jerarquía inválida al campo "padreId"', () => {
    expect(CATEGORIA_ERROR_CODE_TO_FIELD[CATEGORIA_ERRORS.PADRE_NOT_FOUND]).toBe('padreId');
    expect(CATEGORIA_ERROR_CODE_TO_FIELD[CATEGORIA_ERRORS.JERARQUIA_EXCEDIDA]).toBe('padreId');
    expect(CATEGORIA_ERROR_CODE_TO_FIELD[CATEGORIA_ERRORS.PADRE_INVALIDO]).toBe('padreId');
  });

  // spec:SPEC-010:REQ-X5 — códigos sin campo de formulario asociado (deben resolverse por toast)
  it('NO mapea códigos sin campo de formulario asociado (con/producto/confirmación)', () => {
    expect(CATEGORIA_ERROR_CODE_TO_FIELD[CATEGORIA_ERRORS.CON_SUBCATEGORIAS_ACTIVAS]).toBeUndefined();
    expect(CATEGORIA_ERROR_CODE_TO_FIELD[CATEGORIA_ERRORS.CON_PRODUCTOS_ASOCIADOS]).toBeUndefined();
    expect(CATEGORIA_ERROR_CODE_TO_FIELD[CATEGORIA_ERRORS.CONFIRMACION_REQUERIDA]).toBeUndefined();
  });
});
