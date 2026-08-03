# SPEC-002: Vista de Login

## Metadata

- **ID**: SPEC-002
- **Dominio**: auth
- **Versión**: 1.3.1
- **Estado**: active
- **Owner**: `Equipo Frontend POS-MX`
- **Creada**: 2026-07-23
- **Última revisión**: 2026-07-28

## Contexto

El sistema POS requiere una puerta de entrada única para los roles Admin, Superadmin y Cajero. Esta vista es el primer punto de contacto del usuario con el producto, por lo que debe transmitir identidad de marca (Deccode) de forma clara además de resolver la autenticación contra la API existente.

La vista usa un layout dividido a la mitad: la columna izquierda es un panel de marca (Logo `Deccode` centrado) y la columna derecha contiene el formulario de acceso (correo + contraseña) centrado vertical y horizontalmente. El formulario debe comunicar con claridad sus tres estados posibles — reposo, envío en curso y error — ya que un login fallido silencioso o sin feedback de carga genera desconfianza inmediata en un sistema que maneja dinero y stock.

Esta spec cubre únicamente el comportamiento de la vista de login (`features/auth`). Los componentes de UI que consume (`Logo`, `Input`, `Button`) están documentados en **SPEC-001 §Logo, §Input, §Button** y no se redefinen aquí.

**Contrato de backend verificado** (`api-pos/src/{validators,constants,interfaces}/auth.*`): el login del backend no siempre resuelve en un simple "dashboard". `LoginResponse` es una unión discriminada (`LoginTenantResponse | LoginOnboardingResponse | LoginSysAdminResponse`) con banderas adicionales (`mustChangePassword`, `requiereSeleccionSucursal`, `subscriptionEnGracia`, `sessionConflict`) que determinan a dónde debe navegar el front tras un login exitoso. Esta spec define cómo la vista de login reacciona a cada variante; el detalle de las pantallas destino (completar perfil, selección de sucursal, cambio de contraseña temporal) se documenta en sus specs correspondientes — aquí solo se exige el enrutamiento correcto.

**Decisión de arquitectura de rutas**: solo `/login`, `/registro`, `/olvide-contrasena` y `/reset-contrasena` son públicas. `/completar-perfil` requiere `onboardingToken` (guard propio, distinto de las rutas protegidas por `accessToken`) porque es una sesión parcial — ocurre en el primer inicio de sesión, cuando el usuario aún debe completar los datos de su empresa. Selección de sucursal y cambio de contraseña temporal **no son rutas**: son modales bloqueantes renderizados sobre el dashboard cuando `accessToken` ya existe, gatillados por las banderas `requiereSeleccionSucursal`/`mustChangePassword` del store de sesión — evita escribir una ruta dedicada para un paso intermedio de un flujo que ya está autenticado.

**Panel compartido login/registro (v1.3.0)**: `/login` y `/registro` renderizan el mismo componente de panel (columna izquierda `BrandPanel` + columna derecha con el formulario), que soporta dos modos de contenido — `login` (esta spec) y `registro` (ver **SPEC-003**) — determinados por la ruta de entrada. Un enlace en el panel de login permite alternar al modo registro sin recargar la página, con una transición animada dentro del mismo contenedor (REQ-U10, REQ-U11, REQ-S6, REQ-S7, REQ-E8, REQ-E9). Esta spec define el contrato del toggle y su animación; el contenido propio del formulario de registro (campos, botón, bloque de auth social) se documenta en SPEC-003.

## Requisitos en formato EARS

### Ubiquitous (siempre aplica)

- **REQ-U1**: El sistema DEBE presentar la vista de login en un layout de dos columnas de igual ancho (split 50/50) en resoluciones de escritorio.
- **REQ-U2**: El sistema DEBE renderizar el componente `Logo` (ver SPEC-001 §Logo, tamaño `xl`) centrado vertical y horizontalmente en la columna izquierda.
- **REQ-U3**: El sistema DEBE centrar el formulario de inicio de sesión vertical y horizontalmente dentro de la columna derecha.
- **REQ-U4**: El sistema DEBE mostrar un mensaje de bienvenida encima de los campos del formulario.
- **REQ-U5**: El sistema DEBE renderizar los campos "Correo electrónico" y "Contraseña" usando el componente `Input` (ver SPEC-001 §Input) con su label visible asociado, nunca solo `placeholder`.
- **REQ-U6**: El campo de contraseña DEBE usar la variante `password` de `Input` con control de mostrar/ocultar integrado.
- **REQ-U7**: El sistema DEBE mostrar un enlace "¿Olvidaste tu contraseña?" visible junto al campo de contraseña o inmediatamente debajo de él.
- **REQ-U8**: El botón de envío DEBE usar el componente `Button` (ver SPEC-001 §Button) con `fullWidth` (100% del ancho disponible del formulario).
- **REQ-U9**: La validación de los campos DEBE resolverse con un esquema Zod en `features/auth/schemas/` que replique byte-a-byte `loginSchema` de `api-pos/src/validators/auth.validator.ts`: `email` con formato de correo (mensaje "Email inválido") y `password` únicamente como string no vacío (mensaje "La contraseña es requerida"). El login NO aplica la regla de fuerza de contraseña (min. 8, mayúscula, número) — esa regla es exclusiva de registro/reset y no debe copiarse aquí.
- **REQ-U10**: El panel de autenticación (columna derecha) DEBE ser un componente compartido con dos modos de contenido — `login` y `registro` (ver SPEC-003) — determinados por la ruta de entrada (`/login`, `/registro`). Alternar entre modos NO debe desmontar `BrandPanel` (columna izquierda) ni recargar la página.
- **REQ-U11**: El sistema DEBE mostrar, dentro del panel de login, un enlace "¿No tienes una cuenta? Regístrate aquí" como acción secundaria (visualmente subordinada al botón de envío).

### State-driven (mientras X)

- **REQ-S1**: Mientras el campo de contraseña esté en modo oculto, el sistema DEBE renderizarlo como `type="password"` y mostrar el control para revelarlo.
- **REQ-S2**: Mientras el campo de contraseña esté en modo visible, el sistema DEBE renderizarlo como texto plano y mostrar el control para volver a ocultarlo.
- **REQ-S3**: Mientras la petición de login esté en curso, el sistema DEBE deshabilitar el botón de envío, activar su estado `isLoading` y cambiar su label al texto de acción en curso (ej. "Iniciando sesión...").
- **REQ-S4**: Mientras la petición de login esté en curso, el sistema DEBE deshabilitar los campos del formulario para evitar doble envío.
- **REQ-S5**: Mientras la sesión activa tenga `requiereSeleccionSucursal: true` (2+ `UserSucursal` activas sin ninguna fijada automáticamente, ver `LoginTenantResponse`), el sistema DEBE navegar al dashboard pero bloquear su interacción con un modal de selección de sucursal (no una ruta propia) hasta que se resuelva.
- **REQ-S6**: Mientras el panel alterne entre modo `login` y modo `registro`, el sistema DEBE animar la transición como un crossfade: el contenido que entra anima `opacity` (0→1) y `filter: blur` (2px→0) en 220ms con easing `cubic-bezier(0.23, 1, 0.32, 1)`; el contenido que sale anima `opacity` (1→0) en 140ms (más rápido que la entrada). La altura del contenedor se reajusta de inmediato al contenido nuevo, sin animar `height`/`width` directamente. La transición DEBE implementarse con CSS transitions (no `@keyframes`) para permanecer interrumpible si el usuario alterna rápidamente entre modos.
- **REQ-S7**: Mientras `prefers-reduced-motion: reduce` esté activo, el sistema DEBE reemplazar la animación de REQ-S6 por un fade de opacidad simple (sin `blur` ni easing pronunciado), respetando la preferencia de accesibilidad del usuario.

### Event-driven (cuando X)

- **REQ-E1**: Cuando el usuario active el control de mostrar/ocultar contraseña, el sistema DEBE alternar el modo del campo sin perder el valor ingresado ni el foco actual.
- **REQ-E2**: Cuando el usuario envíe el formulario y la validación Zod pase, el sistema DEBE disparar la mutación de login vía TanStack Query (`useMutation`).
- **REQ-E3**: Cuando la mutación de login resuelva con una `LoginTenantResponse` (`perfilCompleto: true`), el sistema DEBE persistir `accessToken`/`refreshToken` (y las banderas `mustChangePassword`/`requiereSeleccionSucursal`) en el store de sesión de Zustand y navegar al dashboard.
- **REQ-E4**: Cuando el usuario haga click en "¿Olvidaste tu contraseña?", el sistema DEBE navegar a la vista de recuperación de contraseña sin perder el valor ya escrito en el campo de correo.
- **REQ-E5**: Cuando la respuesta incluya `mustChangePassword: true`, el sistema DEBE persistir los tokens, navegar al dashboard y bloquear su interacción con un modal de cambio de contraseña temporal (no una ruta propia) hasta que se resuelva. Tiene prioridad sobre `requiereSeleccionSucursal` si ambas banderas llegan en `true`.
- **REQ-E6**: Cuando la mutación resuelva con una `LoginOnboardingResponse` (`perfilCompleto: false`), el sistema DEBE persistir `onboardingToken`/`refreshToken` (no `accessToken`) y redirigir al flujo de completar perfil, no al dashboard.
- **REQ-E7**: Cuando la mutación resuelva con una `LoginSysAdminResponse` (sin campo `perfilCompleto`), el sistema DEBE redirigir al panel de sysadmin en vez del dashboard de tenant.
- **REQ-E8**: Cuando el usuario haga click en "¿No tienes una cuenta? Regístrate aquí", el sistema DEBE alternar el panel a modo `registro` (ver SPEC-003) con la animación de REQ-S6, actualizando la ruta a `/registro` mediante navegación superficial (sin recarga de página, sin desmontar `BrandPanel`).
- **REQ-E9**: Cuando la transición de REQ-S6/E8 termine, el sistema DEBE mover el foco programáticamente al primer campo del formulario recién mostrado (Correo electrónico), para que usuarios de teclado y lector de pantalla no pierdan el contexto de navegación.

### Optional (donde X)

- **REQ-O1**: Donde el usuario ya tenga una sesión válida almacenada, el sistema DEBE redirigir automáticamente fuera de `/login` sin mostrar el formulario.
- **REQ-O2**: Donde la respuesta de login incluya `subscriptionEnGracia: true`, el sistema DEBE permitir el acceso normalmente y mostrar un aviso persistente de período de gracia (no bloqueante).
- **REQ-O3**: Donde la respuesta de login incluya `sessionConflict: true`, el sistema DEBE informar al usuario que existía una sesión activa en otro dispositivo/contexto antes de continuar al destino post-login.

### Unwanted (si X entonces)

- **REQ-X1**: Si el backend responde `ERR_INVALID_CREDENTIALS` (401), el sistema DEBE mostrar un mensaje de error genérico e inline (sin indicar si el campo incorrecto fue el correo o la contraseña) y NO debe limpiar el valor ya ingresado.
- **REQ-X2**: Si el backend responde un error de red o de servidor (5xx), el sistema DEBE comunicarlo vía el componente de notificación global (toast), normalizado por el interceptor centralizado de axios.
- **REQ-X3**: Si el usuario envía el formulario con campos vacíos o con formato inválido, el sistema DEBE bloquear el envío, marcar los campos con `aria-invalid` y mostrar el mensaje de validación Zod específico junto a cada campo, sin llamar a la API.
- **REQ-X4**: Si la petición de login excede el tiempo de espera configurado, el sistema DEBE restaurar el botón a su estado de reposo y mostrar feedback de timeout con opción de reintentar.
- **REQ-X5**: Si el backend responde `ERR_ACCOUNT_LOCKED` (tras `AUTH_CONFIG.MAX_LOGIN_INTENTOS` = 5 intentos fallidos), el sistema DEBE mostrar un mensaje indicando el bloqueo temporal de la cuenta (`AUTH_CONFIG.BLOQUEO_MINUTOS` = 30 min) y mantener el botón de envío deshabilitado mientras dure el bloqueo informado.
- **REQ-X6**: Si el backend responde `ERR_SUBSCRIPTION_EXPIRED` o `subscriptionExpired: true`, el sistema DEBE mostrar un mensaje específico de suscripción vencida (distinto del genérico de credenciales) y NO redirigir al dashboard.
- **REQ-X7**: Si el backend responde `ERR_EMAIL_NOT_VERIFIED`, el sistema DEBE mostrar un mensaje específico indicando que el correo no ha sido verificado (distinto del genérico de credenciales inválidas).

## Criterios de aceptación

Cada REQ de arriba DEBE tener al menos un test que:

1. Lo referencia por ID exacto en un comentario: `// spec:SPEC-002:REQ-<X>`
2. Falla si el requisito no se cumple
3. Se ejecuta en `npm test` sin configuración adicional

## Tests trazados

<!-- Completar conforme se implemente features/auth -->

- _(pendiente de implementación)_

## Auditoría

> Ref: **SPEC-008**

| Acción           | Constante            | Cuándo se registra                                      |
| ---------------- | -------------------- | ------------------------------------------------------- |
| Intento de login | `AUTH_LOGIN_ATTEMPT` | En cada envío del formulario, exitoso o fallido         |
| Login exitoso    | `AUTH_LOGIN_SUCCESS` | Cuando la mutación de login resuelve con éxito (REQ-E3) |
| Login fallido    | `AUTH_LOGIN_FAILED`  | Cuando el backend responde 401 (REQ-X1)                 |

## Dependencias

- **Depende de**: SPEC-001 (Design System) — componentes `Logo`, `Input`, `Button`.
- **Depende de** (backend, `api-pos/src/`): `validators/auth.validator.ts` (`loginSchema`), `constants/auth.constants.ts` (`AUTH_ERRORS`, `AUTH_CONFIG`), `interfaces/auth.interfaces.ts` (`LoginResponse` y sus variantes). Cualquier cambio en estos tres archivos invalida REQ-U9, REQ-E3/E5/E6/E7, REQ-S5, REQ-O2/O3 y REQ-X1/X5/X6/X7 — revisar esta spec antes de actualizar el esquema Zod del front.
- **Bloquea**: `AppLayout` y las rutas protegidas por `accessToken` (`app/RequireAuth`), spec del modal de selección de sucursal (REQ-S5), spec del modal de cambio de contraseña temporal (REQ-E5), spec de completar perfil / onboarding recovery (REQ-E6, ruta protegida por `onboardingToken` vía `app/RequireOnboarding`).
- **Relacionado con**: SPEC-003 (Pre-registro) — comparte el componente de panel y el contrato de animación del toggle (REQ-U10/U11, REQ-S6/S7, REQ-E8/E9). Cambios en la firma de estos REQs invalidan la implementación del toggle en SPEC-003.

## Cambios

- v1.3.1 (2026-07-28): Fix de bug en `AnimatedAuthOutlet.tsx` (REQ-E9) — el movimiento de foco tras la transición nunca se ejecutaba: el timeout de foco (220ms) y el timeout que descarta el layer saliente (140ms) compartían el mismo efecto de React, y al dispararse el segundo primero, su cleanup cancelaba el primero antes de que llegara a ejecutarse. Se separaron en efectos independientes. Bug detectado al escribir los tests trazables de SPEC-004 REQ-E5, que reimplementa este mismo contrato de animación para el wizard de completar perfil.
- v1.0.0 (2026-07-23): Versión inicial.
- v1.1.0 (2026-07-23): Alineado con el contrato real del backend (`api-pos/src/validators`, `constants`, `interfaces` de `auth`). Se corrige REQ-U9 (el login no valida fuerza de contraseña). Se reemplaza el REQ-E3 genérico por el manejo de la unión discriminada `LoginResponse` (tenant / onboarding / sysadmin / mustChangePassword / requiereSeleccionSucursal). Se agregan REQ-S5, REQ-O2, REQ-O3, REQ-X5, REQ-X6, REQ-X7 para bloqueo por intentos fallidos, suscripción vencida, email no verificado, selección de sucursal y conflicto de sesión.
- v1.2.0 (2026-07-23): Selección de sucursal y cambio de contraseña temporal dejan de navegar a una ruta propia (REQ-S5/E5 corregidos) — pasan a ser modales bloqueantes sobre el dashboard, gatillados por banderas en `stores/session.store`, resueltos por `app/RequireAuth`. `/completar-perfil` queda gateado por un guard distinto (`app/RequireOnboarding`, `onboardingToken`) al del resto de rutas protegidas (`app/RequireAuth`, `accessToken`).
- v1.3.0 (2026-07-23): Nueva ruta pública `/registro`. El panel de login pasa a ser un componente compartido con SPEC-003 (dos modos: `login`/`registro`) con toggle animado en el mismo contenedor — nuevos REQ-U10, REQ-U11, REQ-S6, REQ-S7, REQ-E8, REQ-E9. Contrato de animación (crossfade 220ms entrada / 140ms salida, `cubic-bezier(0.23,1,0.32,1)`, sin animar `height`/`width`, CSS transitions interrumpibles, fallback `prefers-reduced-motion`) definido con `ui-ux-pro-max` y `emil-design-eng`.
