import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { InvitarUsuarioRequest, InvitarUsuarioResponse } from '@/core/api'
import { apiPost } from '@/core/http'

/**
 * `POST /usuarios/invitaciones` (gate `usuario.invitar`). `201` devuelve el usuario
 * creado (el token de activación va solo por correo, nunca aquí). Los errores se
 * propagan como `ApiError` y la UI mapea el `status` (409 correo duplicado, 422 datos).
 */
function invitarUsuario(
  datos: InvitarUsuarioRequest,
): Promise<InvitarUsuarioResponse> {
  return apiPost<InvitarUsuarioResponse>('/usuarios/invitaciones', datos)
}

/**
 * Mutación de invitación. La INVALIDACIÓN de la caché vive aquí (capa de datos): tras un
 * alta exitosa, marca stale TODAS las variantes del listado (prefijo `['usuarios',
 * 'lista']`) para que el nuevo INVITADO aparezca al volver a la tabla. No depende de que
 * la página navegue; la navegación es un `onSuccess` aparte en la página.
 */
export function useInvitarUsuario() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: invitarUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios', 'lista'] })
    },
  })
}
