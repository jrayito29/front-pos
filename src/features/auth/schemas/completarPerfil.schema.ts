import { z } from 'zod';

// SPEC-004 REQ-U8 — excepción documentada (adenda v1.3.0): telefono/codigoPostal endurecen la
// validación más allá de lo que hoy acepta auth.validator.ts (string libre sin formato). Se
// mantiene aquí, y no en el backend, hasta que ese validator se actualice para igualar o superar
// este formato.
const PHONE_SEPARATORS_REGEX = /[\s-]/g;
const PHONE_DIGITS_REGEX = /^\d{10}$/;
const CODIGO_POSTAL_REGEX = /^\d{5}$/;

// Réplica byte-a-byte de completarPerfilSchema en api-pos/src/validators/auth.validator.ts —
// SPEC-004 REQ-U8. Único schema para los 3 pasos del wizard (REQ-U9): `trigger(<campos>)` de RHF
// valida el schema completo pero solo aplica/expone errores de los campos pedidos, permitiendo
// validar un paso a la vez sin partir el esquema (patrón oficial de RHF para wizards).
export const completarPerfilSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellidoPaterno: z.string().min(1, 'El apellido paterno es requerido'),
  apellidoMaterno: z.string().optional(),
  // REQ-U8 — opcional; si se captura, se limpia de espacios/guiones y debe quedar en 10 dígitos.
  telefono: z
    .string()
    .optional()
    .transform((value) => value?.replace(PHONE_SEPARATORS_REGEX, ''))
    .refine((value) => !value || PHONE_DIGITS_REGEX.test(value), 'El teléfono debe tener 10 dígitos'),
  calle: z.string().optional(),
  numeroExterior: z.string().optional(),
  numeroInterior: z.string().optional(),
  colonia: z.string().optional(),
  ciudad: z.string().optional(),
  estado: z.string().optional(),
  // REQ-U8 — opcional; si se captura, debe quedar en exactamente 5 dígitos.
  codigoPostal: z
    .string()
    .optional()
    .refine((value) => !value || CODIGO_POSTAL_REGEX.test(value), 'El código postal debe tener 5 dígitos'),
  empresa: z.object({
    nombre: z.string().min(1, 'El nombre de la empresa es requerido'),
    rfc: z.string().optional(),
  }),
});

export type CompletarPerfilFormValues = z.infer<typeof completarPerfilSchema>;

export const COMPLETAR_PERFIL_DEFAULT_VALUES: CompletarPerfilFormValues = {
  nombre: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  telefono: '',
  calle: '',
  numeroExterior: '',
  numeroInterior: '',
  colonia: '',
  ciudad: '',
  estado: '',
  codigoPostal: '',
  empresa: { nombre: '', rfc: '' },
};

// REQ-E1 — campos que se validan con `trigger()` al avanzar de cada paso. "Domicilio" no aparece:
// no tiene campos requeridos y avanza sin validación (REQ-U5).
export const PASO_DATOS_PERSONALES_FIELDS = ['nombre', 'apellidoPaterno', 'apellidoMaterno', 'telefono'] as const;
export const PASO_EMPRESA_FIELDS = ['empresa.nombre', 'empresa.rfc'] as const;
