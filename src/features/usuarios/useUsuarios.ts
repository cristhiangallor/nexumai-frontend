// Hooks de estado de servidor (TanStack Query v5) para el listado y el detalle de
// usuarios. Encapsulan queryKey y opciones; los componentes solo consumen el resultado.

import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type { UsuarioResumen } from '@/core/api'

import {
  type ConsultaUsuarios,
  construirQueryServidor,
} from './consultaUsuarios'
import {
  listarUsuarios,
  obtenerUsuario,
  type PaginaUsuarios,
} from './usuariosApi'

/**
 * Listado paginado. La `queryKey` incluye el query del servidor (string estable): al
 * cambiar filtros/orden/página, cambia la clave y se refresca. `keepPreviousData` evita
 * el parpadeo a skeleton al paginar (se mantiene la página anterior mientras carga la
 * nueva). `retry: false`: un 403 (permiso revocado) o un 400 no deben reintentarse.
 */
export function useUsuarios(consulta: ConsultaUsuarios) {
  return useQuery<PaginaUsuarios>({
    queryKey: ['usuarios', 'lista', construirQueryServidor(consulta)],
    queryFn: ({ signal }) => listarUsuarios(consulta, signal),
    placeholderData: keepPreviousData,
    retry: false,
  })
}

/**
 * Detalle por id. `enabled` solo cuando hay id. `retry: false`: un 404 (no existe o es
 * de otro tenant) es una respuesta legítima, no un fallo transitorio que reintentar.
 */
export function useUsuario(id: string | undefined) {
  return useQuery<UsuarioResumen>({
    queryKey: ['usuarios', 'detalle', id],
    queryFn: ({ signal }) => obtenerUsuario(id as string, signal),
    enabled: Boolean(id),
    retry: false,
  })
}
