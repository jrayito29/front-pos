# Protocolo de Gobernanza y Estándares de Desarrollo — Frontend (AI-Governance)

Este documento rige todas las interacciones de codificación y decisiones arquitectónicas para el **frontend** del proyecto POS-MX (ver stack y arquitectura en `CLAUDE.md`). Claude debe adherirse estrictamente a estas reglas, en conjunto con las definidas para el backend en su propio `GOBERNANZA.md`.

## 1. Principios de Codificación

- **Single Source of Truth:** El backend es la autoridad máxima de datos y reglas de negocio. El frontend **nunca** recalcula ni reimplementa lógica de negocio crítica (IVA, validación de stock, totales de venta) de forma independiente — solo puede mostrar _previews_ de UX (ver sección 5) que luego se validan y confirman contra la respuesta real de la API.
- **DRY (Don't Repeat Yourself):** Toda transformación de datos repetida (formateo de fechas, formateo MXN, mapeo de estados a labels/colores) vive en `src/lib/` o `src/utils/`, nunca duplicada dentro de componentes o features.
- **Fail-Fast:** Los esquemas Zod de `React Hook Form` son la primera línea de defensa antes de disparar cualquier `mutation`. Si el formulario es inválido, no se realiza la petición a la API.

### Principios SOLID (obligatorios en toda nueva implementación)

- **S — Single Responsibility:** Un componente de presentación no gestiona fetching; un hook de feature no renderiza UI; un store de Zustand no contiene lógica de formateo.
- **O — Open/Closed:** Los componentes reutilizables (`components/`) se extienden vía props/composición (`children`, render props, variantes), nunca modificando su lógica interna para casos particulares de una sola feature.
- **L — Liskov Substitution:** Cualquier implementación concreta de un tipo compartido (ej. una variante de `Input`, un handler de `onSubmit`) debe poder sustituirse sin romper el componente padre que la consume.
- **I — Interface Segregation:** Los props de un componente deben ser mínimos y específicos a su propósito; evitar props "bolsa de todo" (`config: any`). Preferir componer varios componentes pequeños sobre uno con 15 props opcionales.
- **D — Dependency Inversion:** Los componentes y hooks de feature no dependen directamente de `axios` ni de la forma cruda de la respuesta HTTP — dependen de las funciones de `services/` y de los tipos definidos en `src/interfaces/`, que actúan como la abstracción entre UI y transporte.

## 2. Estándares de Consumo de API

- **Nomenclatura de `queryKey`:** Arrays jerárquicos y consistentes por feature: `['productos', 'list', filtros]`, `['productos', 'detail', id]`, `['ventas', 'list', filtros]`. Nunca strings planos ni claves improvisadas por componente.
- **Mapeo de operaciones:**
  - `GET` → `useQuery`.
  - `POST` / `PUT` / `PATCH` / `DELETE` → `useMutation`, con invalidación explícita del `queryKey` afectado en `onSuccess`.
- **Un `service` por entidad:** `services/productos.service.ts` expone funciones puras (`getProductos`, `createProducto`, etc.) que retornan `data` ya tipada; ningún componente o hook llama a `axios` directamente.
- **Contrato de respuesta:** Toda función de `services/` asume el contrato `{ success, data, meta }` del backend y retorna únicamente `data`/`meta` desestructurados. El wrapper `success` nunca se propaga a los componentes.
- **Errores tipados:** Los errores de Axios se normalizan en el interceptor al shape `ErrorResponse` del backend (`{ success: false, error: { code, message } }`) antes de llegar al `onError` de cualquier mutation/query.

## 3. Manejo de Estado y Seguridad

- **Sesión vía JWT:** El Access Token se mantiene en memoria (store de Zustand `useAuthStore`), **nunca** en `localStorage`. El Refresh Token es manejado por el backend (cookie httpOnly) — el frontend nunca lo lee ni lo almacena directamente.
- **Headers de Contexto Obligatorios:** El interceptor de Axios (`services/apiClient.ts`) debe adjuntar automáticamente, en cada petición autenticada, los headers definidos en `AUTH_HEADERS` del backend:
  - `authorization` — Bearer token, leído del store de sesión.
  - `x-empresa-id` — obtenido del claim del JWT decodificado en sesión, nunca de un input de usuario o de un store editable manualmente.
  - `x-usuario-id` — igual origen que el anterior.
  - Ningún componente debe construir o pasar estos headers manualmente; el interceptor es el único punto de inyección.
- **Sanitización / Multi-tenancy en UI:** Ningún `select` de almacén, cliente o recurso debe poblarse con IDs "confiados" del estado local sin que provengan de una respuesta de la API ya filtrada por permisos del usuario logueado. El frontend nunca decide autorización — solo refleja lo que el backend permite.
- **Nunca loguear en consola** tokens, headers de contexto ni payloads de sesión, ni en desarrollo ni en producción (evitar `console.log` de objetos de request/response completos).

## 4. Documentación y Pruebas

- **Documentación por componente compartido:** Todo componente en `src/components/` debe incluir un comentario JSDoc breve arriba de su definición: propósito, props principales y ejemplo de uso mínimo. Componentes de feature (`features/*/components/`) no requieren este nivel, salvo lógica no trivial.
- **Cobertura mínima de pruebas (Vitest + React Testing Library):**
  - Toda función de `lib/`/`utils/` con lógica no trivial (formateo MXN, cálculos de preview de carrito) requiere test unitario.
  - Todo formulario crítico (login, venta, ajuste de inventario) requiere al menos un test de validación (caso inválido) y uno de envío exitoso (mock de mutation).
  - Los hooks de feature (`useProductos`, `useCrearVenta`, etc.) se prueban con mocks de `services/`, nunca contra la API real.
- **Storybook / catálogo visual:** No es obligatorio en esta fase; si se introduce más adelante, debe documentarse aquí antes de usarse.
- **Comentarios requeridos en hooks de mutación complejos:** Todo hook que orqueste una mutation con efectos secundarios (invalidaciones múltiples, actualización optimista) debe documentar en un comentario: 1) qué dispara, 2) qué queries invalida, 3) qué gestiona en `onError`.

## 5. Gestión de Moneda (MXN)

- **Prohibido `Number`/`Float` para cualquier cálculo monetario**, incluso en previews de UI (subtotal de carrito antes de enviar la venta). Usar **`decimal.js`** igual que el backend: `new Decimal(String(valor))`.
- **Formateo de visualización:** Todo monto mostrado en UI pasa por un único helper `formatMXN()` en `src/lib/`, que usa `Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })`. Prohibido concatenar `$` manualmente o usar `toFixed(2)` suelto en componentes.
- **Previews de cliente son solo UX, no autoridad:** Cualquier total/subtotal calculado en el frontend (ej. mientras se arma una venta) es una _estimación visual_. El monto final y autoritativo siempre viene de la respuesta del backend tras confirmar la operación; el frontend nunca asume que su cálculo local es el definitivo.

## 6. Constantes y Tipos de Dominio

- **Cero magic strings en componentes, hooks o services:** Roles, estados de orden, códigos de error esperados del backend, rutas de navegación y `queryKey` bases viven en `src/constants/`. Nunca inline (`if (rol === 'admin')` está prohibido; usar `ROLES.ADMIN`).
- **Tipos de dominio compartidos con el backend:** Los tipos de entidades (`Producto`, `Orden`, `Cliente`, etc.) se definen en `src/interfaces/` reflejando el contrato real de la API — idealmente derivados o sincronizados manualmente desde los DTOs/schemas de respuesta del backend, nunca inventados ad hoc por componente.
- **Sin tipos duplicados:** Si dos features necesitan el mismo tipo de entidad, se importa desde `src/interfaces/`, nunca se redefine localmente dentro de la feature.

## 7. Proceso de Trabajo

- Antes de escribir un componente o flujo complejo (ej. wizard de venta, integración de reportes), Claude debe proponer brevemente el flujo lógico y qué queries/mutations/stores involucra.
- Al generar código, Claude debe explicar qué dependencias nuevas está sugiriendo instalar (`npm install`).
- Ante cualquier discrepancia entre lo que expone la API real y lo documentado en el Spec del backend, Claude debe señalarla antes de continuar la implementación.

## 8. Anexo de Gobernanza

### SECCIÓN: PROTOCOLO DE DESARROLLO BASADO EN SPECS

#### 1. Flujo de Trabajo Obligatorio

Antes de generar cualquier código funcional de una feature nueva o pantalla compleja, Claude debe seguir este ciclo:

1. **Propuesta de Spec:** Claude genera un archivo basado en `_TEMPLATE.spec` en `src/docs/specs/`, describiendo pantallas involucradas, estados de UI (loading/error/empty), queries/mutations requeridas y componentes nuevos a crear.
2. **Revisión Humana:** El usuario aprueba, corrige o solicita cambios en la Spec.
3. **Implementación:** Una vez aprobada, Claude procede a escribir el código (componentes, hooks, stores, servicios) siguiendo estrictamente lo documentado.

#### 2. Estándares de Documentación

- **Ubicación:** Todas las especificaciones viven en `src/docs/specs/` con nomenclatura `SPEC-01_login.md`, `SPEC-02_catalogo-productos.md`, etc.
- **Sincronización:** Si durante la codificación surge un cambio técnico imprevisto (ej. la API no retorna un campo esperado), Claude debe comunicar la interferencia y actualizar primero el archivo de Spec antes de continuar con el código.

#### 3. Rigor Técnico en Specs

- **Estados de UI:** Toda Spec de pantalla que consuma datos remotos debe especificar explícitamente el diseño de sus estados `loading`, `error` y `empty`.
- **Zod:** Las Specs de formularios deben definir el esquema de validación (campos, reglas, mensajes) antes de implementarlo.
- **Contratos de API asumidos:** Toda Spec que consuma un endpoint debe listar el/los endpoints exactos que usará (método + ruta) y el shape de `data` esperado, referenciando el Swagger del backend cuando exista.

#### 4. Registro de Sesiones de Trabajo

Al finalizar cada sesión de trabajo, Claude **debe** crear un documento de resumen en `/sesiones/` siguiendo la estructura definida en `SESSION_TEMPLATE.md`.

**Reglas:**

- **Nomenclatura:** `<tarea-descripción>-<YYYY-MM-DD>.md`. Ejemplo: `feature-catalogo-productos-2026-05-10.md`.
- **Contenido mínimo:** objetivo de la sesión, decisiones tomadas, archivos creados/modificados, SPECs involucrados, supuestos declarados, pendientes para la próxima sesión y riesgos identificados.
- **Referencia:** el template vive en `/sesiones/SESSION_TEMPLATE.md` (compartido con el backend si el repo es monorepo, o replicado si es repo separado).

**Propósito:** mantener trazabilidad del trabajo realizado entre sesiones, facilitar el contexto al retomar el proyecto y documentar decisiones de diseño de UI que no quedan explícitas en el código.
