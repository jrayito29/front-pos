# Pendientes

Checklist de trabajo que quedó fuera de alcance de una implementación ya cerrada. Marcar con `[x]`
y anotar fecha/PR al resolverse; no borrar la entrada (sirve de historial).

## SPEC-007 — Autorización en Frontend (Permisos)

- [ ] **REQ-U6** — Ocultar en el menú de navegación de `AppLayout` cualquier entrada cuyo módulo no
      esté activo para el usuario (`tieneModuloActivo`). Bloqueado: `AppLayout` todavía no existe
      como feature/layout real (`layouts/AppLayout`, ver CLAUDE.md §5). Implementar cuando se
      construya el layout principal.
- [ ] **REQ-U5 (verificación end-to-end)** — El mecanismo de `RequirePermission` (`Navigate` en vez
      de `Outlet` corta el `lazy()` de la ruta hija) está probado con una ruta de prueba
      (`src/app/RequirePermission.test.tsx`), pero no contra una ruta de feature real. Verificar
      cuando la primera feature de dominio (ventas, inventario, etc.) se proteja con
      `RequirePermission` en `app/router.tsx`.

## Solicitud de acceso (RESPUESTA-006-cambio-permisos-productos.md)

- [ ] **Backend: endpoint real de solicitudes de acceso** — `components/SolicitarAccesoModal`
      (usado hoy en Productos: botones "Bloqueado" de Agregar/Editar/Eliminar cuando el rol no tiene
      el permiso, `components/LockedActionButton`) solo simula el envío con un toast de éxito — NO
      llama a ningún endpoint, porque no existe todavía. Falta que backend defina el contrato (ej.
      `POST /solicitudes-acceso { modulo, accion, mensaje? }`) y cómo se entrega la notificación al
      admin/superadmin del tenant que la recibe. Confirmado explícitamente con el usuario
      (2026-08-05): backend NO implementará esto en el corto plazo — queda documentado como
      bloqueante para conectar el modal a un endpoint real, no para removerlo del frontend.
- [ ] **Frontend: reemplazar el mock de `NotificationsDropdown`** — `layouts/AppLayout/
      NotificationsDropdown.tsx` (SPEC-008 REQ-O2) ya tiene el lugar reservado en el header para
      mostrar notificaciones reales; es el destino natural de las solicitudes de acceso una vez que
      exista el endpoint del punto anterior. Bloqueado por el mismo ítem.
