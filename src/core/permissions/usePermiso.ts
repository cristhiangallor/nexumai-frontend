import { useSyncExternalStore } from 'react'

import { getPerfil, subscribe } from '@/core/session'

/**
 * Consulta central de permisos (NEX-9 §3): dada una clave `modulo.accion` (p. ej.
 * `usuario.ver`), responde si el usuario la tiene, leyendo `permisos[]` del estado
 * de sesión (`core/session`, poblado por login en F-002). Es la ÚNICA vía para
 * preguntar por permisos: ningún componente reimplementa la lógica, pregunta por
 * nombre de rol, ni infiere el alcance (el alcance vive DENTRO de la clave:
 * `expediente.ver_propio` vs `expediente.ver_todos`; aquí solo se compara la clave).
 *
 * Gating de EXPERIENCIA, no seguridad: el backend es el único enforcement, fresco
 * por request (ADR-006). Si el backend responde 403, la UI lo acata igual.
 *
 * REACTIVO: se suscribe a `core/session` con `useSyncExternalStore`, de modo que los
 * componentes que lo usan se re-evalúan cuando la sesión cambia (reautenticación,
 * cierre de sesión) SIN recargar. El snapshot es un booleano (comparado por valor,
 * estable mientras no cambie), así que no hay re-render en bucle.
 */
export function usePermiso(clave: string): boolean {
  return useSyncExternalStore(
    subscribe,
    () => getPerfil()?.permisos.includes(clave) ?? false,
  )
}
