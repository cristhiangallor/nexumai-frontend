# Specs por feature (SDD — ADR-009)

Cada feature de frontend vive en specs/F-NNN-nombre-feature/ con el flujo:

- spec.md — qué y por qué (sin tecnología) + épica (1–12) + pageId de Confluence
- plan.md — cómo: componentes, capa de API, estado, superficie (console/portal)
- tasks.md — lista incremental con TDD
- contracts/ — contrato de API CONSUMIDO (copia/ref del OpenAPI del backend)

Al cerrar una feature, su carpeta se mueve a specs/_archivadas/F-NNN-nombre/ (git mv,
para preservar historial). No se borra.

Regla: la spec —no el código— es la fuente de verdad. Todo output de IA es borrador
hasta revisión humana.
