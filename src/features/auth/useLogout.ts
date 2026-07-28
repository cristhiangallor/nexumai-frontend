import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'

import { ApiError, apiPost } from '@/core/http'
import { clearSession, getSlug } from '@/core/session'
import { RUTAS, rutaLogin } from '@/rutas'

/** Indicador que la pantalla de login lee de `location.state` para mostrar el aviso. */
export interface EstadoAvisoCierreSesion {
  avisoCierreSesion?: boolean
}

/**
 * Servicio de cierre de sesión (NEX-44). Cablea el ítem "Cerrar sesión" del menú de
 * usuario (F-004).
 *
 * Reglas (decididas, no reabrir):
 *  - La limpieza local (`clearSession`) es INCONDICIONAL: se ejecuta en todos los
 *    caminos (200, 401, red/5xx).
 *  - `200` → limpiar, redirigir, sin mensaje.
 *  - `401` → NO es error: significa que la sesión ya no existe en backend, que es el
 *    resultado buscado. Limpiar, redirigir, sin mensaje. La petición pasa
 *    `skipUnauthorizedHandler` (NEX-62) para que ese 401 NO dispare el handler global
 *    de sesión expirada (evita doble redirección y el aviso equivocado). El cliente
 *    HTTP igual limpia la sesión; volver a limpiar es idempotente.
 *  - red/timeout/5xx → limpiar, redirigir y emitir aviso NO bloqueante.
 *  - Sin reintento (tras salir no queda pantalla donde reintentar).
 *
 * El `slug` se captura ANTES de `clearSession` (que también lo borra); leerlo después
 * daría `undefined`. Sin slug (sesión anterior a este cambio o almacenamiento
 * manipulado) se redirige a `/` sin fallar.
 */
export function useLogout() {
  const navigate = useNavigate()
  const [cerrandoSesion, setCerrandoSesion] = useState(false)
  // Guarda síncrona contra doble disparo (el estado se actualiza de forma diferida).
  const enProceso = useRef(false)

  async function cerrarSesion() {
    if (enProceso.current) {
      return
    }
    enProceso.current = true
    setCerrandoSesion(true)

    // Capturar el slug ANTES de la petición: además de esta limpieza final,
    // en el camino 401 el propio core/http llama a clearSession DENTRO del `await`
    // (y clearSession borra el slug). La variable local lo conserva aunque el
    // almacenamiento se limpie a mitad de la petición; leerlo después daría null.
    const slug = getSlug()

    let huboFalloDeRed = false
    try {
      // `POST /logout` sin cuerpo; autenticado (el cliente HTTP inyecta el Bearer).
      // `skipUnauthorizedHandler`: un 401 aquí es el resultado buscado, no una sesión
      // expirada → no debe disparar el handler global (NEX-62).
      await apiPost('/logout', undefined, { skipUnauthorizedHandler: true })
    } catch (error) {
      // Un 401 es el resultado buscado (sesión ya invalidada): no se avisa. Cualquier
      // otro fallo (red/timeout/5xx) sí se avisa.
      if (!(error instanceof ApiError && error.status === 401)) {
        huboFalloDeRed = true
      }
    } finally {
      // Limpieza local incondicional, en todos los caminos.
      clearSession()
    }

    // Redirección conservando el slug; sin slug → `/` (sin fallar). Paths centralizados.
    const destino = slug ? rutaLogin(slug) : RUTAS.raiz
    navigate(destino, {
      replace: true,
      state: huboFalloDeRed
        ? ({ avisoCierreSesion: true } satisfies EstadoAvisoCierreSesion)
        : undefined,
    })
  }

  return { cerrarSesion, cerrandoSesion }
}
