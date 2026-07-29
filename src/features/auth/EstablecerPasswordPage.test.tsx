import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { EstablecerPasswordPage } from './EstablecerPasswordPage'

function mockResponse(status: number, body?: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  }
}

/** Stub del login que revela la clave de aviso recibida por `location.state`. */
function LoginStub() {
  const state = useLocation().state as {
    avisoPasswordActualizada?: boolean
  } | null
  return (
    <p>{state?.avisoPasswordActualizada ? 'login: aviso-password' : 'login'}</p>
  )
}

let fetchMock: ReturnType<typeof vi.fn>

function renderPagina(ruta = '/acme/establecer-password?token=tok-123') {
  const cliente = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={cliente}>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route
            path="/:slug/establecer-password"
            element={<EstablecerPasswordPage />}
          />
          <Route
            path="/:slug/recuperar"
            element={<p>solicitar recuperación</p>}
          />
          <Route path="/:slug/login" element={<LoginStub />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

/** Escribe una contraseña en el campo. */
function escribirPassword(valor: string) {
  fireEvent.change(screen.getByLabelText('Nueva contraseña'), {
    target: { value: valor },
  })
}

function boton() {
  return screen.getByRole('button', { name: 'Guardar contraseña' })
}

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

describe('EstablecerPasswordPage — feedback de longitud (solo longitud, NEX-38)', () => {
  it('11 caracteres no basta (botón deshabilitado); 12 sí lo habilita', () => {
    renderPagina()

    escribirPassword('abcdefghijk') // 11
    expect(boton()).toBeDisabled()

    escribirPassword('abcdefghijkl') // 12
    expect(boton()).toBeEnabled()
  })

  it('una passphrase de solo minúsculas de 15 caracteres es VÁLIDA', () => {
    renderPagina()

    escribirPassword('correcto caballo') // 16 chars, minúsculas + espacio
    expect(boton()).toBeEnabled()
  })
})

describe('EstablecerPasswordPage — envío y mapeo de respuestas', () => {
  it('el token del query param llega al cuerpo, junto a slug y password (anónimo)', async () => {
    fetchMock.mockResolvedValue(mockResponse(204))

    renderPagina()

    escribirPassword('passphrase-larga-1')
    fireEvent.click(boton())

    await screen.findByText('login: aviso-password')

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.test/password')
    const init = fetchMock.mock.calls[0][1]
    expect(JSON.parse(init.body as string)).toEqual({
      slug: 'acme',
      token: 'tok-123',
      password: 'passphrase-larga-1',
    })
    expect(init.headers.Authorization).toBeUndefined()
  })

  it('204 → éxito: navega al login con el aviso propio de recuperación', async () => {
    fetchMock.mockResolvedValue(mockResponse(204))

    renderPagina()

    escribirPassword('passphrase-larga-1')
    fireEvent.click(boton())

    expect(await screen.findByText('login: aviso-password')).toBeInTheDocument()
  })

  it('422 → token inválido/expirado/usado, con opción de solicitar un enlace nuevo', async () => {
    fetchMock.mockResolvedValue(mockResponse(422))

    renderPagina()

    escribirPassword('passphrase-larga-1')
    fireEvent.click(boton())

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent(
      'El enlace es inválido, expiró o ya se usó.',
    )
    const enlace = screen.getByRole('link', {
      name: 'Solicitar un enlace nuevo',
    })
    expect(enlace).toHaveAttribute('href', '/acme/recuperar')
  })

  it('400 → mensaje de política propio es-MX (mínimo 12 caracteres)', async () => {
    fetchMock.mockResolvedValue(mockResponse(400, 'texto técnico del backend'))

    renderPagina()

    escribirPassword('passphrase-larga-1')
    fireEvent.click(boton())

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent(
      'La contraseña debe tener al menos 12 caracteres.',
    )
    // No se pinta el cuerpo crudo del backend.
    expect(screen.queryByText(/texto técnico del backend/)).toBeNull()
  })

  it('error de red: comunica sin bloquear', async () => {
    fetchMock.mockRejectedValue(new Error('sin red'))

    renderPagina()

    escribirPassword('passphrase-larga-1')
    fireEvent.click(boton())

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent(/No se pudo actualizar la contraseña/)
  })

  it('no registra el token ni la contraseña (secretos) en consola', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(
      (m) => vi.spyOn(console, m).mockImplementation(() => {}),
    )
    fetchMock.mockResolvedValue(mockResponse(204))

    renderPagina()

    escribirPassword('passphrase-larga-1')
    fireEvent.click(boton())
    await screen.findByText('login: aviso-password')

    const filtra = (secreto: string) =>
      spies.some((spy) =>
        spy.mock.calls.some((call) => JSON.stringify(call).includes(secreto)),
      )
    expect(filtra('tok-123')).toBe(false)
    expect(filtra('passphrase-larga-1')).toBe(false)
  })
})
