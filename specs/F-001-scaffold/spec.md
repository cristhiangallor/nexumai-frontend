# F-001 — Scaffold del proyecto base (frontend)

- Épica: 1 (Fase 0)
- Issue Jira: NEX-16
- Origen / guía operativa (Confluence pageId): 46727180
- Espejo de esta spec (Confluence pageId): 46727204
- Método SDD: ADR-009
- Estado: borrador (en ejecución)

> Nota de proceso (honesta): esta feature empezó a ejecutarse en Claude Code
> antes de escribir su spec — una desviación del flujo SDD que se corrige aquí.
> El scaffold es setup de bajo riesgo de deriva (decisiones ya cerradas en
> ADR-008/NEX-41), así que la ejecución en curso se trata como borrador (regla
> de oro de todos modos) y se formaliza la spec en paralelo.

## Qué
Crear el proyecto base navegable del frontend en su repositorio, materializando
el stack (ADR-008), la arquitectura (NEX-41) y el andamiaje SDD (ADR-009). Es el
esqueleto sobre el que se construirán las features de la EPIC 2.

NO incluye: lógica de negocio, cliente HTTP real, tipos OpenAPI ni hooks de datos
(dependen del contrato NEX-12).

## Por qué
Sin proyecto base no hay dónde desarrollar. Además es la primera pieza que ejercita
el andamiaje SDD y los estándares (NEX-42): sienta el precedente de cómo se trabaja
en el repo.

## Criterios de aceptación
Son los diez criterios de NEX-16 (detalle en la guía 46727180 §1):
- Repo con Git, rama principal protegida y primer commit (Conventional Commits).
- React + Vite (SPA) en TypeScript que arranca en local y compila a estáticos.
- Tailwind CSS integrado y shadcn/ui sobre Base UI inicializado.
- React Router v7 con esqueleto mínimo de las dos superficies (console/ y portal/).
- Estructura por dominio (núcleo compartido + features + dos superficies).
- ESLint (flat) + Prettier configurados y ejecutables; lint/formato en verde.
- Vitest + Testing Library con una prueba de humo que pasa.
- Andamiaje SDD presente: AGENTS.md, CLAUDE.md, constitution/, decisions/, specs/, .claude/.
- .gitignore cubre .env*, node_modules, artefactos de build y CLAUDE.local.md.
- README.md con requisitos de entorno y cómo correr.

## Fuera de alcance
Cliente HTTP real, tipos OpenAPI, hooks de datos, cualquier feature de producto,
pipeline de 7 agentes SDD (diferido). Nada de la lista de guardrails del MVP.

## Dependencias
Decisiones cerradas: ADR-008, NEX-41, NEX-42, NEX-9, NEX-14, ADR-009.
No depende de NEX-12 (el scaffold no consume API todavía).