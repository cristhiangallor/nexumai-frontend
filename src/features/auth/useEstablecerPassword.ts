import { useMutation } from '@tanstack/react-query'

import type { EstablecerPasswordRequest } from '@/core/api'
import { apiPost } from '@/core/http'

/**
 * Establece una nueva contraseña con el token del enlace. Endpoint ANÓNIMO
 * (`auth: false`): no adjunta Bearer. `204` éxito; `400` si no cumple la política
 * (mínimo 12); `422` token inválido/expirado/ya usado (se propagan como `ApiError` y la
 * UI mapea el `status`). Es el MISMO endpoint que la activación de invitado (NEX-47).
 * Ni el token ni la contraseña se registran en ningún log.
 */
async function establecerPassword(
  datos: EstablecerPasswordRequest,
): Promise<void> {
  await apiPost<void>('/password', datos, { auth: false })
}

/** Mutación para establecer una nueva contraseña. */
export function useEstablecerPassword() {
  return useMutation({ mutationFn: establecerPassword })
}
