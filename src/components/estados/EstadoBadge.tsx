import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/badge'

/** Tono semántico del pill. Genérico: no conoce los estados de ninguna entidad. */
export type Tono = 'success' | 'info' | 'warning' | 'danger' | 'neutral'

// Clases LITERALES completas por tono. NO se construyen con plantillas
// (`bg-${tono}-soft`): Tailwind no detecta clases dinámicas y las purgaría en el build
// (se verían sin estilo en producción aunque las pruebas pasaran). Ojo: 'neutral' NO
// sigue el patrón soft/text — usa `muted` (gris), no un `color-*-soft`.
const CLASES_POR_TONO: Record<Tono, string> = {
  success: 'bg-success-soft text-success-text',
  info: 'bg-info-soft text-info-text',
  warning: 'bg-warning-soft text-warning-text',
  danger: 'bg-danger-soft text-danger-text',
  neutral: 'bg-muted text-muted-foreground',
}

interface EstadoBadgeProps {
  /** Tono semántico. La entidad decide el mapeo estado→tono (ver `estadoUsuario.ts`). */
  tono: Tono
  children: ReactNode
}

/**
 * Pill de estado. Recibe un TONO semántico y aplica sus clases de superficie/texto
 * sobre el primitivo `Badge`. Es GENÉRICO: no conoce los estados de ninguna entidad;
 * el mapeo estado→tono vive como dato en un módulo aparte (p. ej. `estadoUsuario.ts`).
 */
export function EstadoBadge({ tono, children }: EstadoBadgeProps) {
  return <Badge className={CLASES_POR_TONO[tono]}>{children}</Badge>
}
