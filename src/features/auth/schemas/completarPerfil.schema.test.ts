import { describe, expect, it } from 'vitest';
import { COMPLETAR_PERFIL_DEFAULT_VALUES, completarPerfilSchema } from './completarPerfil.schema';

describe('completarPerfilSchema', () => {
  // spec:SPEC-004:REQ-U8
  it('exige nombre, apellidoPaterno y empresa.nombre con los mensajes de negocio del backend', () => {
    const result = completarPerfilSchema.safeParse(COMPLETAR_PERFIL_DEFAULT_VALUES);

    expect(result.success).toBe(false);
    if (result.success) return;

    const messages = result.error.issues.map((issue) => issue.message);
    expect(messages).toContain('El nombre es requerido');
    expect(messages).toContain('El apellido paterno es requerido');
    expect(messages).toContain('El nombre de la empresa es requerido');
  });

  // spec:SPEC-004:REQ-U8
  it('acepta el payload completo cuando solo se llenan los campos requeridos (todo lo demás es opcional)', () => {
    const result = completarPerfilSchema.safeParse({
      ...COMPLETAR_PERFIL_DEFAULT_VALUES,
      nombre: 'Ana',
      apellidoPaterno: 'García',
      empresa: { ...COMPLETAR_PERFIL_DEFAULT_VALUES.empresa, nombre: 'Deccode SA de CV' },
    });

    expect(result.success).toBe(true);
  });

  // spec:SPEC-004:REQ-U8
  it('rechaza telefono con letras o signos, y con longitud distinta de 10 dígitos', () => {
    const base = {
      ...COMPLETAR_PERFIL_DEFAULT_VALUES,
      nombre: 'Ana',
      apellidoPaterno: 'García',
      empresa: { ...COMPLETAR_PERFIL_DEFAULT_VALUES.empresa, nombre: 'Deccode SA de CV' },
    };

    for (const telefono of ['55abc12345', '+525512345678', '551234567', '55123456789']) {
      const result = completarPerfilSchema.safeParse({ ...base, telefono });
      expect(result.success).toBe(false);
      if (result.success) continue;
      expect(result.error.issues.map((issue) => issue.message)).toContain('El teléfono debe tener 10 dígitos');
    }
  });

  // spec:SPEC-004:REQ-U8
  it('acepta telefono de 10 dígitos y limpia espacios/guiones antes de validar', () => {
    const base = {
      ...COMPLETAR_PERFIL_DEFAULT_VALUES,
      nombre: 'Ana',
      apellidoPaterno: 'García',
      empresa: { ...COMPLETAR_PERFIL_DEFAULT_VALUES.empresa, nombre: 'Deccode SA de CV' },
    };

    const result = completarPerfilSchema.safeParse({ ...base, telefono: '55-1234-5678' });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.telefono).toBe('5512345678');
  });

  // spec:SPEC-004:REQ-U8
  it('rechaza codigoPostal con longitud distinta de 5 dígitos o con caracteres no numéricos', () => {
    const base = {
      ...COMPLETAR_PERFIL_DEFAULT_VALUES,
      nombre: 'Ana',
      apellidoPaterno: 'García',
      empresa: { ...COMPLETAR_PERFIL_DEFAULT_VALUES.empresa, nombre: 'Deccode SA de CV' },
    };

    for (const codigoPostal of ['1234', '123456', '1234A']) {
      const result = completarPerfilSchema.safeParse({ ...base, codigoPostal });
      expect(result.success).toBe(false);
      if (result.success) continue;
      expect(result.error.issues.map((issue) => issue.message)).toContain('El código postal debe tener 5 dígitos');
    }

    expect(completarPerfilSchema.safeParse({ ...base, codigoPostal: '12345' }).success).toBe(true);
  });
});
