import { useSyncExternalStore } from 'react'

import type { PerfilResponse } from '@/core/api'

import { getPerfil, subscribe } from './session'

/**
 * Lee el perfil de la sesión de forma REACTIVA (patrón observable de F-003): se suscribe
 * a `core/session` con `useSyncExternalStore`, así los componentes se re-renderizan si la
 * sesión cambia (login/logout) SIN recargar. Devuelve el `PerfilResponse` completo, o
 * `null` si aún no se cargó `GET /me`.
 *
 * El snapshot es la referencia del perfil (solo cambia al mutar la sesión), estable, sin
 * bucles de render. Es la vía para LEER el perfil desde la UI; ningún componente lee
 * `getPerfil()` por su cuenta cuando necesita reaccionar a cambios.
 */
export function usePerfil(): PerfilResponse | null {
  return useSyncExternalStore(subscribe, getPerfil)
}
