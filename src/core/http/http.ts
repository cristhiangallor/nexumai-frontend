// Cliente HTTP central: ÚNICO punto de fetch de la app (regla dura de
// architecture.md). Ningún componente hace `fetch(...)` por su cuenta.
//
// Responsabilidades:
//  - Base URL por entorno (`VITE_API_BASE_URL`, variable de entorno de Vite).
//  - Inyectar `Authorization: Bearer <token>` leyendo el token del módulo de sesión
//    (ADR-007). El token NUNCA va en la URL ni se registra en consola.
//  - Centralizar el manejo de `401` en peticiones autenticadas: limpia la sesión y
//    dispara el punto de integración de redirección a login.

import { clearSession, getSlug, getToken } from '@/core/session'

/** Error de una respuesta HTTP no exitosa. El backend responde sin envelope. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message = `HTTP ${status}`) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * Manejador global de `401` en peticiones autenticadas (sesión expirada/invalidada).
 * Recibe el `slug` del tenant capturado ANTES de limpiar la sesión, para poder
 * redirigir a `/{slug}/login`. Se registra en el arranque (NEX-62). Por defecto no
 * hay handler.
 */
let onUnauthorized: ((slug: string | null) => void) | null = null

/** Registra (o limpia con `null`) el manejador global de `401` autenticado. */
export function setUnauthorizedHandler(
  handler: ((slug: string | null) => void) | null,
): void {
  onUnauthorized = handler
}

export interface RequestOptions {
  method?: string
  /** Cuerpo a serializar como JSON. Se omite si es `undefined`. */
  body?: unknown
  /** Cabeceras extra. No pongas aquí `Authorization`: lo inyecta el cliente. */
  headers?: Record<string, string>
  /**
   * `true` (por defecto): adjunta el Bearer y, ante `401`, limpia sesión + redirige.
   * `false`: petición pública (p. ej. `POST /login`). Un `401` ahí es del propio
   * intento (credenciales inválidas), NO de una sesión expirada: se propaga como
   * `ApiError` sin tocar la sesión ni redirigir.
   */
  auth?: boolean
  /**
   * `true`: omite SOLO la llamada al handler global de 401 (`onUnauthorized`) en esta
   * petición. `clearSession` se mantiene (idempotente) y el `ApiError(401)` se sigue
   * lanzando. Lo usa el logout voluntario (NEX-62): un 401 ahí es el resultado buscado,
   * no una sesión expirada, así que NO debe disparar el aviso/redirección global.
   */
  skipUnauthorizedHandler?: boolean
  signal?: AbortSignal
}

/**
 * Núcleo: ejecuta la petición y devuelve el cuerpo parseado JUNTO con el `Response`,
 * para poder leer headers de respuesta (p. ej. `X-Total-Count`). Base de `request` y
 * de `apiGetConRespuesta`. Lanza `ApiError` en respuestas no exitosas; deja propagar
 * errores de red.
 */
async function requestBase<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ datos: T; respuesta: Response }> {
  const {
    method = 'GET',
    body,
    headers = {},
    auth = true,
    skipUnauthorizedHandler = false,
    signal,
  } = options

  // Leída por petición (no en carga de módulo) para reflejar el entorno en runtime.
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  }

  if (body !== undefined) {
    finalHeaders['Content-Type'] = 'application/json'
  }

  if (auth) {
    const token = getToken()
    if (token) {
      finalHeaders.Authorization = `Bearer ${token}`
    }
  }

  const respuesta = await fetch(`${baseUrl}${path}`, {
    method,
    headers: finalHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  })

  if (respuesta.status === 401 && auth) {
    // Sesión expirada/invalidada en una petición autenticada. Capturar el slug ANTES
    // de limpiar (clearSession lo borra) para que el handler pueda redirigir al login
    // del tenant. El logout voluntario pasa `skipUnauthorizedHandler`: un 401 ahí es el
    // resultado buscado, no una sesión expirada.
    const slugPrevio = getSlug()
    clearSession()
    if (!skipUnauthorizedHandler) {
      onUnauthorized?.(slugPrevio)
    }
  }

  if (!respuesta.ok) {
    throw new ApiError(respuesta.status)
  }

  // `204 No Content` o cuerpo vacío → sin JSON que parsear.
  if (respuesta.status === 204) {
    return { datos: undefined as T, respuesta }
  }
  const text = await respuesta.text()
  return { datos: (text ? JSON.parse(text) : undefined) as T, respuesta }
}

/**
 * Ejecuta una petición contra el backend y devuelve el JSON tipado como `T`.
 * Lanza `ApiError` en respuestas no exitosas; deja propagar errores de red.
 */
export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { datos } = await requestBase<T>(path, options)
  return datos
}

/**
 * Como `apiGet` pero devuelve también el `Response`, para leer headers de respuesta
 * (p. ej. `X-Total-Count` en listados paginados). Aditivo: NO cambia `request`,
 * `apiGet` ni `apiPost`. El header puede no llegar (proxy/CORS): el consumidor debe
 * tolerar su ausencia.
 */
export async function apiGetConRespuesta<T>(
  path: string,
  options?: Omit<RequestOptions, 'method' | 'body'>,
): Promise<{ datos: T; respuesta: Response }> {
  return requestBase<T>(path, { ...options, method: 'GET' })
}

/** Atajo `GET`. */
export function apiGet<T>(
  path: string,
  options?: Omit<RequestOptions, 'method' | 'body'>,
): Promise<T> {
  return request<T>(path, { ...options, method: 'GET' })
}

/** Atajo `POST` con cuerpo JSON. */
export function apiPost<T>(
  path: string,
  body?: unknown,
  options?: Omit<RequestOptions, 'method' | 'body'>,
): Promise<T> {
  return request<T>(path, { ...options, method: 'POST', body })
}
