import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { UsuarioResumen } from '@/core/api'
import { ApiError } from '@/core/http'

import { CONSULTA_DEFECTO } from './consultaUsuarios'
import { listarUsuarios, obtenerUsuario } from './usuariosApi'

/** Respuesta con cabeceras, como la que consume `apiGetConRespuesta`. */
function mockResponse(
  status: number,
  body?: unknown,
  headers: Record<string, string> = {},
) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  }
}

const unUsuario: UsuarioResumen = {
  id: 'u1',
  nombre: 'Ana López',
  email: 'ana@x.com',
  rol: 'RRHH',
  estado: 'ACTIVO',
  createdAt: '2026-01-10T00:00:00Z',
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.test')
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  localStorage.clear()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('listarUsuarios', () => {
  it('pega a /usuarios con el query del contrato y devuelve el total de X-Total-Count', async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(200, [unUsuario], { 'X-Total-Count': '42' }),
    )

    const pagina = await listarUsuarios(CONSULTA_DEFECTO)

    expect(pagina.usuarios).toEqual([unUsuario])
    expect(pagina.total).toBe(42)

    const url = new URL(fetchMock.mock.calls[0][0] as string)
    expect(url.origin + url.pathname).toBe('https://api.test/usuarios')
    expect(url.searchParams.get('sort')).toBe('createdAt,desc')
    expect(url.searchParams.get('page')).toBe('0')
    expect(url.searchParams.get('size')).toBe('20')
  })

  it('si la cabecera X-Total-Count NO llega, el total queda null (degradado)', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, [unUsuario]))

    const pagina = await listarUsuarios(CONSULTA_DEFECTO)

    expect(pagina.total).toBeNull()
  })

  it('si X-Total-Count no es numérico, el total queda null', async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(200, [], { 'X-Total-Count': 'muchos' }),
    )

    const pagina = await listarUsuarios(CONSULTA_DEFECTO)

    expect(pagina.total).toBeNull()
  })

  it('propaga filtros y orden saneados en el query', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, []))

    await listarUsuarios({
      nombre: 'Ana',
      email: 'ana@x.com',
      estado: 'INVITADO',
      orden: { campo: 'nombre', direccion: 'asc' },
      pagina: 2,
    })

    const url = new URL(fetchMock.mock.calls[0][0] as string)
    expect(url.searchParams.get('nombre')).toBe('Ana')
    expect(url.searchParams.get('email')).toBe('ana@x.com')
    expect(url.searchParams.get('estado')).toBe('INVITADO')
    expect(url.searchParams.get('sort')).toBe('nombre,asc')
    expect(url.searchParams.get('page')).toBe('1')
  })
})

describe('obtenerUsuario', () => {
  it('pega a /usuarios/{id} y devuelve el usuario', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(200, unUsuario))

    const usuario = await obtenerUsuario('u1')

    expect(usuario).toEqual(unUsuario)
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.test/usuarios/u1')
  })

  it('propaga un 404 como ApiError (no existe o es de otro tenant, indistinguible)', async () => {
    fetchMock.mockResolvedValue(mockResponse(404))

    await expect(obtenerUsuario('desconocido')).rejects.toBeInstanceOf(ApiError)
    await expect(obtenerUsuario('desconocido')).rejects.toMatchObject({
      status: 404,
    })
  })
})
