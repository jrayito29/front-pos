import type { TableStyles } from 'react-data-table-component';

// SPEC-009 REQ-U2 — skin propio de react-data-table-component mapeado a los tokens de
// brand.css/tailwind.config.ts (nunca los estilos default de la librería ni un hex hardcodeado).
// Los valores `var(--...)` resuelven en tiempo real contra el tema activo ([data-theme] en la raíz,
// ver brand.css) — no requieren lógica de tema propia aquí.
export const dataTableStyles: TableStyles = {
  table: {
    style: { backgroundColor: 'var(--bg-primary)' },
  },
  tableWrapper: {
    style: { backgroundColor: 'var(--bg-primary)' },
  },
  headRow: {
    style: {
      backgroundColor: 'var(--bg-secondary)',
      borderBottomColor: 'var(--border)',
      borderBottomWidth: '1px',
      minHeight: '44px',
    },
  },
  headCells: {
    style: {
      color: 'var(--text-secondary)',
      fontSize: '0.8125rem',
      fontWeight: 600,
      paddingLeft: '16px',
      paddingRight: '16px',
    },
  },
  rows: {
    style: {
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      borderBottomColor: 'var(--border)',
      minHeight: '56px',
    },
    highlightOnHoverStyle: {
      backgroundColor: 'var(--bg-secondary)',
      color: 'var(--text-primary)',
      borderBottomColor: 'var(--border)',
      transitionDuration: '150ms',
      transitionProperty: 'background-color',
      outline: 'none',
    },
  },
  cells: {
    style: {
      paddingLeft: '16px',
      paddingRight: '16px',
      fontSize: '0.875rem',
    },
  },
  pagination: {
    style: {
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-secondary)',
      borderTopColor: 'var(--border)',
      justifyContent: 'flex-end',
    },
    pageButtonsStyle: {
      color: 'var(--text-secondary)',
      fill: 'var(--text-secondary)',
      borderRadius: '8px',
    },
  },
  noData: {
    style: { backgroundColor: 'var(--bg-primary)', padding: '0' },
  },
  progress: {
    style: { backgroundColor: 'var(--bg-primary)', padding: '0' },
  },
};
