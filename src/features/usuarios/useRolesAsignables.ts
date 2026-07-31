import { useQuery } from '@tanstack/react-query'

import type { RolAsignable } from '@/core/api'

import { listarRolesAsignables } from './rolesAsignablesApi'

/**
 * Catálogo de roles que el actor puede otorgar. `retry: false`: un `403` (sin
 * `usuario.invitar`) no debe reintentarse. El orden lo decide la UI (la lista no lo
 * garantiza).
 */
export function useRolesAsignables() {
  return useQuery<RolAsignable[]>({
    queryKey: ['usuarios', 'roles-asignables'],
    queryFn: ({ signal }) => listarRolesAsignables(signal),
    retry: false,
  })
}
