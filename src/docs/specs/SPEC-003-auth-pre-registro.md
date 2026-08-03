# SPEC-003: Vista de Pre-registro

## Metadata

- **ID**: SPEC-003
- **Dominio**: auth
- **Versión**: 1.2.0
- **Estado**: active
- **Owner**: `Equipo Frontend POS-MX`
- **Creada**: 2026-07-23
- **Última revisión**: 2026-07-23

## Contexto

La vista de pre-registro es la puerta de entrada para nuevos negocios (tenants) que se auto-registran en el sistema SaaS. Es el primer paso de un flujo de onboarding de tres etapas — pre-registro → verificación de email → completar perfil — definido en **SPEC-001** del backend (Flujos A y B). Esta spec cubre únicamente la primera etapa: captura de credenciales (correo + contraseña) y disparo del alta de cuenta.

**Decisión de producto**: el formulario pide únicamente correo y contraseña. No incluye selector de plan — `planId` se omite siempre en la petición, de modo que el backend auto-asigna el plan de prueba (7 días) al completar el perfil (ver `api-pos/src/services/auth.service.ts` §`preRegistroService`).

**Atajo temporal de desarrollo (fuera del flujo real de producción)**: el servicio de envío de emails aún no está implementado en el backend, por lo que el flujo real (clic en un enlace de correo para continuar) no se puede probar de punta a punta. Mientras tanto, `POST /auth/pre-registro` expone un campo `verificationTokenDevOnly` en su respuesta — presente únicamente cuando `NODE_ENV !== 'production'` (ver `api-pos/src/services/auth.service.ts` líneas 89-93, comentario `TEMPORAL — DEV ONLY`). Esta spec documenta **exclusivamente** ese atajo: el front usa `verificationTokenDevOnly` para encadenar automáticamente `POST /verificar-email` sin depender de un inbox real, y así llegar a `/completar-perfil` con un `OnboardingToken` legítimo.

**Fuera de alcance deliberado**: el comportamiento de producción real — pantalla "revisa tu correo" cuando `verificationTokenDevOnly` no viene en la respuesta — no se documenta en esta versión. Esta spec deberá revisarse y ampliarse cuando el servicio de email quede activo y ese campo se retire de la respuesta del backend.

**Arquitectura de panel compartido (v1.1.0)**: esta vista NO es una ruta independiente con layout propio. `/registro` y `/login` renderizan el mismo componente de panel definido en **SPEC-002** (columna izquierda `BrandPanel` fija, columna derecha con contenido alternable). El modo `registro` se activa por entrada directa a `/registro` o por el toggle "¿No tienes una cuenta? Regístrate aquí" del panel de login (SPEC-002 REQ-U11, REQ-E8), con la animación de crossfade y el manejo de foco definidos en SPEC-002 REQ-S6/S7/E9 — esta spec no redefine esa animación, solo el contenido propio del formulario de registro.

**Decisión de producto — enlace de regreso a login (revierte v1.1.0)**: el formulario de registro SÍ incluye un enlace simétrico "¿Ya tienes cuenta? Inicia sesión" (REQ-U9, REQ-E4) que alterna el panel de vuelta al modo login. Es el segundo punto de entrada al toggle animado, complementando el de SPEC-002 REQ-U11.

Reutiliza el layout de dos columnas y los componentes (`Logo`, `Input`, `Button`) ya definidos en **SPEC-001** (design system) y usados en **SPEC-002** (login) — no se rediseña la composición visual, solo cambia el contenido del formulario.

## Requisitos en formato EARS

### Ubiquitous (siempre aplica)

- **REQ-U1**: El sistema DEBE presentar la vista de pre-registro en el mismo layout de dos columnas (split 50/50) que la vista de login (ver SPEC-002 REQ-U1), reutilizando `BrandPanel`.
- **REQ-U2**: El sistema DEBE centrar el formulario vertical y horizontalmente en la columna derecha, con un mensaje de bienvenida encima de los campos.
- **REQ-U3**: El sistema DEBE renderizar los campos "Correo electrónico" y "Contraseña" usando el componente `Input` (ver SPEC-001 §Input) con label visible, nunca solo `placeholder`.
- **REQ-U4**: El campo de contraseña DEBE usar la variante `password` de `Input` con control de mostrar/ocultar integrado.
- **REQ-U5**: El botón de envío DEBE usar el componente `Button` con `fullWidth` y label en reposo "Registrarse" (no "Crear cuenta" ni variantes).
- **REQ-U6**: La validación de los campos DEBE resolverse con un esquema Zod en `features/auth/schemas/` que replique byte-a-byte `preRegistroSchema` de `api-pos/src/validators/auth.validator.ts`: `email` con formato de correo (mensaje "Email inválido"); `password` con mínimo 8 caracteres (mensaje "La contraseña debe tener al menos 8 caracteres"), al menos una mayúscula (mensaje "La contraseña debe contener al menos una mayúscula") y al menos un número (mensaje "La contraseña debe contener al menos un número"). El formulario NO incluye un campo `planId`.
- **REQ-U7**: Debajo del formulario principal (correo + contraseña + botón "Registrarse"), el sistema DEBE mostrar un separador con el texto "o continúa con" seguido de tres botones de autenticación social — Google, Microsoft y Apple — cada uno con el logo oficial del proveedor (activos de marca oficiales, nunca recreaciones no oficiales, ver `ui-ux-pro-max` §Correct Brand Logos) y el label "Continuar con `<Proveedor>`".
- **REQ-U8**: Los tres botones de REQ-U7 DEBEN renderizarse en estado `disabled` mientras la integración con cada proveedor no esté implementada: sin `onClick`, sin ninguna llamada al backend, opacidad reducida (0.4–0.5), atributo `disabled` nativo (o `aria-disabled="true"` si el marcado lo requiere) y un `title` (tooltip nativo) con el texto "Próximamente disponible". Deben conservar un área táctil mínima de 44px de alto pese a estar deshabilitados.
- **REQ-U9**: El sistema DEBE mostrar, debajo del bloque de auth social, un enlace "¿Ya tienes una cuenta? Inicia sesión" como acción secundaria (visualmente subordinada al botón "Registrarse").

### State-driven (mientras X)

- **REQ-S1**: Mientras el campo de contraseña esté en modo oculto, el sistema DEBE renderizarlo como `type="password"` y mostrar el control para revelarlo.
- **REQ-S2**: Mientras el campo de contraseña esté en modo visible, el sistema DEBE renderizarlo como texto plano y mostrar el control para volver a ocultarlo.
- **REQ-S3**: Mientras la secuencia de pre-registro esté en curso (desde el envío del formulario hasta que resuelva la llamada encadenada a `verificar-email`, ver REQ-E2), el sistema DEBE deshabilitar el botón de envío, activar su estado `isLoading` y cambiar su label al texto de acción en curso (ej. "Creando tu cuenta...").
- **REQ-S4**: Mientras la secuencia descrita en REQ-S3 esté en curso, el sistema DEBE deshabilitar los campos del formulario para evitar doble envío.

### Event-driven (cuando X)

- **REQ-E1**: Cuando el usuario envíe el formulario y la validación Zod pase, el sistema DEBE disparar la mutación de pre-registro vía TanStack Query (`useMutation`) enviando únicamente `{ email, password }`.
- **REQ-E2**: Cuando la mutación de pre-registro resuelva con éxito y la respuesta incluya `verificationTokenDevOnly`, el sistema DEBE encadenar automáticamente, sin intervención del usuario, una llamada `POST /verificar-email` usando ese valor como `token`.
- **REQ-E3**: Cuando la llamada encadenada de `verificar-email` (REQ-E2) resuelva con éxito, el sistema DEBE persistir `onboardingToken`/`refreshToken` en el store de sesión de Zustand y navegar a `/completar-perfil`.
- **REQ-E4**: Cuando el usuario haga click en "Inicia sesión", el sistema DEBE alternar el panel a modo `login` (ver SPEC-002) con la animación de crossfade definida en SPEC-002 REQ-S6/S7, actualizando la ruta a `/login` mediante navegación superficial (sin recarga de página, sin desmontar `BrandPanel`).

### Unwanted (si X entonces)

- **REQ-X1**: Si el backend responde `ERR_EMAIL_ALREADY_EXISTS` (400) en el paso de pre-registro, el sistema DEBE mostrar un mensaje inline "Este correo ya está registrado." junto al campo de correo y NO debe limpiar los valores ya ingresados.
- **REQ-X2**: Si el backend responde un error de red o de servidor (5xx) en cualquiera de las dos llamadas de la secuencia (pre-registro o la `verificar-email` encadenada), el sistema DEBE comunicarlo vía el componente de notificación global (toast), normalizado por el interceptor centralizado de axios, y restaurar el formulario a su estado de reposo.
- **REQ-X3**: Si el usuario envía el formulario con campos vacíos o con formato inválido, el sistema DEBE bloquear el envío, marcar los campos con `aria-invalid` y mostrar el mensaje de validación Zod específico junto a cada campo, sin llamar a la API.
- **REQ-X4**: Si la llamada encadenada a `verificar-email` (REQ-E2) falla por cualquier motivo (ej. `ERR_TOKEN_EXPIRED`, `ERR_TOKEN_INVALID`, `ERR_ACCOUNT_LOCKED`), el sistema DEBE tratarlo como un fallo interno de la secuencia — mostrar un mensaje genérico vía toast ("No se pudo completar tu registro, intenta de nuevo.") en lugar de un error de validación de campo, y restaurar el formulario a su estado de reposo.
- **REQ-X5**: Si alguna de las dos peticiones de la secuencia excede el tiempo de espera configurado, el sistema DEBE restaurar el botón a su estado de reposo y mostrar feedback de timeout con opción de reintentar desde el principio (pre-registro).

## Criterios de aceptación

Cada REQ de arriba DEBE tener al menos un test que:

1. Lo referencia por ID exacto en un comentario: `// spec:SPEC-003:REQ-<X>`
2. Falla si el requisito no se cumple
3. Se ejecuta en `npm test` sin configuración adicional

## Tests trazados

<!-- Completar conforme se implemente features/auth -->

- _(pendiente de implementación)_

## Auditoría

> Ref: **SPEC-008**

| Acción                | Constante           | Cuándo se registra                                                                                                                               |
| --------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Verificación de email | `AUTH_EMAIL_VERIFY` | En la llamada encadenada`POST /verificar-email` (REQ-E2), éxito o fallo — el backend ya la registra vía `registrarAuditoria` en `auth.routes.ts` |

`POST /auth/pre-registro` en sí **no genera evento de auditoría directo** — la ruta correspondiente en `api-pos/src/routes/v1/auth.routes.ts` no tiene el middleware `registrarAuditoria` a diferencia del resto de endpoints de `auth`. Si se requiere auditar el intento de pre-registro, debe agregarse primero en el backend (SPEC-001/SPEC-008) antes de asumirlo desde el front.

## Dependencias

- **Depende de**: SPEC-001 (Design System) — componentes `Logo`, `Input`, `Button`.
- **Depende de**: SPEC-002 (Login) — es la spec dueña del componente de panel compartido, la ruta `/registro`, el toggle de entrada (REQ-U11, REQ-E8) y el contrato de animación/foco (REQ-U10, REQ-S6, REQ-S7, REQ-E9). Esta spec NO redefine esos requisitos, solo los consume. A partir de v1.2.0 el toggle es bidireccional: REQ-U9/E4 de esta spec son el punto de entrada simétrico de vuelta a `/login`, usando el mismo contrato de animación de SPEC-002.
- **Depende de** (backend, `api-pos/src/`): `validators/auth.validator.ts` (`preRegistroSchema`), `interfaces/auth.interfaces.ts` (`PreRegistroResponse`, campo `verificationTokenDevOnly`), `constants/auth.constants.ts` (`AUTH_ERRORS`), `routes/v1/auth.routes.ts`. Cualquier cambio en estos archivos invalida REQ-U6, REQ-E2/E3 y REQ-X1/X4 — revisar esta spec antes de actualizar el esquema Zod del front.
- **Bloquea**: SPEC-004 (Completar Perfil) — vista `/completar-perfil` (formulario de datos personales + empresa), ruta protegida por `onboardingToken` (`app/RequireOnboarding`, ver SPEC-002 §Decisión de arquitectura de rutas).
- **Riesgo documentado**: esta spec depende de un campo (`verificationTokenDevOnly`) marcado como `TEMPORAL — DEV ONLY` en el backend. Cuando el servicio de email se active en producción, este spec DEBE revisarse: el REQ-E2 dejará de aplicarse tal cual y se necesitará una pantalla intermedia "revisa tu correo" (fuera de alcance de v1.1.0, ver §Contexto).
- **Riesgo documentado**: los botones de auth social (REQ-U7/U8) no tienen contrato de backend — no existe spec de OAuth con Google/Microsoft/Apple en `api-pos/src/docs/specs/`. Cuando esa integración exista, esta spec DEBE actualizarse para reemplazar el estado `disabled` por el flujo real (redirect/popup OAuth, manejo de callback y errores).

## Cambios

- v1.0.0 (2026-07-23): Versión inicial. Cubre únicamente el atajo `verificationTokenDevOnly`; el flujo real de producción (pantalla "revisa tu correo") queda fuera de alcance hasta que el servicio de email esté activo.
- v1.1.0 (2026-07-23): Corrección de arquitectura — esta vista deja de ser una ruta con layout propio y pasa a ser el modo `registro` del panel compartido definido en SPEC-002 (toggle originado en el panel de login, animación y manejo de foco documentados ahí). Se elimina REQ-U7/REQ-E4 original (enlace "Inicia sesión" que navegaba a `/login`) — decisión de producto: este formulario no tiene enlace de regreso a login. Se agrega label explícito "Registrarse" al botón de envío (REQ-U5). Se agregan REQ-U7/REQ-U8 (nuevos): bloque de autenticación social (Google, Microsoft, Apple) debajo del formulario principal, renderizado en estado `disabled` por no estar implementado — lineamientos de composición y accesibilidad de `ui-ux-pro-max`, sin contrato de backend aún.
- v1.2.0 (2026-07-23): Se revierte la decisión de v1.1.0 sobre el enlace de regreso — el formulario de registro vuelve a incluir "¿Ya tienes una cuenta? Inicia sesión" (nuevos REQ-U9, REQ-E4), debajo del bloque de auth social, alternando el panel a modo `login` con el mismo contrato de animación de SPEC-002. El toggle entre modos queda bidireccional.
