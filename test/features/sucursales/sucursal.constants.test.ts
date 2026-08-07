import { describe, expect, it } from 'vitest';
import {
  ALMACENES_DEFAULT_INFO,
  ALMACEN_ACCION,
  ALMACEN_ERRORS,
  ALMACEN_ERROR_CODE_TO_FIELD,
  SUCURSAL_ACCION,
  SUCURSAL_ERRORS,
  SUCURSAL_ERROR_CODE_TO_FIELD,
  TIPO_ALMACEN,
  TIPO_ALMACEN_LABEL,
} from '../../../src/features/sucursales/constants/sucursal.constants';

// spec:SPEC-012:REQ-U9
describe('SUCURSAL_ACCION / ALMACEN_ACCION', () => {
  it('cada clave de SUCURSAL_ACCION sigue el formato "sucursales.<accion>"', () => {
    Object.values(SUCURSAL_ACCION).forEach((clave) => {
      expect(clave).toMatch(/^sucursales\.[a-z_]+$/);
    });
  });

  it('cada clave de ALMACEN_ACCION sigue el formato "almacenes.<accion>"', () => {
    Object.values(ALMACEN_ACCION).forEach((clave) => {
      expect(clave).toMatch(/^almacenes\.[a-z_]+$/);
    });
  });

  it('ambos catálogos exponen las mismas 4 acciones (ver/crear/editar/cambiar_estado)', () => {
    expect(SUCURSAL_ACCION).toEqual({
      VER: 'sucursales.ver',
      CREAR: 'sucursales.crear',
      EDITAR: 'sucursales.editar',
      CAMBIAR_ESTADO: 'sucursales.cambiar_estado',
    });
    expect(ALMACEN_ACCION).toEqual({
      VER: 'almacenes.ver',
      CREAR: 'almacenes.crear',
      EDITAR: 'almacenes.editar',
      CAMBIAR_ESTADO: 'almacenes.cambiar_estado',
    });
  });
});

// spec:SPEC-012:REQ-X4 — apunta a "codigoSufijo" (nombre del campo en el formulario RHF), no a
// "codigoPersonalizable" (nombre del campo en el payload de la API): son distintos a propósito.
describe('SUCURSAL_ERROR_CODE_TO_FIELD', () => {
  it('mapea código duplicado y prefijo inválido al campo "codigoSufijo"', () => {
    expect(SUCURSAL_ERROR_CODE_TO_FIELD[SUCURSAL_ERRORS.CODIGO_DUPLICADO]).toBe('codigoSufijo');
    expect(SUCURSAL_ERROR_CODE_TO_FIELD[SUCURSAL_ERRORS.CODIGO_PREFIJO_INVALIDO]).toBe('codigoSufijo');
  });

  it('NO mapea códigos sin campo de formulario asociado (NOT_FOUND/INACTIVA — se resuelven por toast)', () => {
    expect(SUCURSAL_ERROR_CODE_TO_FIELD[SUCURSAL_ERRORS.NOT_FOUND]).toBeUndefined();
    expect(SUCURSAL_ERROR_CODE_TO_FIELD[SUCURSAL_ERRORS.INACTIVA]).toBeUndefined();
  });
});

// spec:SPEC-012:REQ-X5
describe('ALMACEN_ERROR_CODE_TO_FIELD', () => {
  it('mapea código duplicado al campo "codigoPersonalizable"', () => {
    expect(ALMACEN_ERROR_CODE_TO_FIELD[ALMACEN_ERRORS.CODIGO_DUPLICADO]).toBe('codigoPersonalizable');
  });

  it('NO mapea TIPO_DUPLICADO/CON_STOCK/NOT_FOUND — se resuelven por toast (red de seguridad)', () => {
    expect(ALMACEN_ERROR_CODE_TO_FIELD[ALMACEN_ERRORS.TIPO_DUPLICADO]).toBeUndefined();
    expect(ALMACEN_ERROR_CODE_TO_FIELD[ALMACEN_ERRORS.CON_STOCK]).toBeUndefined();
    expect(ALMACEN_ERROR_CODE_TO_FIELD[ALMACEN_ERRORS.NOT_FOUND]).toBeUndefined();
  });
});

describe('TIPO_ALMACEN_LABEL', () => {
  it('tiene una etiqueta en español para cada valor de TIPO_ALMACEN', () => {
    Object.values(TIPO_ALMACEN).forEach((tipo) => {
      expect(TIPO_ALMACEN_LABEL[tipo]).toEqual(expect.any(String));
      expect(TIPO_ALMACEN_LABEL[tipo].length).toBeGreaterThan(0);
    });
  });
});

// spec:SPEC-012:REQ-U8
describe('ALMACENES_DEFAULT_INFO', () => {
  it('Ventas es el primer elemento (almacén principal)', () => {
    expect(ALMACENES_DEFAULT_INFO[0].tipo).toBe(TIPO_ALMACEN.VENTAS);
  });

  it('Ventas, Mermas y Tránsito son obligatorios y sin flag', () => {
    const obligatorios = ALMACENES_DEFAULT_INFO.filter((a) => a.obligatorio);
    expect(obligatorios.map((a) => a.tipo)).toEqual([TIPO_ALMACEN.VENTAS, TIPO_ALMACEN.MERMAS, TIPO_ALMACEN.TRANSITO]);
    obligatorios.forEach((a) => expect(a.flag).toBeUndefined());
  });

  it('Reserva y Apartados son opcionales, cada uno con su propio flag', () => {
    const opcionales = ALMACENES_DEFAULT_INFO.filter((a) => !a.obligatorio);
    expect(opcionales).toEqual([
      expect.objectContaining({ tipo: TIPO_ALMACEN.RESERVA, flag: 'incluirReserva' }),
      expect.objectContaining({ tipo: TIPO_ALMACEN.APARTADOS, flag: 'incluirApartados' }),
    ]);
  });
});
