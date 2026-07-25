import { useMutation } from '@tanstack/react-query'

import type { LoginRequest, LoginResponse, PerfilResponse } from '@/core/api'
import { apiGet, apiPost } from '@/core/http'
import { clearSession, setPerfil, setToken } from '@/core/session'

/**
 * Flujo de login completo (dos pasos), sobre el cliente HTTP central:
 *   POST /login → guardar token → GET /me → guardar perfil.
 *
 * - `POST /login` es endpoint público (`auth: false`): un `401` aquí son credenciales
 *   inválidas, no una sesión expirada, así que no dispara la limpieza/redirección
 *   global del cliente HTTP.
 * - Si `GET /me` falla tras un login exitoso, se limpia la sesión para no dejar un
 *   token huérfano sin sesión utilizable, y se propaga el error.
 *
 * Devuelve el `PerfilResponse`. La navegación tras el éxito la decide el componente
 * (es asunto de UI, no de datos).
 */
async function iniciarSesion(
  credenciales: LoginRequest,
): Promise<PerfilResponse> {
  const { token } = await apiPost<LoginResponse>('/login', credenciales, {
    auth: false,
  })
  setToken(token)

  try {
    const perfil = await apiGet<PerfilResponse>('/me')
    setPerfil(perfil)
    return perfil
  } catch (error) {
    clearSession()
    throw error
  }
}

/** Mutación de inicio de sesión. Ver {@link iniciarSesion} para el flujo. */
export function useLogin() {
  return useMutation({ mutationFn: iniciarSesion })
}
