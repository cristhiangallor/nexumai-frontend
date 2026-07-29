import { describe, expect, it } from 'vitest'

import {
  alternarOrden,
  CONSULTA_DEFECTO,
  consultaAParams,
  construirQueryServidor,
  hayFiltrosActivos,
  ORDEN_DEFECTO,
  sanearConsulta,
  type ConsultaUsuarios,
} from './consultaUsuarios'

function params(cadena: string): URLSearchParams {
  return new URLSearchParams(cadena)
}

describe('sanearConsulta — validación contra whitelist antes del servidor', () => {
  it('sin parámetros devuelve los valores por defecto', () => {
    expect(sanearConsulta(params(''))).toEqual(CONSULTA_DEFECTO)
  })

  it('DESCARTA un sort por un campo no ordenable (rol) y cae al orden por defecto', () => {
    // Clave del anti-400: `?sort=rol,asc` tecleado a mano no se reenvía al servidor.
    expect(sanearConsulta(params('sort=rol,asc')).orden).toEqual(ORDEN_DEFECTO)
  })

  it('acepta un sort válido y descarta una dirección inválida', () => {
    expect(sanearConsulta(params('sort=nombre,asc')).orden).toEqual({
      campo: 'nombre',
      direccion: 'asc',
    })
    expect(sanearConsulta(params('sort=nombre,lateral')).orden).toEqual(
      ORDEN_DEFECTO,
    )
  })

  it('sanea la página: 0, negativos y no numéricos → 1; entero válido se conserva', () => {
    expect(sanearConsulta(params('page=0')).pagina).toBe(1)
    expect(sanearConsulta(params('page=-3')).pagina).toBe(1)
    expect(sanearConsulta(params('page=abc')).pagina).toBe(1)
    expect(sanearConsulta(params('page=5')).pagina).toBe(5)
  })

  it('acepta un estado de la whitelist y descarta uno inválido', () => {
    expect(sanearConsulta(params('estado=ACTIVO')).estado).toBe('ACTIVO')
    expect(sanearConsulta(params('estado=FANTASMA')).estado).toBeNull()
  })

  it('transporta nombre y email tal cual', () => {
    const c = sanearConsulta(params('nombre=Ana&email=ana%40x.com'))
    expect(c.nombre).toBe('Ana')
    expect(c.email).toBe('ana@x.com')
  })
})

describe('consultaAParams — serializa omitiendo valores por defecto', () => {
  it('la consulta por defecto produce una URL vacía', () => {
    expect(consultaAParams(CONSULTA_DEFECTO)).toEqual({})
  })

  it('incluye solo lo que difiere del valor por defecto', () => {
    const c: ConsultaUsuarios = {
      nombre: 'Ana',
      email: '',
      estado: 'INVITADO',
      orden: { campo: 'nombre', direccion: 'asc' },
      pagina: 3,
    }
    expect(consultaAParams(c)).toEqual({
      nombre: 'Ana',
      estado: 'INVITADO',
      sort: 'nombre,asc',
      page: '3',
    })
  })
})

describe('construirQueryServidor — formato del contrato', () => {
  it('siempre envía sort y size, y la página en 0-based', () => {
    const q = new URLSearchParams(
      construirQueryServidor(CONSULTA_DEFECTO).slice(1),
    )
    expect(q.get('sort')).toBe('createdAt,desc')
    expect(q.get('size')).toBe('20')
    expect(q.get('page')).toBe('0') // pagina 1 (UI) → 0 (contrato)
    expect(q.get('nombre')).toBeNull() // filtros vacíos no se envían
  })

  it('traduce la página 1-based de la UI al 0-based del servidor', () => {
    const q = new URLSearchParams(
      construirQueryServidor({ ...CONSULTA_DEFECTO, pagina: 4 }).slice(1),
    )
    expect(q.get('page')).toBe('3')
  })
})

describe('alternarOrden', () => {
  it('invierte la dirección si es el campo activo', () => {
    expect(
      alternarOrden({ campo: 'nombre', direccion: 'asc' }, 'nombre'),
    ).toEqual({ campo: 'nombre', direccion: 'desc' })
    expect(
      alternarOrden({ campo: 'nombre', direccion: 'desc' }, 'nombre'),
    ).toEqual({ campo: 'nombre', direccion: 'asc' })
  })

  it('un campo nuevo arranca en la dirección más útil (createdAt: desc; resto: asc)', () => {
    expect(alternarOrden(ORDEN_DEFECTO, 'nombre')).toEqual({
      campo: 'nombre',
      direccion: 'asc',
    })
    expect(
      alternarOrden({ campo: 'nombre', direccion: 'asc' }, 'createdAt'),
    ).toEqual({ campo: 'createdAt', direccion: 'desc' })
  })
})

describe('hayFiltrosActivos', () => {
  it('es falso sin filtros y verdadero con cualquiera', () => {
    expect(hayFiltrosActivos(CONSULTA_DEFECTO)).toBe(false)
    expect(hayFiltrosActivos({ ...CONSULTA_DEFECTO, nombre: 'x' })).toBe(true)
    expect(hayFiltrosActivos({ ...CONSULTA_DEFECTO, estado: 'ACTIVO' })).toBe(
      true,
    )
  })
})
