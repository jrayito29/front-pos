// SPEC-009 REQ-U17 — los 14 tags de producto traen un color de fondo fijo (#RRGGBB, seed del
// backend, ver SPEC-016 §Seed de Tags); ningún color de texto fijo cumple AA (4.5:1) contra los 14 a
// la vez. Este helper calcula, por color de fondo, cuál de los dos extremos de texto (blanco vs
// `--text-primary`) da mejor contraste — fórmula de luminancia relativa WCAG 2.x.
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((channel) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(l1: number, l2: number): number {
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

const WHITE_LUMINANCE = relativeLuminance([255, 255, 255]);
// Aproximación del extremo oscuro: --text-primary en tema claro (#0d1117, brand.css). En tema
// oscuro --text-primary ya es un tono claro, cercano a blanco — la elección deja de ser crítica ahí.
const DARK_TEXT_LUMINANCE = relativeLuminance(hexToRgb('#0d1117'));

export function pickReadableTextColor(backgroundHex: string): 'white' | 'var(--text-primary)' {
  const bgLuminance = relativeLuminance(hexToRgb(backgroundHex));
  const contrastWithWhite = contrastRatio(bgLuminance, WHITE_LUMINANCE);
  const contrastWithDark = contrastRatio(bgLuminance, DARK_TEXT_LUMINANCE);
  return contrastWithWhite >= contrastWithDark ? 'white' : 'var(--text-primary)';
}
