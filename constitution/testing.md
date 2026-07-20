# Estrategia de pruebas — constitución del frontend

Fuente de verdad: NEX-42 (pageId 46530561). Si algo aquí diverge, gana la página.

## Filosofía

Probar COMPORTAMIENTO, no implementación. Se prueba qué ve y qué puede hacer el
usuario, no los detalles internos del componente. Herramienta: Vitest + Testing
Library (alineado con Vite).

## Mínimo por historia

- Piezas con lógica LLEVAN pruebas: hooks de datos, gating de permisos, utilidades,
  validaciones de experiencia.
- Componentes: se prueban por comportamiento observable, incluyendo los estados de
  UI de primera clase: carga, vacío, error y SIN PERMISOS.
- Un componente puramente presentacional trivial no necesita prueba dedicada; su
  comportamiento se cubre donde se usa.

## E2E selectivo

Solo flujos críticos, no todo: login, gating (que un usuario sin permiso no ve la
acción), y un flujo de expediente. Herramienta E2E aún no decidida: no asumir una.

## Cobertura

Umbral de cobertura ABIERTO. Cuando se fije, será un objetivo realista para equipo
mínimo; la cobertura no es un fin en sí misma. No perseguir un número inventado.

## Relación con "hecho"

Las pruebas relevantes y la accesibilidad (jsx-a11y) son parte de la definición de
terminado (ver conventions.md y el checklist de PR en NEX-42). No son fase posterior.
