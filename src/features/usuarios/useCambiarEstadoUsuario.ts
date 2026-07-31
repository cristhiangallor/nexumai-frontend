import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { CambiarEstadoRequest } from '@/core/api'
import { request } from '@/core/http'

/**
 * `PUT /usuarios/{id}/estado` (gate `usuario.cambiar_estado`). `204` sin cuerpo, efecto
 * inmediato. Los errores se propagan como `ApiError` y la UI mapea el status (403 neutro
 * indistinguible, 404 destino inexistente, 422 estado inválido).
 */
function cambiarEstado(
  usuarioId: string,
  datos: CambiarEstadoRequest,
): Promise<void> {
  return request<void>(`/usuarios/${usuarioId}/estado`, {
    method: 'PUT',
    body: datos,
  })
}

/**
 * Mutación de cambio de estado. Tras el `204` invalida las MISMAS dos claves que F-012:
 * `['usuarios','lista']` (prefijo) y `['usuarios','detalle',id]` (que por prefijo arrastra
 * el catálogo por destino anidado). Ambas coinciden exactamente con las de `useUsuarios`.
 */
export function useCambiarEstadoUsuario(usuarioId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (datos: CambiarEstadoRequest) =>
      cambiarEstado(usuarioId, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios', 'lista'] })
      queryClient.invalidateQueries({
        queryKey: ['usuarios', 'detalle', usuarioId],
      })
    },
  })
}
