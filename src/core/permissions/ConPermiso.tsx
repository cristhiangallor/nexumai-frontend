import type { ReactNode } from 'react'

import { usePermiso } from './usePermiso'

interface ConPermisoProps {
  /** Clave `modulo.accion` requerida para mostrar el contenido. */
  clave: string
  children: ReactNode
}

/**
 * Envoltura declarativa de gating (NEX-9 §3): renderiza sus hijos solo si el
 * usuario tiene el permiso `clave`. OCULTA POR DEFECTO (renderiza `null`) cuando no
 * lo tiene — no deshabilita (NEX-9 §4). Patrón por defecto para botones, ítems de
 * menú y secciones. Se apoya en {@link usePermiso}; no reimplementa la verificación.
 */
export function ConPermiso({ clave, children }: ConPermisoProps) {
  return usePermiso(clave) ? <>{children}</> : null
}
