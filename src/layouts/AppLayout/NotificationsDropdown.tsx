import { useRef, useState, type ComponentType, type SVGProps } from 'react';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { AlertIcon, BellIcon, CheckCircleIcon, ClientesIcon } from './icons';

type Tone = 'coral' | 'green' | 'purple';

interface NotificationItem {
  id: string;
  title: string;
  time: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  tone: Tone;
}

const TONE_COLOR: Record<Tone, string> = {
  coral: 'var(--brand-coral)',
  green: 'var(--brand-green)',
  purple: 'var(--brand-purple)',
};

// SPEC-008 REQ-O2 — estructura completa (trigger, panel, item), datos mock fijos: no existe
// endpoint de notificaciones todavía (fuera de alcance de esta spec). Cuando exista, este arreglo se
// reemplaza por `useQuery` sin tocar el resto del componente.
const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'Stock bajo: Refresco Cola 600ml (3 unidades)',
    time: 'Hace 12 min · Almacén Centro',
    icon: AlertIcon,
    tone: 'coral',
  },
  { id: '2', title: 'Cotización #1042 aprobada por el cliente', time: 'Hace 1 h', icon: CheckCircleIcon, tone: 'green' },
  { id: '3', title: 'Nuevo cajero agregado: Luis Medina', time: 'Ayer, 18:40', icon: ClientesIcon, tone: 'purple' },
];

// SPEC-008 REQ-E3/E4/S4 — abre origin-aware (ancla al trigger, no al centro — emilkowalski), cierra
// con click afuera o Escape (useOnClickOutside), indicador visual (sin contador numérico, REQ-S4).
export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(wrapRef, () => setOpen(false), open);

  const hasUnread = MOCK_NOTIFICATIONS.length > 0;

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Notificaciones"
        aria-expanded={open}
        aria-haspopup="true"
        className="cursor-pointer relative flex h-10 w-10 items-center justify-center rounded-full text-foreground-secondary transition-colors duration-150 hover:bg-background-tertiary active:scale-[0.94]"
      >
        <BellIcon className="h-5 w-5" />
        {hasUnread && (
          <span
            className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full border-2 border-background-secondary bg-brand-coral"
            aria-hidden="true"
          />
        )}
      </button>

      <div
        role="menu"
        aria-label="Panel de notificaciones"
        className={`absolute right-0 top-[calc(100%+10px)] w-[340px] origin-top-right overflow-hidden rounded-2xl border border-border bg-background shadow-lg transition-[opacity,transform] duration-150 ease-out ${open ? 'pointer-events-auto scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
          }`}
      >
        <div className="border-b border-border px-4 py-3.5 text-[13.5px] font-semibold text-foreground">Notificaciones</div>
        {MOCK_NOTIFICATIONS.map((notification) => {
          const Icon = notification.icon;
          return (
            <div key={notification.id} className="flex gap-2.5 border-b border-border px-4 py-3 last:border-b-0">
              <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: TONE_COLOR[notification.tone] }} />
              <div>
                <div className="text-[12.5px] font-semibold text-foreground">{notification.title}</div>
                <div className="mt-0.5 text-[11.5px] text-foreground-muted">{notification.time}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
