// Catálogo de roles asignables POR DESTINO (distinto del de invitar): el backend lo
// filtra para ESE usuario (D-2 y D-8). La UI transporta y ordena; no replica jerarquía.

import type { RolAsignable } from '@/core/api'
import { apiGet } from '@/core/http'

/** `GET /usuarios/{id}/roles-asignables`. Colección cerrada, sin orden garantizado. */
export function listarRolesAsignablesDestino(
  usuarioId: string,
  signal?: AbortSignal,
): Promise<RolAsignable[]> {
  return apiGet<RolAsignable[]>(`/usuarios/${usuarioId}/roles-asignables`, {
    signal,
  })
}
