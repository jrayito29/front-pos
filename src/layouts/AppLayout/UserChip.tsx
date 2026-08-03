import { UserIcon } from './icons';

interface UserChipProps {
  role: string | undefined;
  nombre?: string;
}

// SPEC-008 REQ-U14/X3 — hoy no existe un nombre para mostrar del usuario en ningún contrato del
// backend (ver SPEC-008 §Contexto, frontend-a-backend/PETICION-003): el avatar es siempre un ícono
// genérico, nunca iniciales inventadas a partir de datos que no existen. La línea de nombre solo se
// renderiza si `nombre` llega en el futuro. `role` también puede faltar momentáneamente (usePermisos
// cargando/error) — se usa un rótulo neutro en vez de dejar el chip vacío.
export function UserChip({ role, nombre }: UserChipProps) {
  const roleLabel = role ?? 'Sesión activa';

  return (
    <div className="flex items-center gap-2.5 rounded-full py-1 pl-1.5 pr-2">
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-purple text-white">
        <UserIcon className="h-4 w-4" />
      </span>
      <span className="leading-tight">
        {nombre && <span className="block text-[13px] font-semibold text-foreground">{nombre}</span>}
        <span className="block text-[11.5px] text-foreground-muted">{roleLabel}</span>
      </span>
    </div>
  );
}
