// Acceso a datos de usuarios sobre el cliente HTTP central (NUNCA fetch directo).
// Dos operaciones de solo lectura: listar (paginado) y obtener por id.
//
// La UI NUNCA construye ni envía identificadores de tenant: el backend deriva el tenant
// del token y filtra por él. Aquí solo viajan filtros/orden/paginación de experiencia.

import type { UsuarioResumen } from '@/core/api'
import { apiGet, apiGetConRespuesta } from '@/core/http'

import {
  type ConsultaUsuarios,
  construirQueryServidor,
} from './consultaUsuarios'

/**
 * Página de resultados del listado. `total` es `number | null`: el conteo viene en la
 * cabecera `X-Total-Count`, que un proxy o CORS podría filtrar. Si no llega, `total`
 * queda `null` (desconocido) y la paginación degrada con elegancia — no se inventa 0.
 */
export interface PaginaUsuarios {
  usuarios: UsuarioResumen[]
  total: number | null
}

/** Lee `X-Total-Count` de forma tolerante: ausente o no numérico → `null`. */
function leerTotal(respuesta: Response): number | null {
  const bruto = respuesta.headers.get('X-Total-Count')
  if (bruto === null) return null
  const n = Number.parseInt(bruto, 10)
  return Number.isNaN(n) ? null : n
}

/**
 * `GET /usuarios` (gate `usuario.ver`). El cuerpo 200 es un array DIRECTO (sin envelope);
 * el total va en la cabecera. La consulta ya viene saneada por `consultaUsuarios`, así
 * que este request no dispara 400 por parámetros inválidos.
 */
export async function listarUsuarios(
  consulta: ConsultaUsuarios,
  signal?: AbortSignal,
): Promise<PaginaUsuarios> {
  const { datos, respuesta } = await apiGetConRespuesta<UsuarioResumen[]>(
    `/usuarios${construirQueryServidor(consulta)}`,
    { signal },
  )
  return { usuarios: datos, total: leerTotal(respuesta) }
}

/**
 * `GET /usuarios/{id}` (gate `usuario.ver`). Un `404` significa "no existe O es de otro
 * tenant", indistinguibles a propósito: se propaga como `ApiError(404)` y la UI muestra
 * un mensaje neutro, sin insinuar que pudiera existir en otra empresa.
 */
export function obtenerUsuario(
  id: string,
  signal?: AbortSignal,
): Promise<UsuarioResumen> {
  return apiGet<UsuarioResumen>(`/usuarios/${id}`, { signal })
}
