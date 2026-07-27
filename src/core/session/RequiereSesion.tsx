import { useSyncExternalStore, type ReactNode } from 'react'
import { Navigate } from 'react-router'

import { getSlug, getToken, subscribe } from './session'

interface RequiereSesionProps {
  children: ReactNode
}

/**
 * Guard de SESIÓN (NEX-61). Distinto del guard de PERMISO (`RutaProtegida`, F-003):
 * aquí solo se exige estar autenticado. Un usuario con sesión pero sin un permiso
 * concreto SÍ tiene derecho a entrar a la consola, así que NO se reutiliza
 * `RutaProtegida` con una clave inventada. Ambos se complementan: una ruta puede
 * exigir sesión (este guard) Y además un permiso (`RutaProtegida`).
 *
 * Se aplica a nivel del AppShell, así que `/inicio`, `/perfil` y toda ruta futura
 * quedan cubiertas sin recordar nada por ruta.
 *
 * Reactivo con el mismo mecanismo observable de F-003 (`useSyncExternalStore` sobre
 * `core/session`): si la sesión se limpia (logout, 401), se re-evalúa y redirige.
 * Comprueba el TOKEN (persistido en localStorage), NO el perfil (en memoria), para
 * sobrevivir a la recarga (el token persiste; el perfil se re-obtiene de `/me`).
 *
 * FRAGILIDAD LATENTE (registrada): `emitChange` de `core/session` notifica en
 * `setPerfil` y `clearSession`, NO en `setToken` suelto. Hoy los flujos reales sí
 * notifican (login hace setToken+setPerfil; logout/401 hacen clearSession). Un flujo
 * futuro que haga `setToken` sin `setPerfil` NO refrescaría este guard.
 *
 * Sin sesión → `/:slug/login` conservando el slug (persistido por F-005); sin slug → `/`.
 */
export function RequiereSesion({ children }: RequiereSesionProps) {
  const haySesion = useSyncExternalStore(subscribe, () => getToken() !== null)

  if (!haySesion) {
    const slug = getSlug()
    return <Navigate to={slug ? `/${slug}/login` : '/'} replace />
  }

  return <>{children}</>
}
