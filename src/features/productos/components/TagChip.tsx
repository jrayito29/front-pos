import { pickReadableTextColor } from '../../../lib/colorContrast';

interface TagChipProps {
  nombre: string;
  color: string;
  onRemove?: () => void;
  removeLabel?: string;
}

// SPEC-009 REQ-U17 — el color de fondo es fijo por tag (seed del backend); el color de texto se
// calcula por contraste (nunca un color de texto fijo asumido para los 14 tags).
export function TagChip({ nombre, color, onRemove, removeLabel }: TagChipProps) {
  const textColor = pickReadableTextColor(color);

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: color, color: textColor }}
    >
      {nombre}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel ?? `Quitar tag ${nombre}`}
          className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full hover:opacity-70"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="h-2.5 w-2.5">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      )}
    </span>
  );
}
