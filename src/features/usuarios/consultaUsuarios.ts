// Estado de la CONSULTA de usuarios (filtros + orden + página) como dato puro, más su
// validación contra whitelist y su (de)serialización. Es el corazón del "estado en la
// URL" (NEX-46): la vista NO llama al servidor con lo que venga en la URL — primero lo
// SANEA aquí. Un `?sort=rol,asc` tecleado a mano (rol no es ordenable) o un `?page=-3`
// se DESCARTAN y se cae al valor por defecto: nunca se emite un request de 400 conocido.
//
// Módulo puro (sin React ni fetch): unit-testable y reutilizable por el hook de URL y
// por el servicio.

import type { EstadoUsuario } from '@/core/api'

/** Campos por los que el contrato permite ordenar. `rol` NO está: es permanente. */
export const CAMPOS_ORDENABLES = [
  'nombre',
  'email',
  'estado',
  'createdAt',
] as const
export type CampoOrden = (typeof CAMPOS_ORDENABLES)[number]

export type DireccionOrden = 'asc' | 'desc'

/** Estados válidos del filtro (misma lista que el contrato). */
export const ESTADOS_USUARIO: readonly EstadoUsuario[] = [
  'INVITADO',
  'ACTIVO',
  'DESACTIVADO',
]

/** Un criterio de orden: un solo campo por request (lo exige el contrato). */
export interface Orden {
  campo: CampoOrden
  direccion: DireccionOrden
}

/**
 * Consulta saneada del listado. `pagina` es 1-based (natural para URL/UI); el servicio
 * la traduce al 0-based del contrato. Cadenas vacías / `null` = "sin filtro".
 */
export interface ConsultaUsuarios {
  nombre: string
  email: string
  estado: EstadoUsuario | null
  orden: Orden
  pagina: number
}

/** Orden por defecto del contrato: más recientes primero. */
export const ORDEN_DEFECTO: Orden = { campo: 'createdAt', direccion: 'desc' }

/** Tamaño de página fijo de esta pantalla (contrato: default 20, máx 100). */
export const TAMANO_PAGINA = 20

/** Consulta por defecto (sin filtros, primera página, orden por defecto). */
export const CONSULTA_DEFECTO: ConsultaUsuarios = {
  nombre: '',
  email: '',
  estado: null,
  orden: ORDEN_DEFECTO,
  pagina: 1,
}

function esCampoOrdenable(valor: string): valor is CampoOrden {
  return (CAMPOS_ORDENABLES as readonly string[]).includes(valor)
}

function esDireccion(valor: string): valor is DireccionOrden {
  return valor === 'asc' || valor === 'desc'
}

function esEstado(valor: string): valor is EstadoUsuario {
  return (ESTADOS_USUARIO as readonly string[]).includes(valor)
}

/**
 * Parsea `sort=campo,direccion` validando AMBAS partes contra la whitelist. Cualquier
 * desviación (campo no ordenable como `rol`, dirección inválida, formato roto) → orden
 * por defecto. Así jamás se envía un `sort` que el backend rechazaría con 400.
 */
function sanearOrden(sort: string | null): Orden {
  if (!sort) return ORDEN_DEFECTO
  const [campo, direccion] = sort.split(',')
  if (campo && direccion && esCampoOrdenable(campo) && esDireccion(direccion)) {
    return { campo, direccion }
  }
  return ORDEN_DEFECTO
}

/** Página válida: entero ≥ 1. Cualquier otra cosa (0, negativo, no numérico) → 1. */
function sanearPagina(page: string | null): number {
  if (page && /^\d+$/.test(page)) {
    const n = Number.parseInt(page, 10)
    if (n >= 1) return n
  }
  return 1
}

/**
 * Convierte los parámetros de la URL en una consulta VÁLIDA. Toda validación ocurre
 * aquí, ANTES de tocar el servidor: lo que no pasa la whitelist se sustituye por su
 * valor por defecto en silencio (la URL "corregida" la reescribe el hook al navegar).
 */
export function sanearConsulta(params: URLSearchParams): ConsultaUsuarios {
  const estado = params.get('estado')
  return {
    nombre: params.get('nombre') ?? '',
    email: params.get('email') ?? '',
    estado: estado && esEstado(estado) ? estado : null,
    orden: sanearOrden(params.get('sort')),
    pagina: sanearPagina(params.get('page')),
  }
}

/** `true` si hay algún filtro activo (para distinguir "vacío" de "sin resultados"). */
export function hayFiltrosActivos(consulta: ConsultaUsuarios): boolean {
  return (
    consulta.nombre !== '' || consulta.email !== '' || consulta.estado !== null
  )
}

/**
 * Serializa la consulta a parámetros de URL, OMITIENDO lo que está en su valor por
 * defecto (filtros vacíos, orden por defecto, página 1). URLs limpias y estables:
 * dos consultas equivalentes producen la misma URL.
 */
export function consultaAParams(
  consulta: ConsultaUsuarios,
): Record<string, string> {
  const params: Record<string, string> = {}
  if (consulta.nombre !== '') params.nombre = consulta.nombre
  if (consulta.email !== '') params.email = consulta.email
  if (consulta.estado !== null) params.estado = consulta.estado
  if (
    consulta.orden.campo !== ORDEN_DEFECTO.campo ||
    consulta.orden.direccion !== ORDEN_DEFECTO.direccion
  ) {
    params.sort = `${consulta.orden.campo},${consulta.orden.direccion}`
  }
  if (consulta.pagina > 1) params.page = String(consulta.pagina)
  return params
}

/**
 * Construye el query string para el SERVIDOR: `sort` y `size` siempre; `page` en 0-based
 * (contrato); filtros solo si tienen valor. La consulta ya viene saneada, así que este
 * query nunca provoca un 400 por parámetros inválidos.
 */
export function construirQueryServidor(consulta: ConsultaUsuarios): string {
  const params = new URLSearchParams()
  if (consulta.nombre !== '') params.set('nombre', consulta.nombre)
  if (consulta.email !== '') params.set('email', consulta.email)
  if (consulta.estado !== null) params.set('estado', consulta.estado)
  params.set('sort', `${consulta.orden.campo},${consulta.orden.direccion}`)
  params.set('page', String(consulta.pagina - 1))
  params.set('size', String(TAMANO_PAGINA))
  return `?${params.toString()}`
}

/**
 * Calcula el nuevo orden al pulsar un encabezado: si es el campo activo, invierte la
 * dirección; si es otro, arranca en la más útil (createdAt: desc = recientes primero;
 * el resto: asc = A→Z). Puro y testeable.
 */
export function alternarOrden(actual: Orden, campo: CampoOrden): Orden {
  if (actual.campo === campo) {
    return {
      campo,
      direccion: actual.direccion === 'asc' ? 'desc' : 'asc',
    }
  }
  return { campo, direccion: campo === 'createdAt' ? 'desc' : 'asc' }
}
