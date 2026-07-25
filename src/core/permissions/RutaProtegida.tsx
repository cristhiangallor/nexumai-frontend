import type { ReactNode } from 'react'

import { AccesoDenegado } from './AccesoDenegado'
import { usePermiso } from './usePermiso'

interface RutaProtegidaProps {
  /** Clave `modulo.accion` requerida para entrar a la ruta. */
  clave: string
  children: ReactNode
}

/**
 * Guard de ruta (decisión de UX 1 de F-003): protege una ruta exigiendo `clave`. Si
 * el usuario NO la tiene, renderiza {@link AccesoDenegado} — NO redirige (mensaje
 * explícito, vale igual para navegación interna y para URL directa). Se apoya en
 * {@link usePermiso}; no reimplementa la verificación.
 *
 * Es EXPERIENCIA, no seguridad: el backend es el único enforcement (ADR-006). Como
 * `usePermiso` es reactivo, si la sesión cambia (p. ej. 401 → limpia sesión), el
 * guard se re-evalúa y muestra acceso denegado sin recargar.
 */
export function RutaProtegida({ clave, children }: RutaProtegidaProps) {
  return usePermiso(clave) ? <>{children}</> : <AccesoDenegado />
}
