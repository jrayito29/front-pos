# SPEC-00: Design System (Componentes Base)

## Propósito

Este spec es la **fuente única de verdad** para todos los componentes de UI atómicos y reutilizables del proyecto (`src/components/`). Ningún estilo, variante, estado o animación de un componente base se define ni se redefine en ningún otro spec — los specs de feature (SPEC-01 en adelante) solo **referencian** los componentes documentados aquí.

Regla obligatoria: **todo componente nuevo que vaya a `src/components/` debe estar documentado en este spec antes de implementarse.** Si una feature necesita un componente que no existe aquí, primero se propone su adición a SPEC-00 (revisión y aprobación), y solo después se codifica. No se crean componentes "de una sola vez" dentro de una feature para resolver un caso puntual.

## Alcance

Cubre exclusivamente componentes de presentación sin lógica de negocio: botones, inputs, selects, modales, toasts, tablas, badges, cards, tabs, tooltips, skeletons, etc. No cubre componentes de feature (ej. `TarjetaProducto`, `ResumenVenta`), que viven en `features/*/components/` y se documentan en su spec correspondiente.

## Qué debe contener cada componente documentado

Por cada componente base, esta spec debe registrar:

1. **Nombre y ubicación** — ej. `Button` en `src/components/Button/`.
2. **Propósito** — para qué se usa y cuándo NO debe usarse.
3. **Variantes** — lista de variantes soportadas (ej. primary, secondary, danger, ghost) sin detallar aún los valores visuales.
4. **Estados** — qué estados debe soportar (default, hover, focus, disabled, loading, error, etc.).
5. **Tamaños** — si aplica (sm, md, lg).
6. **Comportamiento de animación/transición** — referencia a que debe seguir los lineamientos de la skill `emilkowalski`, sin fijar valores aquí salvo que ya estén decididos.
7. **Props públicas (API del componente)** — nombre, tipo y obligatoriedad de cada prop.
8. **Accesibilidad** — requisitos mínimos (roles ARIA, navegación por teclado, contraste) según lineamientos de `ui-ux-pro-max`.
9. **Ejemplo de uso** — snippet mínimo de cómo se consume desde una feature.
10. **Historial de cambios** — fecha y motivo cuando se agrega o modifica una variante/estado.

## Proceso de actualización

- Cualquier cambio a un componente ya documentado (nueva variante, nuevo estado, cambio de comportamiento) requiere actualizar primero esta spec y obtener aprobación, antes de tocar el código del componente.
- Los specs de feature que consuman un componente deben citar la sección correspondiente de SPEC-00 (ej. "usa `Button` variante `primary`, ver SPEC-00 §Button") en lugar de describir el componente de nuevo.

## Componentes

### Logo

1. **Nombre y ubicación**: `Logo` en `src/components/Logo/`.
2. **Propósito**: bloque 2D cuadrado que representa la marca Deccode mediante la letra "D". Se usa en pantallas de autenticación, estados de carga globales y cabecera de sidebar. No debe exportarse como imagen estática — es un componente vivo que responde al tema claro/oscuro vía CSS variables.
3. **Variantes**: única (marca). No tiene variantes de color — siempre usa el token de marca definido en `brand.css`.
4. **Estados**: default (elemento estático, no interactivo por defecto).
5. **Tamaños**: `sm` | `md` | `lg` | `xl`, mapeados a tokens de tamaño en `tailwind.config.ts` (nunca px hardcodeado en el componente).
6. **Animación**: sin animación por defecto. Si se usa en un estado de carga (splash), debe seguir lineamientos de `emilkowalski` (fade/pulso sutil, sin bloquear legibilidad, `prefers-reduced-motion` respetado).
7. **Props públicas**: `size: 'sm' | 'md' | 'lg' | 'xl'` (opcional, default `'md'`), `className?: string`.
8. **Accesibilidad**: `role="img"` con `aria-label="Deccode"`; contraste del glifo "D" sobre el fondo ≥4.5:1 en ambos temas.
9. **Ejemplo de uso**: `<Logo size="xl" />`
10. **Historial de cambios**: v1.0.0 (2026-07-23) — creado para SPEC-002 (Login).

### Input

1. **Nombre y ubicación**: `Input` en `src/components/Input/`.
2. **Propósito**: campo de formulario de texto con label asociado obligatorio, usado en todos los formularios del sistema. La variante `password` añade control de visibilidad integrado.
3. **Variantes**: `text`, `email`, `password` (con toggle mostrar/ocultar).
4. **Estados**: default, focus, error, disabled, filled.
5. **Tamaños**: `md` único por ahora (el sistema es solo escritorio, sin densidad táctil dedicada).
6. **Animación**: transición de color de borde en focus/error según `emilkowalski` (solo `color`/`opacity`, 150–200ms, sin animar layout).
7. **Props públicas**: `label: string` (requerido), `type: 'text' | 'email' | 'password'`, `error?: string`, `name: string`, `register` (integración React Hook Form), `placeholder?: string`.
8. **Accesibilidad**: `label` asociado por `htmlFor`/`id`; `aria-invalid` cuando hay error; mensaje de error asociado vía `aria-describedby`; en variante `password`, el botón de mostrar/ocultar tiene `aria-label` dinámico ("Mostrar contraseña" / "Ocultar contraseña"), `type="button"` (nunca dispara submit), y área táctil ≥44×44px.
9. **Ejemplo de uso**: `<Input label="Correo electrónico" type="email" {...register('email')} error={errors.email?.message} />`
10. **Historial de cambios**: v1.0.0 (2026-07-23) — creado para SPEC-002, incluye variante `password` con toggle.

### Button

1. **Nombre y ubicación**: `Button` en `src/components/Button/`.
2. **Propósito**: acción primaria/secundaria dentro de formularios y vistas. No usar para navegación entre rutas (usar componente de link).
3. **Variantes**: `primary`, `secondary`, `ghost`, `danger`.
4. **Estados**: default, hover, active/pressed, focus, disabled, loading.
5. **Tamaños**: `sm`, `md`, `lg`.
6. **Animación**: press feedback `scale(0.97)` en `:active` (ver `emilkowalski`); transición de opacidad al entrar en estado `loading`, 150–200ms `ease-out`; nunca animar `width`/`height` (el loader no debe causar layout shift).
7. **Props públicas**: `variant`, `size`, `isLoading?: boolean`, `loadingText?: string`, `disabled?: boolean`, `type: 'button' | 'submit'`, `fullWidth?: boolean`.
8. **Accesibilidad**: `aria-busy` sincronizado con `isLoading`; `aria-disabled` sincronizado con `disabled` real; el spinner no roba foco; focus ring visible 2–4px.
9. **Ejemplo de uso**: `<Button variant="primary" fullWidth type="submit" isLoading={isPending} loadingText="Iniciando sesión...">Iniciar sesión</Button>`
10. **Historial de cambios**: v1.0.0 (2026-07-23) — creado para SPEC-002.

### Skeleton

1. **Nombre y ubicación**: `Skeleton` en `src/components/Skeleton/`.
2. **Propósito**: placeholder que ocupa el espacio del contenido real mientras se resuelve una petición o estado asíncrono (tablas, grids, cards, guards de ruta). Reemplaza el uso de `Spinner` genérico en cualquier superficie donde ya se conoce la forma aproximada del contenido final — CLAUDE.md §8 prohíbe spinners genéricos en tablas/grids. `Spinner` (`src/components/Button/Spinner.tsx`) queda reservado a estados de carga puntuales dentro de un control pequeño (ej. `Button` `isLoading`), no a regiones completas de página.
3. **Variantes**: `text` (línea, simula una línea de texto), `block` (rectángulo genérico, simula cards/inputs/botones), `circle` (simula avatar/ícono).
4. **Estados**: default (pulso de opacidad animado); estático (opacidad fija, sin animación) bajo `prefers-reduced-motion`.
5. **Tamaños**: no aplica un set fijo (`sm`/`md`/`lg`) — a diferencia de `Logo`/`Button`, su forma depende enteramente del contenido que reemplaza. El ancho/alto se controla vía `className` del consumidor (ej. `h-10 w-48`), nunca con props de tamaño propias.
6. **Animación**: pulso de `opacity` (0.5 ↔ 1, ~1.5s, `ease-in-out`, loop) según `emilkowalski` — sutil, no debe leerse como parpadeo agresivo; se apaga (opacidad fija) bajo `prefers-reduced-motion`.
7. **Props públicas**: `variant: 'text' | 'block' | 'circle'` (opcional, default `'block'`), `className?: string`.
8. **Accesibilidad**: `aria-hidden="true"` — es puramente decorativo; la comunicación del estado de carga a tecnología asistiva (`aria-busy`, texto de estado) es responsabilidad del contenedor que lo usa, no del `Skeleton` mismo.
9. **Ejemplo de uso**: `<Skeleton variant="block" className="h-10 w-48" />`
10. **Historial de cambios**: v1.0.0 (2026-07-29) — creado para SPEC-005 (REQ-S1, estado de carga de `RequireAuth` durante el silent-refresh de sesión).

## Índice de componentes documentados

| Componente | Estado | Última actualización |
| ---------- | ------ | --------------------- |
| Logo       | draft  | 2026-07-23             |
| Input      | draft  | 2026-07-23             |
| Button     | draft  | 2026-07-23             |
| Skeleton   | draft  | 2026-07-29             |
