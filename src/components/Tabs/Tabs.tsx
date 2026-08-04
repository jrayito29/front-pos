import { useRef } from 'react';

export interface TabItem {
  key: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
}

// Componente genérico de tablist (patrón WAI-ARIA Tabs) — solo la lista de pestañas, el consumidor
// decide qué panel renderizar según `activeKey` (sin acoplar contenido de negocio aquí). SPEC-009
// REQ-U26 (Ver/Editar: Información general / Costos y precio / Tags).
export function Tabs({ tabs, activeKey, onChange }: TabsProps) {
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  function handleKeyDown(event: React.KeyboardEvent, index: number) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const nextIndex = event.key === 'ArrowRight' ? (index + 1) % tabs.length : (index - 1 + tabs.length) % tabs.length;
    const nextTab = tabs[nextIndex];
    onChange(nextTab.key);
    buttonRefs.current[nextTab.key]?.focus();
  }

  return (
    <div role="tablist" aria-label="Secciones del producto" className="flex gap-1 border-b border-border">
      {tabs.map((tab, index) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            ref={(el) => {
              buttonRefs.current[tab.key] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${tab.key}`}
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.key}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tab.key)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`relative px-4 py-3 text-sm font-medium transition-colors duration-150 ${
              isActive ? 'text-brand-green' : 'text-foreground-secondary hover:text-foreground'
            }`}
          >
            {tab.label}
            {isActive && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-green" />}
          </button>
        );
      })}
    </div>
  );
}
