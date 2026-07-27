import type { EstadoUsuario } from '@/core/api'

import type { Tono } from './EstadoBadge'

/**
 * Mapa de dominio: estado de usuario → tono del badge. Es DATO, no lógica del
 * componente. Cada entidad de EPIC 3+ define su propio mapa sin tocar `EstadoBadge`.
 *
 *  - ACTIVO → success (verde).
 *  - INVITADO → info (azul).
 *  - DESACTIVADO → neutral (gris). NO danger: desactivar es una acción legítima, no un
 *    error; el rojo implicaría que algo salió mal.
 */
const TONO_POR_ESTADO_USUARIO: Record<EstadoUsuario, Tono> = {
  ACTIVO: 'success',
  INVITADO: 'info',
  DESACTIVADO: 'neutral',
}

/** Devuelve el tono del badge para un estado de usuario. */
export function tonoDeEstadoUsuario(estado: EstadoUsuario): Tono {
  return TONO_POR_ESTADO_USUARIO[estado]
}
