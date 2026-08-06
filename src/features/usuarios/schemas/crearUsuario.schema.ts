import { z } from 'zod';
import { ROLES_ASIGNABLES } from '../constants/usuario.constants';

// Mismo criterio que completarPerfilSchema (auth/schemas/completarPerfil.schema.ts, REQ-U8): opcional;
// si se captura, se limpia de espacios/guiones y debe quedar en 10 dígitos.
const PHONE_SEPARATORS_REGEX = /[\s-]/g;
const PHONE_DIGITS_REGEX = /^\d{10}$/;

// Réplica de crearUsuarioSchema (api-pos/src/validators/usuarios.validator.ts, SPEC-013). Sin modo
// edición: no hay `actualizarUsuarioSchema` — el backend no expone actualización de perfil tras el
// alta (SPEC-011 REQ-U5).
export const crearUsuarioSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(ROLES_ASIGNABLES, { message: 'Rol no permitido para este flujo.' }),
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellidoPaterno: z.string().min(1, 'El apellido paterno es requerido'),
  apellidoMaterno: z.string().optional(),
  telefono: z
    .string()
    .optional()
    .transform((value) => value?.replace(PHONE_SEPARATORS_REGEX, ''))
    .refine((value) => !value || PHONE_DIGITS_REGEX.test(value), 'El teléfono debe tener 10 dígitos'),
});

export type CrearUsuarioValues = z.infer<typeof crearUsuarioSchema>;
