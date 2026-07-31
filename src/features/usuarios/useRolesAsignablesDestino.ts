import { useQuery } from '@tanstack/react-query'

import type { RolAsignable } from '@/core/api'

import { listarRolesAsignablesDestino } from './rolesDestinoApi'

/**
 * Catálogo de roles asignables a un destino concreto. La queryKey se ANIDA bajo el
 * detalle (`['usuarios','detalle',id,...]`) a propósito: al asignar un rol se invalida
 * `['usuarios','detalle',id]` por prefijo, lo que arrastra este catálogo y lo recalcula
 * (al cambiar el nivel del destino, el conjunto asignable —D-8— puede cambiar).
 * `retry: false`: 403/404 son respuestas legítimas, no fallos a reintentar.
 */
export function useRolesAsignablesDestino(usuarioId: string) {
  return useQuery<RolAsignable[]>({
    queryKey: ['usuarios', 'detalle', usuarioId, 'roles-asignables'],
    queryFn: ({ signal }) => listarRolesAsignablesDestino(usuarioId, signal),
    retry: false,
  })
}
