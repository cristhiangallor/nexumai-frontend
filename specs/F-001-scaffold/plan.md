# F-001 — plan (cómo)

> Precisión: comandos, flags, plantillas y versiones se verifican contra doc
> oficial vigente al ejecutar; no se fijan de memoria. Abajo se marca lo que
> Claude Code ya verificó (2026-07-11) y lo que queda por confirmar en cada bloque.

## Hallazgos de entorno (verificados por Claude Code, 2026-07-11)
- Comando de creación: `npm create vite@latest` es el canónico vigente (vite.dev/guide).
- Node: Vite requiere Node 20.19+ / 22.12+. Entorno: Node v24.13.1, npm 11.8.0 → cumple.
- Plantillas React+TS disponibles hoy: react-ts (Babel), react-swc-ts (SWC),
  react-compiler-ts (React Compiler).
  [Verificado por Claude Code contra discusión oficial de vitejs/vite; NO revalidado
   de forma independiente. Para certeza total, contrastar con la doc.]
- Estado del repo: el directorio NO está inicializado con Git (no existe .git) y
  NO está vacío (ya contiene los archivos SDD pegados). Esto condiciona el método.

## Sub-decisiones de esta feature
1. Plantilla: react-swc-ts (SWC).
   Motivo: build/HMR más rápidos; el stack (Tailwind v4 por su plugin de Vite,
   shadcn/Base UI) no necesita Babel; deja abierta la opción de React Compiler sin
   rehacer el scaffold.
   Alternativa: react-ts (Babel) si se prevé herramienta que asuma ecosistema Babel.
   [PENDIENTE de confirmación explícita de Cristhian.]
2. Método sobre directorio no vacío: generar en subcarpeta temporal vacía → mover a
   la raíz los archivos generados → fusionar el .gitignore de Vite con el existente
   → conservar el README.md propio → borrar la temporal.
   Evita el prompt interactivo de create-vite y el clobbing de los archivos SDD.

## Discrepancia a resolver (Git) — bloquea el primer commit, no el scaffold
El repo REMOTO se creó (en el hosting), pero el LOCAL no está inicializado ni
conectado. Además, AGENTS.md afirma "ya inicializado con Git", lo cual en disco es
falso. Acciones: (1) git init local + añadir remoto, o clonar el remoto vacío y
trabajar dentro; (2) corregir esa línea de AGENTS.md.

## Enfoque técnico por capa (de NEX-41, sin inventar firmas)
Estructura src/:
- core/ (o shared/): cliente HTTP, sesión/auth, sistema de diseño, hooks
  transversales — solo esqueleto.
- features/: vacío.
- console/ y portal/: rutas + layouts propios.
Router React Router v7 en modo SPA. Sistema de diseño compartido (shadcn/Base UI +
Tailwind). Sin acceso a datos real todavía.