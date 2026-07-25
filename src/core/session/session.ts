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
//    en disco. `permisos[]` (que consumirá NEX-51) vive aquí mientras dura la sesión.

import type { PerfilResponse } from '@/core/api/contracts'

/** Clave de `localStorage` del token. Prefijo de namespace para no colisionar. */
const TOKEN_KEY = 'nexum.token'

/** Estado de sesión en memoria (perfil). Se pierde al recargar; se re-obtiene de /me. */
let perfilEnMemoria: PerfilResponse | null = null

/** Guarda el token de sesión. */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

/** Lee el token de sesión, o `null` si no hay sesión. */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

/** Guarda el perfil (`PerfilResponse` de `GET /me`) en el estado de sesión. */
export function setPerfil(perfil: PerfilResponse): void {
  perfilEnMemoria = perfil
}

/** Lee el perfil de la sesión, o `null` si aún no se ha cargado `GET /me`. */
export function getPerfil(): PerfilResponse | null {
  return perfilEnMemoria
}

/** Limpia toda la sesión local: token y perfil. Backend invalida por su lado. */
export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY)
  perfilEnMemoria = null
}
