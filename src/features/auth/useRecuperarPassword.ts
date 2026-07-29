import { useMutation } from '@tanstack/react-query'

import type { RecuperarPasswordRequest } from '@/core/api'
import { apiPost } from '@/core/http'

/**
 * Solicita el envío del enlace de recuperación. Endpoint ANÓNIMO (`auth: false`): no
 * adjunta Bearer. Responde `202` exista o no la cuenta (anti-enumeración); el enlace se
 * envía por correo de forma asíncrona, NUNCA en la respuesta HTTP. No se registra el
 * correo en ningún log.
 */
async function solicitarRecuperacion(
  datos: RecuperarPasswordRequest,
): Promise<void> {
  await apiPost<void>('/password/recuperacion', datos, { auth: false })
}

/** Mutación para solicitar recuperación de contraseña. */
export function useRecuperarPassword() {
  return useMutation({ mutationFn: solicitarRecuperacion })
}
