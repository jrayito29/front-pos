# Especificaciones Técnicas: Frontend Sistema POS & Multi-Almacén (SaaS)

## 1. Visión General del Proyecto

Desarrollar la interfaz web del sistema POS que consume la API en Node.js (ver `GOBERNANZA.md` del backend). Por ahora el diseño está enfocado **exclusivamente en Web/Escritorio**, cubriendo administración, ventas, cotizaciones, reportes y gestión de catálogo e inventario (roles Admin, Superadmin, Cajero).

Toda la interfaz opera en **Pesos Mexicanos (MXN)**.

## 2. Stack Tecnológico Requerido

- **Build Tool:** Vite
- **Framework:** React + TypeScript
- **Estilos:** Tailwind CSS (componentes propios, sin librerías de UI de terceros — diseño 100% custom)
- **Data Fetching / Server State:** TanStack Query
- **Estado Global (Client State):** Zustand
- **Formularios:** React Hook Form + Zod (mismos esquemas de validación filosofía que el backend)
- **Gráficas/Reportes:** Recharts
- **Ruteo:** React Router (declarative mode)
- **Toast**: Sonner
- **Skills de Diseño Instaladas:** `ui-ux-pro-max` y `emilkowalski` — deben consultarse **siempre** antes de diseñar o modificar cualquier componente visual, layout o interacción.

## 3. Arquitectura del Sistema

Arquitectura **Feature-Based (por dominio)**, no por tipo de archivo. Cada feature es autocontenida y solo expone lo necesario vía `index.ts`.

- **`features/`**: Un folder por dominio de negocio (ventas, inventario, clientes, productos, almacenes, auth).
- **`components/`**: Componentes de UI 100% reutilizables y sin lógica de negocio (Button, Input, Modal, Table, etc.).
- **`hooks/`**: Hooks compartidos entre features (ej. `useDebounce`, `useMediaQuery`).
- **`services/`**: Capa de comunicación con la API (funciones que usan `axios`/`fetch`, consumidas por TanStack Query).
- **`stores/`**: Stores de Zustand (estado de sesión, carrito de venta activo, preferencias de UI).
- **`schemas/`**: Esquemas Zod de formularios (uno por entidad/formulario).

**Regla de separación de estado:**

- **TanStack Query** = todo lo que viene del servidor (productos, stock, órdenes, clientes). Nunca duplicar esto en Zustand.
- **Zustand** = solo estado de cliente puro: sesión de usuario, carrito/orden en construcción, filtros temporales de UI, estado de sidebar/paneles.

## 4. Sistema de Diseño (Design System)

- Antes de crear o modificar cualquier componente visual, **consultar la skill `ui-ux-pro-max`** para lineamientos de composición, jerarquía visual, espaciado y accesibilidad.
- Para **microinteracciones, animaciones y sensación de "producto pulido"** (transiciones, feedback táctil, estados de carga, hover/press states), **consultar la skill `emilkowalski`** antes de implementar.
- Todos los tokens de diseño (colores, tipografía, espaciados, radios, sombras) se definen en `tailwind.config.ts`. **Nunca hardcodear valores hex, px o rem directamente en los componentes.**

## 5. Layout Principal (Web/Escritorio)

- **Layout único (`layouts/AppLayout`):** Sidebar de navegación, header con acciones globales, tablas densas, filtros avanzados, gráficas de reportes.
- Diseño responsive dentro del rango Web (breakpoints estándar `sm/md/lg/xl`), priorizando resoluciones de escritorio; no se contempla por ahora un modo táctil/tablet dedicado.
- Componentes reutilizables deben recibir datos vía props/hooks, sin acoplarse a un layout específico.

## 6. Consumo de API y Manejo de Datos

- Toda petición server-side pasa por **TanStack Query** (`useQuery` / `useMutation`), nunca `fetch` directo en componentes.
- Las respuestas de la API siguen el contrato del backend:

  ```json
  { "success": true, "data": {}, "meta": { "page": 1, "total": 100 } }
  ```

  Los hooks de `services/` deben desestructurar `data` y `meta` de forma consistente; nunca exponer el wrapper `success` al componente.

- **Invalidación de cache:** toda mutación que afecte stock, órdenes o inventario debe invalidar las queries relacionadas (`queryKey`) de forma explícita — nunca depender solo de `staleTime`.
- **Manejo de errores de API:** interceptor centralizado (axios) que normaliza errores del backend a un formato único consumido por un componente de notificación global (toast).
- **Refresh Token:** manejo de expiración de Access Token con reintento automático transparente (interceptor), sin exponer lógica de tokens en los componentes.
- Si se necesita validar los tipos de error y datos que se envian y reciben de la api consultar src/docs/doc-api.md

## 7. Formularios

- Todo formulario usa **React Hook Form + Zod**, con el esquema Zod viviendo en `schemas/` y compartiendo, en lo posible, la misma forma de validación que el backend (mismos límites, mismos mensajes de negocio).
- Nunca validar manualmente con `if/else` cuando el esquema Zod puede resolverlo.
- Mensajes de error de formulario en español, claros y específicos (nunca "Campo inválido" genérico).
- Si se necesita validar los tipos de error y datos que se envian y reciben de la api consultar src/docs/doc-api.md

## 8. Manejo de Errores y Estados de UI

- Todo componente que consuma datos remotos debe manejar explícitamente: `loading`, `error` y `empty state` (nunca dejar un estado sin diseño).
- Loading states deben usar skeletons acordes al componente (no spinners genéricos en tablas o grids de productos).
- Errores de red/servidor se comunican vía toast global; errores de validación de formulario se muestran inline junto al campo.

## 9. Reglas de Programación

**Componentes**

- Nunca usar `any` en TypeScript.
- Componentes con una sola responsabilidad (máx ~150 líneas; si crece, extraer subcomponentes o hooks).
- Un componente de presentación no debe importar `services/` directamente — solo recibe datos vía props o hooks de feature.
- Nombrar componentes y archivos en `PascalCase`; hooks en `camelCase` con prefijo `use`.

**Estado**

- Nunca guardar estado derivable (calculable a partir de otro estado) — calcularlo en render o memoizarlo.
- Toda selección de Zustand debe hacerse con selectores específicos (`useStore(state => state.x)`), nunca desestructurar el store completo, para evitar renders innecesarios.

**Estilos**

- Solo clases utilitarias de Tailwind; evitar CSS custom salvo casos justificados (documentar el porqué en comentario).
- Cero magic numbers de diseño: si un valor se repite, va a `tailwind.config.ts` como token.
- Responsive dentro del rango Web (`base` = resolución mínima soportada, `lg:`/`xl:` para pantallas grandes), priorizando siempre la experiencia de escritorio.

**General**

- Nunca commitear archivos `.env`.
- Nunca loguear datos sensibles (tokens, datos de sesión) en consola en producción.
- Comentarios solo en lógica de negocio compleja (cálculos de carrito, conversión cotización→venta, lógica de descuentos).

## 10. Estilo de Respuestas del Asistente

- Respuestas **breves y concisas**.
- **No mostrar bloques de código** en las respuestas, salvo que el usuario lo solicite explícitamente.
- Antes de proponer un diseño visual nuevo, mencionar brevemente qué lineamiento de `ui-ux-pro-max` o `emilkowalski` se está aplicando.

## 11. Estructura de Directorios (Folder Tree)

```text
/
├── public/
├── src/
│   ├── app/                 # Configuración raíz (providers, router, QueryClient)
│   ├── components/          # Componentes UI reutilizables (sin lógica de negocio)
│   ├── features/            # Un folder por dominio
│   │   ├── auth/
│   │   ├── ventas/
│   │   ├── cotizaciones/
│   │   ├── inventario/
│   │   ├── productos/
│   │   ├── almacenes/
│   │   └── clientes/
│   │       ├── components/  # Componentes propios de la feature
│   │       ├── hooks/       # useQuery/useMutation de la feature
│   │       ├── schemas/     # Zod schemas de la feature
│   │       ├── types/       # Tipos/DTOs de la feature
│   │       └── index.ts     # Barrel export
│   ├── layouts/
│   │   └── AppLayout/
│   ├── hooks/                # Hooks compartidos globales
│   ├── services/             # Cliente axios, interceptores, base API
│   ├── stores/                # Zustand stores globales (session, carrito, UI)
│   ├── lib/                  # Utilidades (formateo MXN, fechas, helpers)
│   ├── constants/             # Roles, estados, rutas, breakpoints
│   ├── styles/                 # Estilos globales, tailwind base
│   ├── docs/                    # Documentación interna (SPEC-XX.md)
│   └── main.tsx
├── test/                        # Todos los archivos *.test.ts(x) del proyecto — nunca co-ubicados
│   │                             # junto al archivo que prueban dentro de src/. Espeja la estructura
│   │                             # de src/ solo hasta el nivel de dominio/feature (sin repetir el
│   │                             # subnivel components/hooks/schemas dentro de cada feature).
│   ├── app/
│   ├── features/
│   │   └── auth/                # Tests de components/hooks/schemas de la feature, sin subcarpetas
│   ├── layouts/
│   │   └── AppLayout/
│   ├── services/
│   └── stores/
├── .claude                      # Contexto de IA
├── .env
├── CLAUDE.md
└── package.json
```

**Regla de tests:** todo archivo `*.test.ts`/`*.test.tsx` va en `test/`, replicando ahí la ruta de `src/` (importando el módulo real vía ruta relativa hacia `src/`) — nunca junto al archivo fuente que prueba.

Al terminar de leer este documento, confirmar que se aplicarán las skills `ui-ux-pro-max` y `emilkowalski` como criterio de diseño antes de generar cualquier componente visual.
