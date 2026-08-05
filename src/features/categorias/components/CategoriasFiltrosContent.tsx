import { Select } from '../../../components/Select';
import { Switch } from '../../../components/Switch';
import { useCategoriasSelector } from '../hooks/useCategoriasSelector';
import { ESTADO_CATEGORIA, ESTADO_CATEGORIA_LABEL, type EstadoCategoriaDomain } from '../constants/categoria.constants';

export interface CategoriasFiltrosDraft {
  estado?: EstadoCategoriaDomain;
  padreId?: string;
  soloRaiz?: boolean;
}

const ESTADO_OPTIONS = Object.values(ESTADO_CATEGORIA).map((value) => ({ value, label: ESTADO_CATEGORIA_LABEL[value] }));

interface CategoriasFiltrosContentProps {
  draft: CategoriasFiltrosDraft;
  onChange: (next: CategoriasFiltrosDraft) => void;
}

// Mirror ProductosFiltrosContent — puramente controlado, el borrador vive en CategoriasListPage.
// "Categoría padre" y "Solo raíz" son mutuamente excluyentes en la práctica (una raíz nunca tiene
// `padreId`) — se deshabilita el select de padre mientras `soloRaiz` está activo y se limpia al
// activarlo, para no dejar un filtro combinado que nunca puede matchear nada.
export function CategoriasFiltrosContent({ draft, onChange }: CategoriasFiltrosContentProps) {
  const { data: raices, isLoading: raicesLoading } = useCategoriasSelector({ soloRaiz: true, limit: 50 });
  const raizOptions = (raices ?? []).map((raiz) => ({ value: raiz.id, label: raiz.nombre }));

  return (
    <>
      <Select
        label="Estado"
        placeholder="Todos"
        isClearable
        options={ESTADO_OPTIONS}
        value={draft.estado}
        onChange={(value) => onChange({ ...draft, estado: value as EstadoCategoriaDomain | undefined })}
      />
      <Select
        label="Categoría padre"
        placeholder="Todas"
        isClearable
        isDisabled={raicesLoading || draft.soloRaiz}
        options={raizOptions}
        value={draft.padreId}
        onChange={(value) => onChange({ ...draft, padreId: value })}
      />
      <Switch
        label="Solo categorías raíz"
        checked={draft.soloRaiz ?? false}
        onChange={(checked) => onChange({ ...draft, soloRaiz: checked || undefined, padreId: checked ? undefined : draft.padreId })}
      />
    </>
  );
}
