// Cliente HTTP central: ÚNICO punto de fetch de la app (regla dura de
// architecture.md). Ningún componente hace `fetch(...)` por su cuenta.
//
// Responsabilidades:
//  - Base URL por entorno (`VITE_API_BASE_URL`, variable de entorno de Vite).
//  - Inyectar `Authorization: Bearer <token>` leyendo el token del módulo de sesión
//    (ADR-007). El token NUNCA va en la URL ni se registra en consola.
//  - Centralizar el manejo de `401` en peticiones autenticadas: limpia la sesión y
//    dispara el punto de integración de redirección a login.

import { clearSession, getToken } from '@/core/session'

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
 * Manejador de `401` en peticiones autenticadas (sesión expirada/invalidada).
 * La redirección concreta a `/{slug}/login` es un punto de integración: se conecta
 * cuando exista el router guard (NEX-51). Por defecto no hay redirección.
 */
let onUnauthorized: (() => void) | null = null

/** Registra (o limpia con `null`) el manejador de `401` autenticado. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
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
  signal?: AbortSignal
}

/**
 * Ejecuta una petición contra el backend y devuelve el JSON tipado como `T`.
 * Lanza `ApiError` en respuestas no exitosas; deja propagar errores de red.
 */
export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, headers = {}, auth = true, signal } = options

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

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: finalHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  })

  if (response.status === 401 && auth) {
    // Sesión expirada/invalidada en una petición autenticada: limpia y avisa.
    clearSession()
    onUnauthorized?.()
  }

  if (!response.ok) {
    throw new ApiError(response.status)
  }

  // `204 No Content` o cuerpo vacío → sin JSON que parsear.
  if (response.status === 204) {
    return undefined as T
  }
  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
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
