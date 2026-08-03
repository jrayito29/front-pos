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
