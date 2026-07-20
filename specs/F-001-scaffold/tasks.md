# F-001 — tasks (lista incremental)

Orden por bloques, con detención para revisión humana tras cada uno. TDD donde
aplique (la prueba de humo define "verde"). Marca cada casilla al cerrarla.

- [x] (a) Crear proyecto Vite + TS por el método de subcarpeta temporal; que
      arranque (`npm run dev`) y compile. Verificar comando/plantilla en doc
      oficial. **Plantilla real: `react-ts` + `@vitejs/plugin-react` (Oxc)**,
      no `react-swc-ts` — ver nota N-1.
- [ ] Git — resolver la discrepancia: init/clonar, conectar remoto, corregir la
      línea de AGENTS.md, primer commit (Conventional Commits) con rama principal
      protegida.
- [x] (b) Integrar Tailwind CSS (guía oficial vigente para Vite).
      **Tailwind 4.3.3 vía `@tailwindcss/vite`** (no PostCSS) — ver nota N-3.
- [ ] (c) Inicializar shadcn/ui sobre Base UI (flujo init vigente; confirmar soporte
      de Base UI).
- [ ] (d) Montar React Router v7 (SPA) con esqueleto de rutas para console/ y portal/.
- [ ] (e) Crear estructura de carpetas src/ (core / features / console / portal).
- [ ] (f) Configurar ESLint (flat) + Prettier, incluido el método vigente de orden
      de clases de Tailwind (el agente indica cuál usa). En verde.
- [ ] (g) Configurar Vitest + Testing Library con una prueba de humo que pasa.
- [ ] Cierre — verificación final (arranca, compila, lint/formato verde, prueba
      pasa); marcar los diez criterios de NEX-16; revisión humana; transicionar
      NEX-16 a Finalizada y actualizar la página de secuencia.

---

## Notas de ejecución — pendientes de reflejar en Confluence

Hallazgos surgidos al ejecutar el scaffold que **corrigen decisiones previas**.
Pendiente que el responsable humano los traslade a Confluence y a `plan.md`.

### N-1 — Corrección de la sub-decisión de plantilla (bloque a)

`plan.md` de F-001 registra `react-swc-ts` como plantilla elegida. **Esa lista de
plantillas está desactualizada**: `react-swc-ts` fue eliminada de `create-vite`
y ya no existe en la versión vigente (`create-vite@9.1.1`, verificado con
`--help`). Las plantillas React disponibles hoy son `react-ts` / `react` y
`react-compiler-ts` / `react-compiler`.

**Resultado real ejecutado:** `react-ts` + `@vitejs/plugin-react` v6.0.3.

Además, la premisa que motivaba SWC ya no se sostiene en Vite 8: desde
`@vitejs/plugin-react` v5.0.0 el transform de React Refresh lo hace **Oxc**
(no Babel), y la doc oficial recomienda explícitamente migrar de
`@vitejs/plugin-react-swc` a `@vitejs/plugin-react` cuando no se usan plugins
SWC ni opciones SWC personalizadas — que es nuestro caso. El propio plugin SWC
emite ese aviso en tiempo de arranque. Medición local: build 199 ms con SWC
frente a 126 ms con `plugin-react`/Oxc.

Se probó primero SWC (según lo acordado) y luego se hizo el swap con
aprobación humana. Sin Babel en el árbol de dependencias.

Fuentes: `create-vite@9.1.1 --help`; doc oficial Vite sobre Rolldown/Oxc;
`peerDependencies` del registro npm.

### N-2 — Linter: Oxlint por defecto, seguimos con ESLint

`create-vite@9` cambió el linter por defecto a **Oxlint**; ESLint pasó a ser
opt-in mediante la bandera `--eslint` (`--eslint / --no-eslint  use ESLint
instead of Oxlint (only for React templates)`).

**Decisión mantenida:** seguimos con **ESLint flat config + Prettier** por la
decisión de **NEX-42**, que descarta Biome/Oxlint. El scaffold se generó con
`--eslint` para evitar introducir Oxlint y tener que retirarlo después.

Config generada: `eslint.config.js` (flat) con `typescript-eslint`,
`eslint-plugin-react-hooks` y `eslint-plugin-react-refresh`. Prettier y el
método de orden de clases de Tailwind se definen en el bloque (f).

### N-3 — Tailwind v4 es CSS-first: no hay `tailwind.config.js`

Tailwind **4.3.3** se integró con el plugin oficial **`@tailwindcss/vite`**
(no PostCSS), según la guía oficial para Vite. La ruta PostCSS
(`@tailwindcss/postcss`) existe solo para toolchains que no pueden usar plugins
de Vite; no es nuestro caso.

**Implicación de arquitectura (afecta NEX-41):** Tailwind v4 abandonó el archivo
de configuración JavaScript. **No se genera `tailwind.config.js`** ni se ejecuta
`npx tailwindcss init`. La configuración del tema —colores, tipografía,
espaciado, breakpoints— se declara **en CSS** con la directiva `@theme`, y la
hoja se activa con un único `@import "tailwindcss";`.

Por tanto, los **tokens de diseño compartidos entre `console/` y `portal/`
(NEX-41) deberán definirse en CSS con `@theme`, no en un objeto de configuración
JS**. Cualquier documentación o diagrama de NEX-41 que asuma un
`tailwind.config.js` con `theme.extend` debe corregirse. Los tokens quedan como
custom properties CSS nativas, consumibles tanto por utilidades Tailwind como
por CSS plano — relevante para el sistema de diseño en `src/core/`.

Fuente oficial: guía de instalación de Tailwind CSS para Vite
(https://tailwindcss.com/docs/installation/using-vite), v4.3.

Verificación realizada: se añadió temporalmente la utilidad arbitraria
`rotate-[7deg]` a un TSX; el CSS compilado contenía `.rotate-\[7deg\]{rotate:7deg}`,
lo que prueba que el escaneo de clases en archivos `.tsx` funciona. Como control,
una clase inventada no generó regla. La sonda se revirtió y se confirmó su
ausencia del CSS final.

### N-4 — BANDERA para el bloque (c): shadcn/ui + Base UI + Tailwind v4

**No ejecutar sin verificación previa explícita.** Es la combinación de mayor
incertidumbre del scaffold. Antes de inicializar shadcn/ui hay que confirmar
contra su documentación vigente, de forma explícita:

1. Que **shadcn/ui soporta Tailwind v4 en modo CSS-first** (sin
   `tailwind.config.js`).
2. Que **shadcn/ui soporta Base UI** como capa de primitivas, no únicamente
   Radix. Recordatorio: `constitution/stack.md` descarta Radix por pérdida de
   mantenimiento tras la adquisición por WorkOS, y fija Base UI (equipo de MUI).

Si **cualquiera de las dos** no está soportada de forma estable a día de hoy:
**DETENERSE y reportarlo al responsable humano antes de instalar nada**. No se
debe buscar un workaround por cuenta propia (parches, forks, adaptadores
manuales o degradar a Radix): sería un cambio de decisión de stack y requiere
decisión registrada, no un ajuste silencioso.

**RESUELTA (jul-2026):** ambas condiciones se cumplen de forma estable.
Ver N-5 (Base UI) y N-3 (Tailwind v4). Se levanta la bandera; el bloque (c)
puede proceder.

### N-5 — Base UI es el default de shadcn/ui: valida ADR-008

**Ambas condiciones de N-4 verificadas y cumplidas.**

**Condición 2 (Base UI) — cumplida y superada.** Desde **julio de 2026**,
Base UI no solo está soportada: **es la librería por defecto de shadcn/ui**.
Cita textual del changelog oficial: *"Starting today, Base UI is the default
component library in shadcn/ui."* Sobre estabilidad: *"Base UI is stable. It's
at 1.6.0 with 6M+ weekly downloads."* — no es experimental ni "en progreso".

Radix **no** queda deprecado: *"Radix is not being deprecated. We still support
it, and every update and new component will ship for both libraries."*

**Esto valida la decisión de ADR-008 / `constitution/stack.md`** de elegir Base
UI sobre Radix por la pérdida de mantenimiento de Radix tras la adquisición por
WorkOS. shadcn llegó a la misma conclusión de forma independiente: el proyecto
no está nadando contracorriente, sino en la ruta por defecto del proveedor.
Cronología: doc de Base UI (ene-2026) → soporte oficial (feb-2026) → default
(jul-2026). Nota lateral: React Aria es también una base de primera clase desde
jul-2026, por si alguna vez se reevalúa.

Selección vía CLI: flag `-b, --base <base>`, valores `base` | `radix` | `aria`.
Se usará `-b base` de forma **explícita** aunque sea el default, para que la
elección quede reproducible y auditable en el repo.

**Condición 1 (Tailwind v4 CSS-first) — cumplida.** Ver N-3. Confirmación
decisiva en la doc de `components.json`: sobre el campo `tailwind.config`,
*"For Tailwind CSS v4, leave this blank."*

Fuente: changelog oficial shadcn/ui, "Base UI as the Default", julio 2026
(https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default); doc de CLI y de
`components.json` de ui.shadcn.com.

### N-6 — Desviación necesaria: `baseUrl` está deprecado en TypeScript 6

La documentación de shadcn/ui indica añadir **`baseUrl` + `paths`** al tsconfig
para el alias `@/*`. **Esa instrucción rompe el build en nuestro TypeScript 6.x**
(fijado por `stack.md`), con error duro:

```
error TS5101: Option 'baseUrl' is deprecated and will stop functioning in
TypeScript 7.0. Specify compilerOption '"ignoreDeprecations": "6.0"' to
silence this error.
```

**Resolución aplicada:** se configuró **solo `paths`, sin `baseUrl`**. Desde
TypeScript 4.x `paths` funciona sin `baseUrl` (se resuelve relativo al archivo
tsconfig que lo declara), así que el alias queda igual de funcional.

Se descartó deliberadamente la alternativa `"ignoreDeprecations": "6.0"`:
solo silencia el aviso y deja deuda que estallaría en la migración a TS 7 que
`stack.md` contempla para más adelante. Quitar `baseUrl` es la opción
compatible hacia adelante.

**Implicación:** la doc de shadcn está escrita para versiones anteriores de
TypeScript. Al seguir sus guías conviene revisar las opciones de tsconfig que
proponga, en vez de copiarlas literalmente.

Verificación: sonda temporal importando un módulo vía `@/…`, comprobando que el
valor llegaba al bundle compilado — esto ejercita la resolución tanto de
TypeScript (`tsc -b`) como del bundler (Vite). Sonda revertida y confirmada
ausente del bundle final.