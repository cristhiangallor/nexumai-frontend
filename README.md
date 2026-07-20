# Nexum Compliance — Frontend

App web cliente (consola RRHH + portal del colaborador). Backend separado.

## Requisitos de entorno

- Node.js 20.19+ o 22.12+ (mínimo exigido por Vite 8; entorno de referencia:
  Node v24.13.1)
- Gestor de paquetes: **npm** (11.8.0 de referencia; hay `package-lock.json`)

## Cómo correr

```bash
npm install          # instalar dependencias
npm run dev          # servidor de desarrollo (Vite, http://localhost:5173)
npm run build        # type-check (tsc -b) + build de producción a dist/
npm run preview      # sirve el build de producción localmente

npm run lint         # ESLint (flat config)
npm run format       # Prettier — formatea en sitio
npm run format:check # Prettier — solo verifica, no escribe

npm run test         # Vitest, una pasada (CI)
npm run test:watch   # Vitest en modo watch
```

## Estructura y metodología

- Estructura por dominio (ver constitution/architecture.md)
- SDD: specs por feature en specs/F-NNN/ (ver AGENTS.md y ADR-009)
