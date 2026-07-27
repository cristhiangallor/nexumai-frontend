// Módulo de sesión: ÚNICO punto que toca el almacenamiento del navegador para la
// sesión. Ningún componente lee `localStorage` directo (regla de architecture.md).
//
// Mecanismo de almacenamiento (ADR-007), verificado contra doc oficial:
//  - Token → `localStorage`. Debe persistir entre recargas durante la sesión de 8h;
//    `sessionStorage` se borra al cerrar la pestaña, lo que rompería esa sesión.
//    Que el token sea accesible a JS es el trade-off que ADR-007 aceptó a sabiendas
//    (a cambio de eliminar CSRF), con la condición de mitigar XSS de forma estricta.
//  - PerfilResponse → EN MEMORIA, no se persiste. `nombre`/`correo` son PII y
//    security.md prohíbe persistir PII en almacenamiento innecesario: el perfil se
//    re-obtiene de `GET /me` con el token persistido, así que no hace falta guardarlo
//    en disco. `permisos[]` (que consume NEX-51) vive aquí mientras dura la sesión.
//
// Reactividad (NEX-51 bloque 2): el módulo es OBSERVABLE vía `subscribe` (compatible
// con `useSyncExternalStore`). Es ADITIVO: la API síncrona existente no cambia —
// `core/http` sigue leyendo el token con `getToken()` de forma síncrona. Solo se
// notifica a los suscriptores cuando cambia el PERFIL (setPerfil/clearSession), que
// es lo que la UI observa para re-evaluar permisos.

import type { PerfilResponse } from '@/core/api/contracts'

/** Clave de `localStorage` del token. Prefijo de namespace para no colisionar. */
const TOKEN_KEY = 'nexum.token'

/**
 * Clave de `localStorage` del slug del tenant. Se persiste (como el token) para que el
 * cierre de sesión (NEX-44) pueda redirigir a `/{slug}/login` conservando el tenant.
 * NO es PII (es el identificador de tenant que ya viaja en la URL), así que persistirlo
 * es consistente con la política — a diferencia del perfil, que sí es PII y va en memoria.
 */
const SLUG_KEY = 'nexum.slug'

/** Estado de sesión en memoria (perfil). Se pierde al recargar; se re-obtiene de /me. */
let perfilEnMemoria: PerfilResponse | null = null

/** Suscriptores a cambios de sesión (perfil). */
const listeners = new Set<() => void>()

/**
 * Suscribe un listener a los cambios de sesión y devuelve la función para
 * desuscribir. Firma compatible con `useSyncExternalStore` (React).
 */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Notifica a los suscriptores que la sesión cambió. */
function emitChange(): void {
  for (const listener of listeners) {
    listener()
  }
}

/** Guarda el token de sesión. */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

/** Lee el token de sesión, o `null` si no hay sesión. */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

/** Guarda el slug del tenant de la sesión actual (lo puebla el login). */
export function setSlug(slug: string): void {
  localStorage.setItem(SLUG_KEY, slug)
}

/**
 * Lee el slug del tenant, o `null` si no hay (sesión anterior a NEX-44 o almacenamiento
 * manipulado). El consumidor decide el fallback (p. ej. redirigir a `/`).
 */
export function getSlug(): string | null {
  return localStorage.getItem(SLUG_KEY)
}

/** Guarda el perfil (`PerfilResponse` de `GET /me`) y notifica a los suscriptores. */
export function setPerfil(perfil: PerfilResponse): void {
  perfilEnMemoria = perfil
  emitChange()
}

/**
 * Lee el perfil de la sesión, o `null` si aún no se ha cargado `GET /me`.
 * La referencia solo cambia al mutar la sesión, por lo que sirve de snapshot estable.
 */
export function getPerfil(): PerfilResponse | null {
  return perfilEnMemoria
}

/**
 * Limpia toda la sesión local (token, slug y perfil) y notifica a los suscriptores.
 * Es idempotente. No deja rastro del tenant al salir (NEX-44).
 */
export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(SLUG_KEY)
  perfilEnMemoria = null
  emitChange()
}
