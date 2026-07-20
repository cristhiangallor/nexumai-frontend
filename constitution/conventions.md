# Convenciones de código UI — constitución del frontend
Fuente de verdad: NEX-42 (pageId 46530561) + Convenciones del proyecto (pageId 40927233).
Si algo aquí diverge, gana la página.

## Lenguaje ubicuo (un concepto = un término)
Usar SIEMPRE el mismo término en código y UI, sin sinónimos ni abreviaturas de
conveniencia:
- Dominio: expediente, colaborador/empleado, razón social, constancia,
  incapacidad/licencia, solicitud, recibo, saldo de vacaciones.
- Legales, tal cual: CURP, RFC, NSS, INE.
El agente NO renombra ni abrevia términos de dominio por conveniencia. Ante un
concepto nuevo, propone el término (no lo inventa en silencio).

## Idioma de identificadores
- Identificadores técnicos genéricos: inglés. Ej.: `createUser`, `isActive`, `onSubmit`.
- Términos de dominio legal mexicano: español canónico. Ej.: `expediente`,
  `razonSocial`, `curp`, `saldoVacaciones`.
- Comentarios y documentación en código: español.
- UI: es-MX.
Ejemplo mixto correcto: `function getExpedienteById(id)` — verbo técnico en inglés,
término de dominio en español.

## Separación de capas (coherente con architecture.md)
- Componentes de presentación vs. hooks de datos vs. cliente HTTP.
- Ningún componente hace fetch directo saltándose la capa de API.
- INCORRECTO: un componente que llama a `fetch('/api/...')` en un efecto.
  CORRECTO: el componente usa un hook de datos (TanStack Query) del módulo.

## Principios de estilo
- Claridad sobre brevedad.
- Consistencia sobre preferencia individual: se siguen las convenciones existentes
  del repo aunque uno haría algo distinto. Un patrón nuevo se PROPONE (ADR o aviso),
  no se impone.

## Linting y formato
- ESLint (flat config + TypeScript ESLint) + Prettier. Obligatorio y ejecutado en
  CI: un PR que no pasa lint/formato no se integra.
- Cobertura esperada del linter: TypeScript, React y hooks, accesibilidad (jsx-a11y),
  orden de imports, orden de clases de Tailwind. (Método exacto del orden de clases
  a confirmar al montar; ver guía de scaffold.)
- Elegido sobre Biome porque a jul-2026 Biome no ordena clases de Tailwind ni cubre
  bien jsx-a11y. No sustituir por Biome sin decisión registrada.