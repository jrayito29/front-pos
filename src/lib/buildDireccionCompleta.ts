export interface DireccionCompletaInput {
  calle: string;
  numeroExterior: string;
  numeroInterior?: string;
  colonia: string;
  municipio: string;
  estado: string;
  codigoPostal: string;
}

// SPEC-012 REQ-U5 — `direccionCompleta` es estado derivable (CLAUDE.md §9): nunca es un input
// propio, se recalcula en cada render a partir de los demás campos de dirección. Formato libre — el
// backend solo exige un string de 1 a 500 caracteres (api-pos SPEC-014 §Modelos de Datos), no hay
// contrato sobre abreviaturas de entidad federativa: se usa el valor de `estado` tal como el
// usuario lo escribió.
export function buildDireccionCompleta(input: DireccionCompletaInput): string {
  const { calle, numeroExterior, numeroInterior, colonia, municipio, estado, codigoPostal } = input;

  if (!calle && !numeroExterior && !colonia && !municipio && !estado && !codigoPostal) return '';

  const numero = numeroInterior ? `${numeroExterior} Int. ${numeroInterior}` : numeroExterior;
  return `${calle} ${numero}, Col. ${colonia}, ${municipio}, ${estado} ${codigoPostal}`.trim();
}
