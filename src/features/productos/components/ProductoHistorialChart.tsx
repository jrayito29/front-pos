import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency } from '../../../lib/formatCurrency';
import type { HistorialPrecioDTO } from '../types/producto.types';

// SPEC-009 REQ-U31 — LineChart con 2 series (costoPromedio, precioVenta) sobre `creadoEn`,
// diferenciadas por estilo de línea además de color (regla de accesibilidad para gráficas de
// tendencia, ui-ux-pro-max §chart — nunca solo color entre series).
export function ProductoHistorialChart({ historial }: { historial: HistorialPrecioDTO[] }) {
  const data = historial
    .map((entrada) => ({
      fecha: new Date(entrada.creadoEn).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
      costoPromedio: Number(entrada.costoPromedioNuevo ?? entrada.costoNuevo),
      precioVenta: Number(entrada.precioVentaNuevo),
    }))
    .reverse();

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="fecha" stroke="var(--text-secondary)" fontSize={12} />
          <YAxis stroke="var(--text-secondary)" fontSize={12} tickFormatter={(value) => formatCurrency(value)} width={90} />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value))}
            contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8 }}
          />
          <Legend />
          <Line type="monotone" dataKey="costoPromedio" name="Costo promedio" stroke="var(--brand-green)" strokeWidth={2} dot={false} />
          <Line
            type="monotone"
            dataKey="precioVenta"
            name="Precio de venta"
            stroke="var(--brand-purple)"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
