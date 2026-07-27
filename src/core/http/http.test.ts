import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  apiGet,
  apiPost,
  ApiError,
  request,
  setUnauthorizedHandler,
} from '@/core/http'
import {
  clearSession,
  getSlug,
  getToken,
  setSlug,
  setToken,
} from '@/core/session'

/** Construye una respuesta mínima con la forma que usa el cliente HTTP. */
function mockResponse(
  status: number,
  body?: unknown,
): { ok: boolean; status: number; text: () => Promise<string> } {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  }
}

/** Devuelve el `init` con el que se llamó a `fetch`. */
function lastInit(fetchMock: ReturnType<typeof vi.fn>): RequestInit {
  return fetchMock.mock.calls.at(-1)![1] as RequestInit
}

/** Devuelve las cabeceras (objeto plano) del último `fetch`. */
function lastHeaders(
  fetchMock: ReturnType<typeof vi.fn>,
): Record<string, string> {
  return lastInit(fetchMock).headers as Record<string, string>
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.test')
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  clearSession()
  setUnauthorizedHandler(null)
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('cliente HTTP — base URL y método', () => {
  it('antepone la base URL del entorno a la ruta', async () => {
    fetchMock.mockResolvedValue(mockResponse(200, { ok: true }))

    await apiGet('/me')

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.test/me')
    expect(lastInit(fetchMock).method).toBe('GET')
  })

  it('serializa el cuerpo como JSON y fija Content-Type en POST', async () => {
    fetchMock.mockResolvedValue(mockResponse(200, { token: 't' }))

    await apiPost('/login', { slug: 's', email: 'e', password: 'p' })

    const init = lastInit(fetchMock)
    expect(init.method).toBe('POST')
    expect(init.body).toBe(
      JSON.stringify({ slug: 's', email: 'e', password: 'p' }),
    )
    expect(lastHeaders(fetchMock)['Content-Type']).toBe('application/json')
  })
})

describe('cliente HTTP — inyección de Bearer', () => {
  it('adjunta Authorization: Bearer cuando hay token', async () => {
    setToken('token-abc')
    fetchMock.mockResolvedValue(mockResponse(200, {}))

    await apiGet('/me')

    expect(lastHeaders(fetchMock).Authorization).toBe('Bearer token-abc')
  })

  it('no adjunta Authorization cuando no hay token', async () => {
    fetchMock.mockResolvedValue(mockResponse(200, {}))

    await apiGet('/me')

    expect(lastHeaders(fetchMock).Authorization).toBeUndefined()
  })

  it('no adjunta Authorization en peticiones públicas (auth: false)', async () => {
    setToken('token-abc')
    fetchMock.mockResolvedValue(mockResponse(200, { token: 't' }))

    await apiPost(
      '/login',
      { slug: 's', email: 'e', password: 'p' },
      {
        auth: false,
      },
    )

    expect(lastHeaders(fetchMock).Authorization).toBeUndefined()
  })
})

describe('cliente HTTP — respuestas y errores', () => {
  it('devuelve el JSON parseado y tipado', async () => {
    fetchMock.mockResolvedValue(mockResponse(200, { token: 'xyz' }))

    const data = await apiPost<{ token: string }>('/login', {}, { auth: false })

    expect(data).toEqual({ token: 'xyz' })
  })

  it('devuelve undefined ante 204 sin cuerpo', async () => {
    fetchMock.mockResolvedValue(mockResponse(204))

    const data = await request('/algo', { method: 'DELETE' })

    expect(data).toBeUndefined()
  })

  it('lanza ApiError con el status en respuestas no exitosas', async () => {
    fetchMock.mockResolvedValue(mockResponse(500))

    await expect(apiGet('/me')).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
    })
    await expect(apiGet('/me')).rejects.toBeInstanceOf(ApiError)
  })
})

describe('cliente HTTP — manejo de 401', () => {
  it('en petición autenticada: limpia sesión, avisa y lanza ApiError(401)', async () => {
    setToken('token-abc')
    const onUnauthorized = vi.fn()
    setUnauthorizedHandler(onUnauthorized)
    fetchMock.mockResolvedValue(mockResponse(401))

    await expect(apiGet('/me')).rejects.toMatchObject({ status: 401 })

    expect(getToken()).toBeNull() // sesión limpiada
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('en petición pública (login): NO limpia sesión ni avisa, solo lanza 401', async () => {
    // Un 401 en login son credenciales inválidas, no una sesión expirada.
    setToken('token-previo')
    const onUnauthorized = vi.fn()
    setUnauthorizedHandler(onUnauthorized)
    fetchMock.mockResolvedValue(mockResponse(401))

    await expect(
      apiPost(
        '/login',
        { slug: 's', email: 'e', password: 'p' },
        {
          auth: false,
        },
      ),
    ).rejects.toMatchObject({ status: 401 })

    expect(getToken()).toBe('token-previo') // sesión intacta
    expect(onUnauthorized).not.toHaveBeenCalled()
  })
})

describe('cliente HTTP — handler global de 401 (NEX-62)', () => {
  it('pasa al handler el slug capturado ANTES de limpiar la sesión', async () => {
    setToken('token-abc')
    setSlug('acme')
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    fetchMock.mockResolvedValue(mockResponse(401))

    await expect(apiGet('/me')).rejects.toMatchObject({ status: 401 })

    // El handler recibe el slug previo aunque clearSession ya lo haya borrado.
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith('acme')
    expect(getSlug()).toBeNull()
  })

  it('con skipUnauthorizedHandler: NO llama al handler, pero limpia y lanza 401', async () => {
    setToken('token-abc')
    setSlug('acme')
    const handler = vi.fn()
    setUnauthorizedHandler(handler)
    fetchMock.mockResolvedValue(mockResponse(401))

    await expect(
      apiGet('/me', { skipUnauthorizedHandler: true }),
    ).rejects.toMatchObject({ status: 401 })

    expect(handler).not.toHaveBeenCalled()
    expect(getToken()).toBeNull() // se limpió igual
  })
})
