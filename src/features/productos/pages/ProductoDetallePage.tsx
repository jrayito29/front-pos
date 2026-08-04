import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Skeleton } from '../../../components/Skeleton';
import { Button } from '../../../components/Button';
import { EmptyState } from '../../../components/EmptyState';
import { Tabs, type TabItem } from '../../../components/Tabs';
import { ProductoDetalleHeader } from '../components/ProductoDetalleHeader';
import { ProductoInfoGeneralTab } from '../components/ProductoInfoGeneralTab';
import { ProductoCostosPrecioTab } from '../components/ProductoCostosPrecioTab';
import { ProductoTagsTab } from '../components/ProductoTagsTab';
import { EliminarProductoModal } from '../components/EliminarProductoModal';
import { useProducto } from '../hooks/useProducto';
import { usePermisos } from '../../auth/hooks/usePermisos';
import { ROUTES } from '../../../constants/routes';
import { PRODUCTO_ROLES_ESCRITURA } from '../constants/producto.constants';

const TABS: TabItem[] = [
  { key: 'info', label: 'Información general' },
  { key: 'costos', label: 'Costos y precio' },
  { key: 'tags', label: 'Tags' },
];

// SPEC-009 REQ-U23 a U34 — misma ruta/componente para Ver y Editar (dos modos, no dos rutas).
export function ProductoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: producto, isLoading, isError } = useProducto(id);
  const { data: permisos } = usePermisos();
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const puedeEditar = Boolean(permisos?.role && (PRODUCTO_ROLES_ESCRITURA as readonly string[]).includes(permisos.role));

  // REQ-S1 — skeleton mientras carga, nunca spinner genérico.
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4" role="status" aria-busy="true" aria-label="Cargando producto">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // REQ-X4 — 404/producto de otra empresa: estado dedicado, nunca un formulario vacío.
  if (isError || !producto) {
    return (
      <EmptyState
        title="Producto no encontrado"
        description="Puede que el producto no exista o haya sido eliminado."
        action={
          <Button size="sm" onClick={() => navigate(ROUTES.PRODUCTOS)}>
            Volver
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
        <ProductoDetalleHeader
          producto={producto}
          isEditing={isEditing}
          onToggleEdit={() => setIsEditing((v) => !v)}
          onDeleteClick={() => setIsDeleteModalOpen(true)}
          puedeEditar={puedeEditar}
        />

        <Tabs tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />

        <div role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`} className="pt-4">
          {activeTab === 'info' && (
            <ProductoInfoGeneralTab producto={producto} isEditing={isEditing} onSaved={() => setIsEditing(false)} />
          )}
          {activeTab === 'costos' && <ProductoCostosPrecioTab producto={producto} />}
          {activeTab === 'tags' && <ProductoTagsTab producto={producto} />}
        </div>
      </div>

      <EliminarProductoModal
        producto={isDeleteModalOpen ? producto : null}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleted={() => navigate(ROUTES.PRODUCTOS)}
      />
    </div>
  );
}
