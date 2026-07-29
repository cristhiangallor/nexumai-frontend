// Puente entre la URL y la consulta saneada. La URL es la ÚNICA fuente de verdad del
// estado de la vista (filtros, orden, página): es enlazable, sobrevive a recargas y el
// botón "atrás" del navegador funciona. No hay estado paralelo en React que se pueda
// desincronizar.

import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'

import type { EstadoUsuario } from '@/core/api'

import {
  alternarOrden,
  type CampoOrden,
  type ConsultaUsuarios,
  consultaAParams,
  sanearConsulta,
} from './consultaUsuarios'

// Reexport local del tipo del filtro para los consumidores del hook.
type EstadoFiltro = EstadoUsuario | null

interface ControlConsulta {
  /** Consulta saneada derivada de la URL actual. */
  consulta: ConsultaUsuarios
  /** Cambia un filtro (nombre/email/estado) y vuelve a la página 1. */
  setFiltro: (
    parcial: Partial<Pick<ConsultaUsuarios, 'nombre' | 'email'>> & {
      estado?: EstadoFiltro
    },
  ) => void
  /** Alterna el orden por un campo ordenable y vuelve a la página 1. */
  ordenarPor: (campo: CampoOrden) => void
  /** Navega a una página concreta (1-based). */
  irAPagina: (pagina: number) => void
  /** Limpia todos los filtros (conserva el orden) y vuelve a la página 1. */
  limpiarFiltros: () => void
}

/**
 * Deriva la consulta de la URL y expone acciones que la reescriben. Toda escritura pasa
 * por `consultaAParams` (omite valores por defecto → URLs limpias). Cambiar un filtro o
 * el orden RESETEA a la página 1: cambiar de criterio con `page=7` mostraría "sin
 * resultados" falsos.
 */
export function useConsultaUsuarios(): ControlConsulta {
  const [searchParams, setSearchParams] = useSearchParams()

  const consulta = useMemo(() => sanearConsulta(searchParams), [searchParams])

  const aplicar = useCallback(
    (nueva: ConsultaUsuarios) => {
      setSearchParams(consultaAParams(nueva))
    },
    [setSearchParams],
  )

  const setFiltro = useCallback<ControlConsulta['setFiltro']>(
    (parcial) => {
      aplicar({ ...consulta, ...parcial, pagina: 1 })
    },
    [aplicar, consulta],
  )

  const ordenarPor = useCallback<ControlConsulta['ordenarPor']>(
    (campo) => {
      aplicar({
        ...consulta,
        orden: alternarOrden(consulta.orden, campo),
        pagina: 1,
      })
    },
    [aplicar, consulta],
  )

  const irAPagina = useCallback<ControlConsulta['irAPagina']>(
    (pagina) => {
      aplicar({ ...consulta, pagina })
    },
    [aplicar, consulta],
  )

  const limpiarFiltros = useCallback<ControlConsulta['limpiarFiltros']>(() => {
    aplicar({ ...consulta, nombre: '', email: '', estado: null, pagina: 1 })
  }, [aplicar, consulta])

  return { consulta, setFiltro, ordenarPor, irAPagina, limpiarFiltros }
}
