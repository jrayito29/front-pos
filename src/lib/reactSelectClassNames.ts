import type { ClassNamesConfig, GroupBase } from 'react-select';

// react-select es la única excepción explícita a "sin librerías de UI de terceros" (CLAUDE.md §2,
// instalada a propósito para selects mock/multi de Productos). Se usa en modo `unstyled` + este mapa
// de `classNames` (Tailwind puro, tokens del design system) en vez de la prop `styles` (CSS-in-JS),
// para no introducir un segundo sistema de estilos paralelo al del resto del proyecto.
export function reactSelectClassNames<Option, IsMulti extends boolean = false>(
  hasError = false
): ClassNamesConfig<Option, IsMulti, GroupBase<Option>> {
  return {
    control: (state) =>
      `!min-h-9 !rounded-lg !border !bg-background !px-1 !transition-colors !duration-150 ${hasError ? '!border-brand-coral' : state.isFocused ? '!border-brand-green' : '!border-border'
      }`,
    placeholder: () => '!text-foreground-muted',
    input: () => '!text-foreground',
    singleValue: () => '!text-foreground',
    valueContainer: () => '!px-2',
    indicatorSeparator: () => '!bg-border',
    dropdownIndicator: () => '!text-foreground-secondary',
    clearIndicator: () => '!text-foreground-secondary',
    menu: () => '!mt-1 !rounded-lg !border !border-border !bg-background-secondary !shadow-sm',
    menuList: () => '!py-1',
    option: (state) =>
      `!cursor-pointer !px-3.5 !py-2.5 !text-sm ${state.isSelected
        ? '!bg-brand-green !text-white'
        : state.isFocused
          ? '!bg-background-tertiary !text-foreground'
          : '!text-foreground'
      }`,
    multiValue: () => '!rounded-full !bg-background-tertiary !py-0.5 !pl-2.5',
    multiValueLabel: () => '!text-sm !text-foreground',
    multiValueRemove: () => '!rounded-full !text-foreground-secondary hover:!bg-transparent hover:!text-brand-coral',
    noOptionsMessage: () => '!py-3 !text-sm !text-foreground-secondary',
  };
}
