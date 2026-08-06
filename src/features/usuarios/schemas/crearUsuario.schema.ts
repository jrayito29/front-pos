import { z } from 'zod';
import { ROLES_ASIGNABLES } from '../constants/usuario.constants';

// Réplica de crearUsuarioSchema (api-pos/src/validators/usuarios.validator.ts, SPEC-013). Sin modo
// edición: no hay `actualizarUsuarioSchema` — el backend no expone actualización de perfil tras el
// alta (SPEC-011 REQ-U5).
export const crearUsuarioSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(ROLES_ASIGNABLES, { message: 'Rol no permitido para este flujo.' }),
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellidoPaterno: z.string().min(1, 'El apellido paterno es requerido'),
  apellidoMaterno: z.string().optional(),
  telefono: z.string().optional(),
});

export type CrearUsuarioValues = z.infer<typeof crearUsuarioSchema>;
