import { Select } from '../../../components/Select';
import { Switch } from '../../../components/Switch';
import { CategoriaSelect } from './CategoriaSelect';
import { ESTADO_PRODUCTO, TIPO_PRODUCTO, TAGS_CATALOGO } from '../constants/producto.constants';
import type { EstadoProductoDomain, TipoProductoDomain } from '../constants/producto.constants';

export interface ProductosFiltrosDraft {
  estado?: EstadoProductoDomain;
  tipo?: TipoProductoDomain;
  categoriaId?: string;
  tag?: string;
  requiereBascula?: boolean;
}

const ESTADO_OPTIONS = Object.values(ESTADO_PRODUCTO).map((value) => ({ value, label: value }));
const TIPO_OPTIONS = Object.values(TIPO_PRODUCTO).map((value) => ({ value, label: value }));
const TAG_OPTIONS = TAGS_CATALOGO.map((tag) => ({ value: tag.slug, label: tag.nombre }));

interface ProductosFiltrosContentProps {
  draft: ProductosFiltrosDraft;
  onChange: (next: ProductosFiltrosDraft) => void;
}

// SPEC-009 REQ-E2 — campos del popover de filtros; el borrador vive en el estado del padre
// (ProductosListPage), este componente es puramente controlado (sin lógica de negocio propia).
export function ProductosFiltrosContent({ draft, onChange }: ProductosFiltrosContentProps) {
  return (
    <>
      <Select
        label="Estado"
        placeholder="Todos"
        isClearable
        options={ESTADO_OPTIONS}
        value={draft.estado}
        onChange={(value) => onChange({ ...draft, estado: value as EstadoProductoDomain | undefined })}
      />
      <Select
        label="Tipo"
        placeholder="Todos"
        isClearable
        options={TIPO_OPTIONS}
        value={draft.tipo}
        onChange={(value) => onChange({ ...draft, tipo: value as TipoProductoDomain | undefined })}
      />
      <CategoriaSelect value={draft.categoriaId} onChange={(value) => onChange({ ...draft, categoriaId: value })} />
      <Select
        label="Tag"
        placeholder="Todos"
        isClearable
        options={TAG_OPTIONS}
        value={draft.tag}
        onChange={(value) => onChange({ ...draft, tag: value })}
      />
      <Switch
        label="Requiere báscula"
        checked={draft.requiereBascula ?? false}
        onChange={(checked) => onChange({ ...draft, requiereBascula: checked || undefined })}
      />
    </>
  );
}
