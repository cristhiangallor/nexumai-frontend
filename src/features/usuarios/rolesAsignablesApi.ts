// Acceso al catálogo de roles asignables, sobre el cliente HTTP central (con Bearer:
// gate usuario.invitar). El backend YA filtra por jerarquía; la UI solo transporta.

import type { RolAsignable } from '@/core/api'
import { apiGet } from '@/core/http'

/** `GET /usuarios/roles-asignables`. Colección cerrada, sin orden garantizado. */
export function listarRolesAsignables(
  signal?: AbortSignal,
): Promise<RolAsignable[]> {
  return apiGet<RolAsignable[]>('/usuarios/roles-asignables', { signal })
}
