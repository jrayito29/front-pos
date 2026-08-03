# SPEC-008: `AppLayout` — Shell de Navegación (Sidebar, Topbar, Contenido)

## Metadata

- **ID**: SPEC-008
- **Dominio**: pos
- **Versión**: 1.2.0
- **Estado**: active — todos los REQ implementados y con test trazado o justificación documentada (ver §Tests trazados). `PETICION-003` atendida por backend (`RESPUESTA-003-datos-usuario-y-logo-empresa.md`): `nombre`/`empresa.nombre` reales (`GET /auth/perfil`) y bug de `accesoTotal` corregido. Único gap restante, no bloqueante: `logoUrl` siempre `null` (Fase 2 de branding — subida de logo — diferida del lado del backend).
- **Owner**: `Equipo Frontend POS-MX`
- **Creada**: 2026-08-03
- **Última revisión**: 2026-08-03

## Contexto

Todas las vistas autenticadas del sistema (Web/Escritorio, CLAUDE.md §5) comparten un único layout compuesto por sidebar de navegación, topbar y área de contenido. Hasta ahora `layouts/AppLayout/` existe como carpeta vacía; `ROUTES.DASHBOARD` y `ROUTES.SYSADMIN` renderizan `RouteStub` sin shell real (`app/router.tsx`). SPEC-007 REQ-U6 dejó explícitamente como "contrato pendiente, `AppLayout` aún no existe" el requisito de que el menú oculte módulos sin permiso — esta spec resuelve esa deuda.

El diseño se validó de forma iterativa contra un wireframe interactivo (HTML autocontenido, tokens reales de `src/styles/brand.css`) antes de escribirse este documento; ver §Wireframe. De esa iteración surgieron dos hallazgos que este spec captura como requisitos explícitos (no solo como nota de implementación): (1) el toggle de colapso de la sidebar se probó primero anclado al borde de la sidebar y se desbordaba de su contenedor — se reubicó junto al breadcrumb en la topbar; (2) una regla CSS con scope incorrecto (`.shell[data-collapsed] .user-meta`) ocultaba el nombre/rol del usuario en la topbar al colapsar la sidebar, porque el selector no estaba acotado a la sidebar — ver REQ-X1.

**Gap de datos — resuelto parcialmente por backend (2026-08-03)**: al escribir esta spec, ni `LoginTenantResponse`, ni `PermisosEfectivosUsuario` (SPEC-007), ni `session.store` exponían un nombre para mostrar del usuario ni el nombre/logo de la empresa — solo `usuarioId`, `empresaId` y `role`. Se solicitó formalmente en `frontend-a-backend/PETICION-003-datos-usuario-y-logo-empresa.md`. Backend respondió (`api-pos/backend-a-frontend/RESPUESTA-003-datos-usuario-y-logo-empresa.md`) con un endpoint nuevo, `GET /auth/perfil` (self-service, mismo patrón que `GET /auth/permisos`), que devuelve `{ nombre: string | null; empresa: { nombre: string; logoUrl: string | null } }` — implementado como `usePerfil()`. `nombre` puede seguir siendo `null` (usuario sin `PerfilUsuario` en backend) y `logoUrl` **siempre** es `null` por ahora — no existe mecanismo de subida de archivos en el backend (Fase 2, diferida, fuera de alcance de esta spec). REQ-X3 sigue definiendo el fallback para ambos casos residuales.

**Nota de implementación (react-pro-sidebar)**: el proyecto ya tiene `react-pro-sidebar` como dependencia (`package.json`). El colapso de la sidebar NO se reimplementa a mano con transiciones de `width`/`grid-template-columns` — se usa la prop controlada `collapsed` de `<Sidebar>` (y `<Menu>`/`<MenuItem>` heredándola), que la librería ya resuelve internamente (transición, ocultamiento de labels, tooltips en modo ícono). El store de Zustand solo posee el booleano; la animación es responsabilidad de la librería. El wireframe HTML previo reconstruyó esa transición a mano porque un Artifact no puede importar dependencias npm — no es el patrón a seguir en el código real.

## Wireframe

Referencia visual interactiva (validada con el usuario, incluye ambos temas, colapso, dropdown de notificaciones y las 3 vistas de rol): `https://claude.ai/code/artifact/a907bc45-5366-4635-99db-ac06dd8b2d9e`

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ┌──────────────┐ ┌───────────────────────────────────────────────────┐ │
│ │ [D] Deccode  │ │ [≡] Inicio › Ventas          🔔   (AT) Ana Torres  │ │
│ │  POS         │ │                                    Administradora │ │
│ │  Empresa X   │ ├───────────────────────────────────────────────────┤ │
│ ├──────────────┤ │  ┌───────────┐ ┌───────────┐ ┌───────────┐        │ │
│ │ ▣ Panel      │ │  │ Ventas hoy│ │  Órdenes  │ │  Alertas  │        │ │
│ │ ▢ Ventas   ← │ │  │ $12,480   │ │     7     │ │     3     │        │ │
│ │ ▢ Cotizac.   │ │  └───────────┘ └───────────┘ └───────────┘        │ │
│ │ ▢ Inventario │ │  ┌───────────────────────────────────────┐        │ │
│ │ ▢ Productos  │ │  │ Ventas recientes            (card)    │        │ │
│ │ ▢ Almacenes  │ │  │ ...tabla...                           │        │ │
│ │ ▢ Clientes   │ │  └───────────────────────────────────────┘        │ │
│ │              │ │  ░░░░ más contenido, solo scroll vertical ░░░░    │ │
│ ├──────────────┤ │▁▁▁▁▁▁▁▁▁▁▁▁▁▁ difuminado inferior ▁▁▁▁▁▁▁▁▁▁▁▁▁▁│ │
│ │ ☀ Tema       │ └───────────────────────────────────────────────────┘ │
│ │ ⏻ Cerrar ses.│                                                       │
│ └──────────────┘                                                       │
└─────────────────────────────────────────────────────────────────────────┘
  ↑ sidebar: mismo --bg-secondary que la página → sin borde/costura visible
  ↑ [≡] colapsa/expande — vive en la topbar, no en el borde de la sidebar
  ↑ topbar es independiente del estado de colapso (REQ-X1)
```

Set de módulos validado en el wireframe (orden de arriba hacia abajo), menú **tenant**, compartido por todos los roles de ese contexto (admin, superadmin, cajero, ...): Panel, Ventas, Cotizaciones, Inventario, Productos, Almacenes, Clientes. Menú **sysadmin** (`/admin`, plataforma, estructuralmente distinto): Panel, Empresas, Planes, Usuarios, Auditoría.

## Requisitos en formato EARS

### Ubiquitous (siempre aplica)

- **REQ-U1**: El sistema DEBE renderizar `layouts/AppLayout` como layout de React Router (elemento envolvente con `<Outlet>`) para toda ruta bajo `RequireAuth` (`ROUTES.DASHBOARD`, `ROUTES.SYSADMIN` y las rutas de feature que se agreguen a `constants/routes.ts`).
- **REQ-U2**: La sidebar DEBE construirse con los componentes de `react-pro-sidebar` (`Sidebar`, `Menu`, `MenuItem`), con el prop `collapsed` controlado desde `stores/ui.store.ts` — el ancho expandido/colapsado y su transición son responsabilidad de la librería, nunca CSS propio de ancho/grid (CLAUDE.md §9, evitar CSS custom salvo justificado).
- **REQ-U3**: El fondo de la sidebar y el fondo de la página DEBEN usar el mismo token (`background.DEFAULT` → `--bg-secondary`), de forma que no exista borde ni sombra perceptible entre ambos.
- **REQ-U4**: La sidebar NUNCA DEBE producir scroll propio — su alto es `100vh`, `overflow: hidden`, y su contenido (marca, nav, footer) se distribuye con flexbox para caber sin desbordar.
- **REQ-U5**: La topbar DEBE permanecer siempre visible (`position: sticky; top: 0`) independientemente del scroll del contenido o del estado de colapso de la sidebar.
- **REQ-U6**: Únicamente el área de contenido DEBE permitir scroll, y solo en el eje vertical (`overflow-y: auto; overflow-x: hidden`) — CLAUDE.md §9 prohíbe scroll horizontal en cualquier superficie.
- **REQ-U7**: Todo bloque de contenido dentro del área de contenido DEBE presentarse en tarjetas con esquinas redondeadas (`--radius-card` en `tailwind.config.ts`, nunca un valor de `border-radius` hardcodeado) sobre el fondo `--bg-secondary`.
- **REQ-U8**: El área de contenido DEBE tener un difuminado inferior ligero que enmascare el corte de contenido que sale del viewport. Se implementa como un elemento separado con `position: absolute; bottom: 0` dentro de un contenedor `position: relative` que envuelve (pero no es) el contenedor con scroll — **no** como `position: sticky` con margen negativo dentro del propio contenedor scrolleable: ese patrón fue el implementado inicialmente en el wireframe y resultó invisible cuando el contenido no desbordaba, porque el gradiente terminaba en el mismo color que ya tenía el fondo detrás.
- **REQ-U9**: El header de la sidebar DEBE mostrar, en este orden de precedencia: (1) el logo de la empresa en sesión si existe (`logoUrl`), (2) si no existe, la marca del sistema (`Logo`, SPEC-00 §Logo). Nunca ambos a la vez, nunca ninguno.
- **REQ-U10**: El menú de navegación del contexto tenant DEBE ser una única lista de ítems (Panel, Ventas, Cotizaciones, Inventario, Productos, Almacenes, Clientes) compartida por todos los roles de ese contexto — la visibilidad de cada ítem se resuelve por permiso (REQ-U12), nunca por un mapa hardcodeado rol→menú (CLAUDE.md §9 y consistente con SPEC-007 §Contexto: los permisos no son un mapa estático).
- **REQ-U11**: El contexto sysadmin (`ROUTES.SYSADMIN`, plataforma) DEBE renderizar un `<Menu>` estructuralmente distinto (Panel, Empresas, Planes, Usuarios, Auditoría) — no es el menú tenant con ítems adicionales ni ítems ocultos: sysadmin no pasa por resolución de permisos (SPEC-007 §Contexto: "superadmin y sysadmin siempre tienen acceso total y no pasan por esta resolución").
- **REQ-U12**: La visibilidad de cada ítem del menú tenant DEBE resolverse con `tieneModuloActivo(clave)` (`usePermisos()`, SPEC-007 REQ-U3) — salvo cuando `tieneAccesoTotal(data)` (SPEC-007 REQ-U10) sea `true`, caso en el que todos los ítems se muestran sin filtrar y `modulos` (vacío para ese caso) nunca se evalúa. Implementa el contrato que SPEC-007 REQ-U6 dejó pendiente para "el menú de navegación de `AppLayout`".
- **REQ-U13**: El footer de la sidebar DEBE contener, en este orden, el control de cambio de tema (claro/oscuro) y el botón de cerrar sesión, fijo en la parte inferior, siempre visible sin importar cuántos ítems tenga el nav activo.
- **REQ-U14**: La topbar DEBE mostrar, de izquierda a derecha: botón de colapso de sidebar, breadcrumb; y a la derecha: ícono de notificaciones, chip de usuario (avatar + nombre + rol).

### State-driven (mientras X)

- **REQ-S1**: Mientras la sidebar esté colapsada, los `MenuItem` DEBEN mostrar solo el ícono (label oculto) — comportamiento nativo de `react-pro-sidebar` en modo `collapsed`, sin reimplementarlo.
- **REQ-S2**: Mientras el contexto activo sea sysadmin, o mientras la empresa en sesión no tenga `logoUrl`, el header de la sidebar DEBE mostrar la marca del sistema (nunca intenta resolver un logo de empresa en contexto sysadmin, que no tiene empresa asociada).
- **REQ-S3**: Mientras `usePermisos()` esté en `isLoading`, el menú tenant DEBE mostrar un estado de espera tipo skeleton (`Skeleton` variant `text`, SPEC-00 §Skeleton) en vez de parpadear mostrando todos los ítems y luego ocultando los restringidos — mismo criterio que SPEC-007 REQ-S1 aplicado aquí a nivel de menú.
- **REQ-S4**: Mientras existan notificaciones no leídas, el ícono de notificaciones DEBE mostrar un indicador visual (punto) — sin contador numérico en esta versión (no hay endpoint real, ver REQ-O2).

### Event-driven (cuando X)

- **REQ-E1**: Cuando el usuario haga click en el botón de colapso (topbar, junto al breadcrumb), el sistema DEBE alternar `collapsed` en `stores/ui.store.ts` y persistir la preferencia (`localStorage`, CLAUDE.md §3 — "estado de sidebar/paneles" es estado de cliente puro).
- **REQ-E2**: Cuando cambie la ruta activa, el breadcrumb DEBE recalcularse dinámicamente a partir de la ruta (no un valor fijo por página) — diseñado para N niveles aunque hoy solo se pueble un nivel (módulo actual), porque ninguna feature tiene subrutas todavía (`constants/routes.ts`); se extiende sin cambiar el mecanismo cuando existan.
- **REQ-E3**: Cuando el usuario haga click en el ícono de notificaciones, el panel DEBE abrirse con una animación origin-aware (`transform-origin` anclado al trigger, no al centro — `emilkowalski`), ≤200ms, `ease-out`.
- **REQ-E4**: Cuando el usuario haga click fuera del panel de notificaciones abierto, o presione `Escape`, el panel DEBE cerrarse.
- **REQ-E5**: Cuando el usuario haga click en "Cerrar sesión", el sistema DEBE invocar `clearSession()` (`session.store`) y redirigir a `ROUTES.LOGIN`.
- **REQ-E6**: Cuando el usuario cambie de tema (claro/oscuro) desde el footer de la sidebar, el sistema DEBE actualizar el atributo `data-theme` en la raíz del documento y persistir la preferencia (mismo store que REQ-E1).

### Optional (donde X)

- **REQ-O1** _(parcialmente resuelto, 2026-08-03)_: `logoUrl` de la empresa ya llega vía TanStack Query (`usePerfil()`, `GET /auth/perfil` — implementado), pero el backend responde siempre `null` (Fase 2 de branding — subida de logo — diferida, sin mecanismo de subida de archivos todavía, ver `RESPUESTA-003-datos-usuario-y-logo-empresa.md`). Donde `logoUrl` eventualmente sea no-nulo, el sidebar ya lo consume sin cambios adicionales; hasta entonces REQ-U9/REQ-S2 resuelven siempre a la marca del sistema.
- **REQ-O2**: Donde exista un endpoint de notificaciones (no existe hoy), el dropdown consume datos reales vía `useQuery`; hasta entonces la estructura (trigger, panel, estados loading/error/empty) se construye con datos mock fijos y sin conteo real.

### Unwanted (si X entonces)

- **REQ-X1**: Si la sidebar cambia de estado (colapsada/expandida), el nombre, rol y avatar del usuario en el chip de la topbar NO DEBEN verse afectados — regresión real encontrada durante la revisión del wireframe (una regla CSS con selector `.shell[data-collapsed] .user-meta` sin acotar a `.sidebar` apagaba también el chip de la topbar). Cualquier estilo condicionado al colapso debe quedar estrictamente scopeado al árbol de la sidebar.
- **REQ-X2**: Si `tieneModuloActivo(clave)` resuelve `false` o falla (fail-closed, SPEC-007 REQ-X1/X2), el ítem de menú correspondiente DEBE ocultarse — nunca mostrarse deshabilitado ni mostrarse por defecto mientras se resuelve.
- **REQ-X3**: Si `usePerfil()` resuelve `nombre: null` (usuario sin `PerfilUsuario` en backend), o si `logoUrl` es `null` (siempre, por ahora — REQ-O1), el sistema DEBE mostrar un fallback (rol solo, avatar genérico, marca del sistema) en vez de bloquear el render, mostrar campos vacíos o inventar un valor. Mismo criterio mientras `usePerfil()` esté cargando o falle — nunca bloquea el render del resto del layout (a diferencia de `usePermisos()`/REQ-S3, que sí bloquea el menú: el nombre/logo no son datos de autorización).
- **REQ-X4**: Si el usuario está en contexto sysadmin, el sistema NUNCA DEBE invocar `usePermisos()` ni `usePerfil()` para resolver el menú o el chip de usuario (sysadmin no tiene módulos de tenant ni `PerfilUsuario`/empresa que resolver) — evita peticiones de red innecesarias y un estado de carga sin sentido para ese contexto.
- **REQ-X5** _(RESPUESTA-003, bug real corregido)_: Si `tieneAccesoTotal(data)` (SPEC-007 REQ-U10) es `true`, el sistema NUNCA DEBE evaluar `tieneModuloActivo` sobre `modulos` para decidir la visibilidad de un ítem del menú — `modulos` viene `[]` en ese caso, y evaluarlo de todas formas oculta el menú completo para un rol con acceso total (bug real encontrado en producción antes de que backend agregara `accesoTotal`: `GET /auth/permisos` respondía `403 ERR_SUPERADMIN_PROTECTED` para `superadmin`, y el fail-closed de SPEC-007 REQ-X1/X2 reducía la sidebar a un solo ítem).

## Criterios de aceptación

Cada REQ de arriba DEBE tener al menos un test que:

1. Lo referencia por ID exacto en un comentario: `// spec:SPEC-008:REQ-<X>`
2. Falla si el requisito no se cumple
3. Se ejecuta en `npm test` sin configuración adicional

## Tests trazados

| REQ | Test |
| --- | --- |
| U1 | `test/layouts/AppLayout/AppLayout.test.tsx`, `test/app/router.test.tsx` ("SPEC-008") |
| U2 | Prop controlada (`Sidebar.tsx`) respaldada por `test/stores/ui.store.test.ts` (persistencia del booleano que consume); la transición/modo-ícono es responsabilidad interna de `react-pro-sidebar`, sin test propio — ver §Riesgo documentado |
| U3/U4/U5/U6/U7 | Verificado por code review contra el wireframe interactivo de §Wireframe; son propiedades puramente visuales/CSS sin aserción de comportamiento razonable en jsdom — ver §Riesgo documentado (mismo criterio que SPEC-007 REQ-X2) |
| U8 | `test/layouts/AppLayout/ContentArea.test.tsx` — "el difuminado inferior es un hermano `absolute`..." |
| U9 | `test/layouts/AppLayout/SidebarBrand.test.tsx` (precedencia logo/marca) + `TenantChrome.test.tsx` — "consume usePerfil()... nombre comercial de la empresa" (dato real) |
| U10/U12 | `test/layouts/AppLayout/TenantChrome.test.tsx`, incl. "con accesoTotal: true, muestra todos los módulos..." |
| U11 | `test/layouts/AppLayout/SysadminChrome.test.tsx`, `AppLayout.test.tsx` |
| U13 | `test/layouts/AppLayout/SidebarFooter.test.tsx` (ambos controles presentes y funcionales) |
| U14 | `test/layouts/AppLayout/Topbar.test.tsx`, `UserChip.test.tsx`, `TenantChrome.test.tsx` — "...muestra el nombre real del usuario..." |
| S1 | Comportamiento nativo de `react-pro-sidebar` en modo `collapsed` — sin test propio, ver §Riesgo documentado |
| S2 | `SidebarBrand.test.tsx` — "con logoUrl, reemplaza..." |
| S3 | `TenantChrome.test.tsx` — "muestra un skeleton en el nav..." |
| S4 | `NotificationsDropdown.test.tsx` — "muestra un indicador visual..." |
| E1 | `test/stores/ui.store.test.ts` — "toggleSidebarCollapsed..." |
| E2 | `Breadcrumb.test.tsx` |
| E3/E4 | `NotificationsDropdown.test.tsx` |
| E5 | `SidebarFooter.test.tsx` — "Cerrar sesión..." |
| E6 | `SidebarFooter.test.tsx` (alterna `ui.store.theme`) + `Shell.test.tsx` (sincroniza `data-theme` en el documento) |
| O1 | `test/features/auth/usePerfil.test.tsx` (consulta real a `GET /auth/perfil`) + `TenantChrome.test.tsx`. `logoUrl` en sí sigue sin ejercitarse con un valor no-nulo real (backend nunca lo envía todavía) — `SidebarBrand.test.tsx` cubre esa rama con un valor de prueba |
| O2 | `NotificationsDropdown.test.tsx` (estructura + datos mock) |
| X1 | `Topbar.test.tsx` — regresión real encontrada en la revisión de diseño |
| X2 | `TenantChrome.test.tsx` (ocultamiento en el menú) + `test/app/RequirePermission.test.tsx` (SPEC-007, bloqueo a nivel de ruta) + `router.test.tsx` ("/ventas redirige...", wiring real) |
| X3 | `UserChip.test.tsx`, `SidebarBrand.test.tsx`, `TenantChrome.test.tsx` — "sin `role` resuelto todavía...", `usePerfil.test.tsx` — "propaga `nombre: null` tal cual..." |
| X4 | `SysadminChrome.test.tsx` — "nunca dispara una petición..."; `usePerfil.test.tsx` — "no dispara la consulta... rama sysadmin" |
| X5 | `test/app/RequirePermission.test.tsx` — "con accesoTotal: true, renderiza el Outlet aunque el módulo no esté en `modulos`..."; `TenantChrome.test.tsx` — mismo caso a nivel de menú; `test/features/auth/usePermisos.test.ts` — `describe('tieneAccesoTotal')` |

**Riesgo documentado**: REQ-U3/U4/U5/U6/U7 (fondo compartido, sin scroll propio de la sidebar, topbar sticky, scroll único vertical, cards redondeadas) y REQ-S1 (modo ícono de `react-pro-sidebar` al colapsar) son propiedades visuales/de layout que jsdom no renderiza con layout real (no hay motor de layout en el DOM simulado) — se validaron por code review contra el wireframe interactivo de §Wireframe, no con aserciones automatizadas. Mismo criterio que SPEC-007 adenda v1.2.0 (REQ-X2 sin test dedicado por REQ).

## Auditoría

> Ref: **api-pos SPEC-008** (`auditoria.spec.md`)

Sin eventos de auditoría directos — `AppLayout` es un shell de navegación puro, no ejecuta operaciones de negocio. El cierre de sesión (REQ-E5) invoca `clearSession()`, cuyo posible registro de auditoría (si backend lo requiere) corresponde a la spec de sesión/auth que lo emita, no a esta.

## Dependencias

- **Depende de**: SPEC-00 (Design System) — extiende `Logo` con precedencia de logo de empresa (REQ-U9); reutiliza `Skeleton` (REQ-S3). Cualquier componente nuevo verdaderamente reutilizable que surja de esta spec (ej. un `Avatar` genérico) debe registrarse primero en SPEC-00 antes de implementarse, por política — los que sean específicos de este layout (breadcrumb, panel de notificaciones) viven en `layouts/AppLayout/components/` y no requieren esa entrada.
- **Depende de**: SPEC-006 (Routing / Code Splitting) — `AppLayout` envuelve el `<Outlet>` de las rutas protegidas con lazy-loading ya resuelto por esa spec.
- **Depende de**: SPEC-007 (Permisos) — consume `usePermisos()`/`tieneModuloActivo`/`tieneAccesoTotal` para el menú tenant (REQ-U12); implementa el contrato que esa spec dejó pendiente en su REQ-U6, y el bypass de `accesoTotal` que su REQ-U10 exige (REQ-X5).
- **Depende de**: SPEC-005 (Sesión Tenant) — `session.store` (`accessToken`, `empresaId`) determina si hay sesión tenant activa.
- **Bloquea**: toda feature de dominio (ventas, cotizaciones, inventario, productos, almacenes, clientes) y el panel sysadmin (empresas, planes, usuarios, auditoría) — ninguna puede montarse sin este shell.
- **Resuelto** (backend, parcial): `frontend-a-backend/PETICION-003-datos-usuario-y-logo-empresa.md`, atendida en `api-pos/backend-a-frontend/RESPUESTA-003-datos-usuario-y-logo-empresa.md`. `nombre` de usuario y `empresa.nombre` ya tienen fuente real (`GET /auth/perfil`, `usePerfil()`); el bug de `accesoTotal` para `superadmin` quedó corregido (SPEC-007 REQ-U10, REQ-X5 de esta spec). Ya no bloquea REQ-U9/U14/U12.
- **Riesgo documentado / gap de contrato (no bloqueante, restante)**: `logoUrl` de la empresa **siempre** responde `null` — no existe mecanismo de subida de archivos en el backend (Fase 2 de branding, diferida, documentada en `api-pos/src/docs/pending.md` según la misma respuesta). REQ-X3/O1 definen el fallback mientras tanto; no requiere acción del frontend hasta que backend implemente la subida.
- **Riesgo documentado**: notificaciones (REQ-O2) sin endpoint backend — estructura construida, consumo real fuera de alcance de esta spec.

## Cambios

- v1.2.0 (2026-08-03): Backend respondió `PETICION-003` (`RESPUESTA-003-datos-usuario-y-logo-empresa.md`). Implementado `usePerfil()` (`GET /auth/perfil`, nuevo servicio/hook/tipo `PerfilUsuarioResponse`) — `TenantChrome` lo consume y pasa `nombre`/`empresa.nombre`/`empresa.logoUrl` reales a `Shell`. Corregido el bug real de `accesoTotal` (SPEC-007 REQ-U10): se agrega REQ-X5 y se actualiza REQ-U12 para saltar `tieneModuloActivo` cuando `tieneAccesoTotal(data)` es `true` — sin este fix, `superadmin` seguía viendo la sidebar reducida a un solo ítem pese a que backend ya no rechazaba la petición. REQ-X3/O1 se acotan al único gap restante: `logoUrl` siempre `null` (Fase 2 de branding diferida en backend, sin mecanismo de subida de archivos). Actualizadas también las rutas de test en §Tests trazados a su ubicación real en `test/` (movidas fuera de `src/` en una sesión previa). 120 tests pasan (`npx vitest run`); lint y `vite build` limpios.
- v1.1.0 (2026-08-03): Implementado y pasa a `active`. `src/layouts/AppLayout/` (Shell, Sidebar/SidebarBrand/Nav/SidebarFooter, Topbar/Breadcrumb/NotificationsDropdown/UserChip, ContentArea, TenantChrome/SysadminChrome/AppLayout, navConfig/icons), `stores/ui.store.ts` (tema + colapso, persistido), `hooks/useOnClickOutside.ts`, módulos nuevos en `constants/routes.ts`, y `app/router.tsx` envolviendo las rutas protegidas en `AppLayout` con `RequirePermission` por módulo tenant. Al conectar `RequirePermission`/`TenantChrome` de forma eager por primera vez, se corrigió también `app/RequirePermission.tsx` para importar `usePermisos`/`tieneModuloActivo` directo del archivo en vez del barrel `features/auth` (mismo criterio que SPEC-006 REQ-U1) — importar el barrel habría arrastrado `AuthLayout`/`LoginForm`/`RegistroForm`/`CompletarPerfilWizard` al chunk principal, verificado con `vite build` (los 4 se mantienen en chunks async separados). 111 tests pasan (`npx vitest run`); `npx vite build` compila sin errores nuevos — `tsc -b` señala errores preexistentes en `CompletarPerfilWizard.tsx` no relacionados con esta spec (confirmado con `git stash` contra `main`).
- v1.0.0 (2026-08-03): Versión inicial (`draft`). Documenta el shell de navegación completo tras iteración visual sobre un wireframe interactivo (ver §Wireframe): sidebar (`react-pro-sidebar`, colapso vía prop controlada), topbar (breadcrumb dinámico, notificaciones mock, chip de usuario), área de contenido (scroll vertical único, cards redondeadas, difuminado inferior) y menú unificado tenant/sysadmin resolviendo SPEC-007 REQ-U6. Documenta dos hallazgos de la revisión de diseño como requisitos (REQ-U14/REQ-X1: reubicación del toggle de colapso; REQ-U8: fix del difuminado) y un gap de contrato no bloqueante (REQ-X3: falta `nombre` de usuario y `nombre`/`logoUrl` de empresa en el backend actual).
