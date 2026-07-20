# Nexum Compliance — Frontend (AGENTS.md)

Repositorio del **frontend** de Nexum Compliance: app web cliente con dos
superficies (consola de administración/RRHH y portal del colaborador).
El backend es un proyecto separado y es el **único punto de enforcement**.

## Regla de oro

Todo output de IA es **borrador** hasta revisión humana. Ningún código,
componente o flujo entra al producto sin que un responsable lo revise.

## Metodología: SDD (ADR-009)

La **especificación —no el código— es la fuente de verdad**. Flujo por feature:
spec.md → plan.md → tasks.md → contracts/. Cada spec referencia su épica (1–12)
y el pageId de Confluence de origen. Versión ligera: sin pipeline de agentes aún.

## Reglas duras (las inviolables se refuerzan con hooks, ver .claude/)

- Nunca exponer secretos, token o PII (INE, CURP, RFC, NSS, salario) en logs,
  consola, URLs ni almacenamiento persistente innecesario.
- El frontend NUNCA implementa seguridad real: toda validación en UI es de
  experiencia. Autorización, filtrado por tenant y acceso a documentos = backend.
- Ningún fetch fuera del cliente HTTP central (inyecta Authorization: Bearer).
- Gating de UI por **permiso/alcance**, nunca por nombre de rol.
- Lenguaje ubicuo: identificadores técnicos en inglés; términos de dominio legal
  mexicano en español canónico (expediente, colaborador, razón social, CURP…).
  UI en es-MX. Comentarios y documentación en español.

## constitution/ (leer bajo demanda, no todo siempre)

- architecture.md — organización de la app (fuente: NEX-41)
- conventions.md — convenciones de código UI + lenguaje ubicuo (NEX-42)
- stack.md — stack y versiones de referencia (ADR-008)
- testing.md — estrategia de pruebas (NEX-42)
- security.md — seguridad del cliente: token, anti-XSS, PII (ADR-007)
- permissions.md — gating de UI y matriz de permisos (NEX-9)

## Puente Confluence ↔ repo

Confluence = estrategia/PO e índice de ADRs. Repo = spec ejecutable.
Enlaces cruzados por pageId; no duplicar la fuente de verdad.

## Control de versiones

Repositorio propio del frontend (separado del backend), creado por NEX-14.
Rama principal `main`. Se protegerá tras el primer push para no aceptar commits
directos: toda integración entra por Pull Request con revisión humana (NEX-14).
