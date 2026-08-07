import type { SucursalDTO } from '../types/sucursal.types';

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-foreground-secondary">{label}</span>
      <span className="text-sm text-foreground">{value || '—'}</span>
    </div>
  );
}

// SPEC-012 REQ-U6 — modo lectura: texto plano, nunca inputs deshabilitados (regla `read-only-distinction`).
export function SucursalInfoGeneralReadOnly({ sucursal }: { sucursal: SucursalDTO }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Teléfono" value={sucursal.telefono ?? ''} />
        <Field label="Email" value={sucursal.email ?? ''} />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Field label="Calle" value={sucursal.calle} />
        <Field label="Núm. exterior" value={sucursal.numeroExterior} />
        <Field label="Núm. interior" value={sucursal.numeroInterior ?? ''} />
        <Field label="Colonia" value={sucursal.colonia} />
        <Field label="Municipio" value={sucursal.municipio} />
        <Field label="Estado" value={sucursal.estado} />
        <Field label="Código postal" value={sucursal.codigoPostal} />
      </div>
      <Field label="Dirección completa" value={sucursal.direccionCompleta} />
    </div>
  );
}
