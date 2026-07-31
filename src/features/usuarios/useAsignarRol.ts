import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { AsignarRolRequest } from '@/core/api'
import { request } from '@/core/http'

/**
 * `PUT /usuarios/{id}/rol` (gate `usuario.asignar_rol`). `204` sin cuerpo. Los errores
 * se propagan como `ApiError` y la UI mapea el status (403 neutro/indistinguible, 404
 * destino inexistente, 422 rolId inválido).
 */
function asignarRol(
  usuarioId: string,
  datos: AsignarRolRequest,
): Promise<void> {
  return request<void>(`/usuarios/${usuarioId}/rol`, {
    method: 'PUT',
    body: datos,
  })
}

/**
 * Mutación de asignación de rol. Tras el `204` invalida DOS claves (capa de datos):
 * `['usuarios','lista']` (prefijo, todas las variantes del listado) y
 * `['usuarios','detalle',id]` (que por prefijo arrastra también el catálogo por destino
 * anidado). Ambas claves coinciden exactamente con las de `useUsuarios`. NO se refresca
 * `GET /me` ni el menú: cambiarte tu propio rol está prohibido por el backend (D-3).
 */
export function useAsignarRol(usuarioId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (datos: AsignarRolRequest) => asignarRol(usuarioId, datos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios', 'lista'] })
      queryClient.invalidateQueries({
        queryKey: ['usuarios', 'detalle', usuarioId],
      })
    },
  })
}
