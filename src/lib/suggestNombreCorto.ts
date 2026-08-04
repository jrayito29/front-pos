// SPEC-009 — sugerencia de `nombreCorto` derivada de `nombreLargo` (máx 60, límite del backend).
// Corta por palabra completa, nunca a mitad de una — evita sugerir un nombre que se vea roto.
export function suggestNombreCorto(nombreLargo: string, maxLength = 60): string {
  const trimmed = nombreLargo.trim();
  if (trimmed.length <= maxLength) return trimmed;

  const cut = trimmed.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim();
}
