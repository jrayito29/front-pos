// SPEC-009 — réplica cliente de `precioVentaSugerido` (SPEC-016 §Costos y Precio, REQ-E9): Margen
// Comercial Real, `base / (1 - margen/100)`, nunca markup (`base * (1 + margen/100)`). Es solo una
// sugerencia visual mientras el usuario llena el formulario — el backend nunca recibe ni calcula
// `precioVenta`, siempre persiste el valor que el frontend decide enviar (REQ-U7).
export function calcularPrecioVentaSugerido(
  costoEstimado: string | number | undefined,
  costoPromedio: string | number | undefined,
  margenDeseadoPorcentaje: string | number | undefined
): number | null {
  if (margenDeseadoPorcentaje === undefined || margenDeseadoPorcentaje === '') return null;

  const margen = Number(margenDeseadoPorcentaje);
  if (!Number.isFinite(margen) || margen < 0 || margen >= 100) return null;

  const promedio = Number(costoPromedio) || 0;
  const estimado = Number(costoEstimado) || 0;
  const base = promedio > 0 ? promedio : estimado;
  if (base <= 0) return null;

  return base / (1 - margen / 100);
}
