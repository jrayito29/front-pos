import { Select } from '../../../components/Select';
import { TIPO_ALMACEN, TIPO_ALMACEN_LABEL, type TipoAlmacenDomain } from '../constants/sucursal.constants';

export interface AlmacenesFiltrosDraft {
  activo?: boolean;
  tipo?: TipoAlmacenDomain;
}

const ACTIVO_OPTIONS = [
  { value: 'true', label: 'Activo' },
  { value: 'false', label: 'Inactivo' },
];

const TIPO_OPTIONS = Object.values(TIPO_ALMACEN).map((value) => ({ value, label: TIPO_ALMACEN_LABEL[value] }));

interface AlmacenesFiltrosContentProps {
  draft: AlmacenesFiltrosDraft;
  onChange: (next: AlmacenesFiltrosDraft) => void;
}

// SPEC-012 REQ-U7 — filtros de la tab Almacenes: `activo` y `tipo` (GET
// /sucursales/:sucursalId/almacenes, api-pos SPEC-014 §Parámetros de Búsqueda).
export function AlmacenesFiltrosContent({ draft, onChange }: AlmacenesFiltrosContentProps) {
  return (
    <>
      <Select
        label="Estado"
        placeholder="Todos"
        isClearable
        options={ACTIVO_OPTIONS}
        value={draft.activo === undefined ? undefined : String(draft.activo)}
        onChange={(value) => onChange({ ...draft, activo: value === undefined ? undefined : value === 'true' })}
      />
      <Select
        label="Tipo"
        placeholder="Todos"
        isClearable
        options={TIPO_OPTIONS}
        value={draft.tipo}
        onChange={(value) => onChange({ ...draft, tipo: value as TipoAlmacenDomain | undefined })}
      />
    </>
  );
}
