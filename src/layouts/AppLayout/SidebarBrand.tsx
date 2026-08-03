import { Logo } from '../../components/Logo';

interface SidebarBrandProps {
  collapsed: boolean;
  logoUrl?: string;
  companyName?: string;
}

// SPEC-008 REQ-U9/S2 — el logo de la empresa en sesión reemplaza la marca del sistema SOLO cuando
// existe. Hoy `logoUrl` nunca llega (gap de contrato documentado en SPEC-008 §Contexto — ver
// frontend-a-backend/PETICION-003): siempre resuelve a `Logo`. El subtítulo con el nombre de la
// empresa se omite por completo (no placeholder) cuando `companyName` tampoco existe (REQ-X3).
export function SidebarBrand({ collapsed, logoUrl, companyName }: SidebarBrandProps) {
  return (
    <div className={`flex items-center gap-3 pb-6 pt-1 ${collapsed ? 'justify-center' : 'px-2'}`}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={companyName ?? 'Logo de la empresa'}
          className="h-9 w-9 flex-shrink-0 rounded-lg object-cover"
        />
      ) : (
        <Logo size="sm" />
      )}
      {!collapsed && (
        <div className="min-w-0 overflow-hidden">
          <div className="truncate text-[15px] font-semibold tracking-tight text-foreground">Deccode POS</div>
          {companyName && <div className="truncate text-[11px] text-foreground-muted">{companyName}</div>}
        </div>
      )}
    </div>
  );
}
