// CLAUDE.md §1 — toda la interfaz opera en MXN. Los campos monetarios llegan del backend como
// string (Decimal, ver SPEC-016 DESIGN) para preservar precisión; este helper es el único punto
// que los convierte a texto de presentación — nunca `parseFloat` disperso en componentes.
const mxnFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
});

export function formatCurrency(value: string | number): string {
  const numeric = typeof value === 'string' ? Number(value) : value;
  return mxnFormatter.format(Number.isFinite(numeric) ? numeric : 0);
}
