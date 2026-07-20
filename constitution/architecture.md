# Arquitectura de la app cliente — constitución del frontend

Fuente de verdad: NEX-41 (pageId 46333985). Si algo aquí diverge, gana la página.

## Propósito y límite inviolable

Define cómo se organiza la SPA y cómo fluyen los datos. Regla que nunca se rompe:
el frontend NUNCA es responsable del enforcement. Toda validación en cliente es de
experiencia (feedback temprano). Autorización, filtrado por tenant y acceso a
documentos los garantiza el backend, fresco por request (ADR-006).

## Estructura por dominio (no por tipo de archivo)

- Núcleo compartido (core/ o shared/): cliente HTTP, sesión/auth, sistema de
  diseño, tipos generados desde OpenAPI, hooks transversales.
- Módulos de dominio (features/): uno por área (expediente, colaboradores,
  solicitudes, usuarios…), cada uno con sus componentes, hooks de datos y rutas.
- Dos superficies (console/, portal/): cada una con su árbol de rutas y layouts;
  componen núcleo + features.
- Nombres en lenguaje ubicuo (ver conventions.md).
- Motivo: el producto crece por módulos de dominio; agrupar por dominio mantiene
  juntas las piezas que cambian juntas.

## Capa de consumo de API — TRES niveles, de abajo hacia arriba

1. Cliente HTTP central (UNO solo): punto único que inyecta `Authorization: Bearer`
   (ADR-007), fija la base URL por entorno y centraliza errores y detección de 401.
2. Tipos generados desde OpenAPI con openapi-typescript. Dependen del contrato
   (NEX-12, backend); mientras no exista, se usan tipos/mocks provisionales
   acordados. NO inventar la forma de las respuestas.
3. Hooks de datos con TanStack Query, escritos a mano sobre (1) y (2). Nombres
   descriptivos (p. ej. algo como useExpediente); la firma se fija en implementación.

REGLA DURA: ningún componente hace fetch por su cuenta saltándose el cliente
central. Si ves un `fetch(...)` directo en un componente, está mal.

## Sesión y autenticación en el cliente

- Token en almacenamiento del navegador (persiste entre recargas, ADR-007),
  encapsulado en UN módulo de sesión. Ningún componente lee el almacenamiento
  directamente.
- Expiración 8h / renovación Modelo A (ADR-006). El detalle del flujo de renovación
  depende del contrato (NEX-12): comportamiento a confirmar, no inventado.
- Respuesta a 401: el cliente HTTP limpia la sesión local y redirige a login. Esto
  cubre token expirado/invalidado y también cambio de rol o cierre de sesión que el
  backend resuelve fresco por request: si el backend deja de autorizar, la UI
  reacciona al 401.
- Cierre de sesión: invalida la sesión en backend (ADR-006) y limpia el token local.
- Rutas protegidas: un guard verifica sesión antes de renderizar. Es UX, no
  seguridad: el backend siempre revalida.

## Dos superficies

- Routing y layouts propios por superficie (React Router v7). Consola: densidad de
  información (tablas, captura). Portal: simplicidad, mobile-first, autoservicio.
- Sistema de diseño compartido (mismos componentes base y tokens CSS); lo que
  cambia por superficie es composición y layout, no el acceso a datos.
- Responsive: el portal debe funcionar bien en móvil vía navegador (no hay app
  nativa en el MVP). La consola es de escritorio pero no debe romperse en pantallas
  menores.

## Anti-XSS (detalle en security.md)

El token es accesible a JS (ADR-007), así que el rigor anti-XSS es obligatorio:
no renderizar HTML sin sanitizar, no volcar token/PII en logs/URLs, documentos
sensibles solo por mecanismos del backend.

## Frontera con otros archivos

- Gating de permisos: el mecanismo vive en permissions.md (NEX-9). Esta arquitectura
  solo dice DÓNDE viven los permisos (estado de sesión) y que se consultan de forma
  transversal.
- Seguridad del cliente: detalle en security.md (ADR-007).

## Dependencia bloqueante

NEX-12 (contrato de API, backend) bloquea los tipos reales y el detalle de auth.
Se puede avanzar estructura, sistema de diseño, routing y sesión contra mocks.
