import { useId } from 'react';
import ReactSelect from 'react-select';
import { reactSelectClassNames } from '../../lib/reactSelectClassNames';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  error?: string;
  options: SelectOption[];
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  isClearable?: boolean;
  hideLabel?: boolean;
  isDisabled?: boolean;
  required?: boolean;
}

// Componente genérico — TODOS los selects del proyecto usan react-select (unstyled + tokens del
// design system vía `reactSelectClassNames`), nunca un `<select>` nativo. Controlado por
// `value`/`onChange` (no `register()` directo): react-select no expone un evento nativo compatible,
// se conecta a React Hook Form vía `Controller` (ver CategoriaSelect para el patrón de referencia).
export function Select({
  label,
  error,
  options,
  value,
  onChange,
  placeholder,
  isClearable = false,
  hideLabel = false,
  isDisabled = false,
  required = false,
}: SelectProps) {
  const selectId = useId();
  const selected = options.find((option) => option.value === value) ?? null;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className={hideLabel ? 'sr-only' : 'text-sm font-medium text-foreground'}>
        {label}
        {required && <span className="text-brand-coral-text"> *</span>}
      </label>
      <ReactSelect
        inputId={selectId}
        unstyled
        isClearable={isClearable}
        isDisabled={isDisabled}
        classNames={reactSelectClassNames<SelectOption>(Boolean(error))}
        options={options}
        value={selected}
        onChange={(option) => onChange(option?.value)}
        placeholder={placeholder ?? 'Selecciona una opción'}
        noOptionsMessage={() => 'Sin opciones'}
      />
      {error && (
        <p role="alert" className="text-sm text-brand-coral-text">
          {error}
        </p>
      )}
    </div>
  );
}
