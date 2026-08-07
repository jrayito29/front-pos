import { describe, expect, it } from 'vitest';
import { buildDireccionCompleta } from '../../src/lib/buildDireccionCompleta';

const base = {
  calle: 'Av. Juárez',
  numeroExterior: '123',
  colonia: 'Centro',
  municipio: 'Monterrey',
  estado: 'Nuevo León',
  codigoPostal: '64000',
};

// spec:SPEC-012:REQ-U5 — direccionCompleta es estado derivable, nunca un input propio.
describe('buildDireccionCompleta', () => {
  it('compone calle, número exterior, colonia, municipio, estado y código postal', () => {
    expect(buildDireccionCompleta(base)).toBe('Av. Juárez 123, Col. Centro, Monterrey, Nuevo León 64000');
  });

  it('inserta "Int." antes del número interior cuando está presente', () => {
    expect(buildDireccionCompleta({ ...base, numeroInterior: '4B' })).toBe(
      'Av. Juárez 123 Int. 4B, Col. Centro, Monterrey, Nuevo León 64000'
    );
  });

  it('omite el segmento de número interior cuando no se proporciona', () => {
    const conVacio = buildDireccionCompleta({ ...base, numeroInterior: undefined });
    const sinCampo = buildDireccionCompleta(base);
    expect(conVacio).toBe(sinCampo);
    expect(conVacio).not.toContain('Int.');
  });

  it('devuelve string vacío cuando ningún campo de dirección tiene valor (sin formulario aún tocado)', () => {
    expect(
      buildDireccionCompleta({
        calle: '',
        numeroExterior: '',
        colonia: '',
        municipio: '',
        estado: '',
        codigoPostal: '',
      })
    ).toBe('');
  });

  // spec:SPEC-012:REQ-E10 — se recalcula ante cualquier cambio de los campos que lo componen.
  it('recalcula el resultado cuando cambia cualquiera de los 7 campos de entrada', () => {
    const original = buildDireccionCompleta(base);
    const conOtraColonia = buildDireccionCompleta({ ...base, colonia: 'Del Valle' });
    const conOtroCP = buildDireccionCompleta({ ...base, codigoPostal: '66220' });

    expect(conOtraColonia).not.toBe(original);
    expect(conOtraColonia).toContain('Del Valle');
    expect(conOtroCP).not.toBe(original);
    expect(conOtroCP).toContain('66220');
  });
});
