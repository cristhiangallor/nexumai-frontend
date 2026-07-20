# Stack tecnológico — constitución del frontend
Fuente de verdad: ADR-008 (pageId 46432258). Si algo aquí diverge, gana la página.

## Propósito
Fijar qué tecnologías se usan y, sobre todo, cuáles NO, para que el agente no
introduzca dependencias alternativas "porque sí". Las versiones son de referencia
(jul-2026) y se RECONFIRMAN contra doc oficial al fijar package.json: no fijar
patches de memoria.

## Decisiones (usar esto)
- Framework + build: React + Vite, modo SPA. Vite 8.x (bundler Rolldown; requiere
  Node 20.19+/22.12+). La app compila a ESTÁTICOS: no hay runtime Node en producción.
- Lenguaje: TypeScript 6.x. Elección conservadora deliberada (ver "Decisiones
  conscientes").
- Estado de servidor (datos de API): TanStack Query (React Query v5).
- Estado de UI local: React nativo (hooks). Store global solo si se justifica.
- UI: shadcn/ui sobre Base UI + Tailwind CSS. shadcn se COPIA al repo (no es
  dependencia versionada): el equipo posee y mantiene ese código.
- Router: React Router v7, modo SPA.
- Testing: Vitest + Testing Library; E2E selectivo.
- Tipos desde OpenAPI: openapi-typescript (solo tipos, zero-runtime).

## NO usar (y por qué)
- NO Next.js: su ventaja (SSR/SSG/SEO) no aplica a una app interna tras login y
  añade un runtime Node junto al backend Java.
- NO Vue/Angular/Svelte: el equipo tiene experiencia React.
- NO Radix como capa de primitivas: perdió mantenimiento tras la adquisición por
  WorkOS. Se usa Base UI (equipo de MUI, activamente mantenida).
- NO librería con estilo propio (MUI, Ant): se quiere control fino del diseño para
  dos superficies con sistema propio; riesgo de "se ve como la librería".
- NO store global pesado (Redux) de entrada: la mayoría del estado es de servidor
  y lo cubre TanStack Query. Complejidad prematura.
- NO fijar TypeScript 7.0 todavía: salió el 2026-07-08, es muy reciente; se migra
  más adelante cuando madure. Reevaluar en su momento.

## Decisiones conscientes (no "corregir" sin ADR)
- TS 6.x en vez de 7.0, y Base UI en vez de Radix, son elecciones deliberadas de
  estabilidad, no descuidos. Cambiarlas requiere una decisión registrada, no un
  ajuste silencioso del agente.

## Verificar al hacer scaffold
Comando de creación de Vite y plantilla React+TS; compatibilidad de plugins con
Rolldown; versiones exactas de cada paquete. Ver guía de scaffold (pageId 46727180).

## Abierto (no inventar)
Gestor de paquetes (npm/pnpm), herramienta E2E, gestor de formularios, umbral de
cobertura. Mientras no se decidan, no asumir uno.