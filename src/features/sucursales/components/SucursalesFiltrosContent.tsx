import { Select } from '../../../components/Select';

export interface SucursalesFiltrosDraft {
  activo?: boolean;
}

const ACTIVO_OPTIONS = [
  { value: 'true', label: 'Activo' },
  { value: 'false', label: 'Inactivo' },
];

interface SucursalesFiltrosContentProps {
  draft: SucursalesFiltrosDraft;
  onChange: (next: SucursalesFiltrosDraft) => void;
}

// SPEC-012 REQ-U1 — único filtro adicional al buscador: `activo` (GET /sucursales solo soporta
// `q`/`activo`, api-pos SPEC-014 §Parámetros de Búsqueda).
export function SucursalesFiltrosContent({ draft, onChange }: SucursalesFiltrosContentProps) {
  return (
    <Select
      label="Estado"
      placeholder="Todos"
      isClearable
      options={ACTIVO_OPTIONS}
      value={draft.activo === undefined ? undefined : String(draft.activo)}
      onChange={(value) => onChange({ ...draft, activo: value === undefined ? undefined : value === 'true' })}
    />
  );
}
