import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ActivarCuentaPage } from './ActivarCuentaPage'

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
    avisoCuentaActivada?: boolean
    avisoPasswordActualizada?: boolean
  } | null
  if (state?.avisoCuentaActivada) return <p>login: cuenta-activada</p>
  if (state?.avisoPasswordActualizada) return <p>login: password-actualizada</p>
  return <p>login</p>
}

let fetchMock: ReturnType<typeof vi.fn>

function renderPagina(ruta = '/acme/activar?token=tok-abc') {
  const cliente = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={cliente}>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="/:slug/activar" element={<ActivarCuentaPage />} />
          <Route path="/:slug/login" element={<LoginStub />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function escribirPassword(valor: string) {
  fireEvent.change(screen.getByLabelText('Nueva contraseña'), {
    target: { value: valor },
  })
}

function boton() {
  return screen.getByRole('button', { name: 'Activar cuenta' })
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

describe('ActivarCuentaPage — monta el formulario compartido con el copy de activación', () => {
  it('muestra el copy de activación y toma el token del query param al enviar', async () => {
    fetchMock.mockResolvedValue(mockResponse(204))

    renderPagina()

    expect(
      screen.getByRole('heading', { name: 'Activa tu cuenta' }),
    ).toBeInTheDocument()
    expect(boton()).toBeInTheDocument()

    escribirPassword('passphrase-larga-1')
    fireEvent.click(boton())

    await screen.findByText('login: cuenta-activada')

    expect(fetchMock.mock.calls[0][0]).toBe('https://api.test/password')
    const init = fetchMock.mock.calls[0][1]
    expect(JSON.parse(init.body as string)).toEqual({
      slug: 'acme',
      token: 'tok-abc',
      password: 'passphrase-larga-1',
    })
    // Endpoint anónimo: sin Authorization.
    expect(init.headers.Authorization).toBeUndefined()
  })

  it('feedback de longitud heredado: 11 no basta, 12 sí', () => {
    fetchMock.mockResolvedValue(mockResponse(204))

    renderPagina()

    escribirPassword('abcdefghijk') // 11
    expect(boton()).toBeDisabled()
    escribirPassword('abcdefghijkl') // 12
    expect(boton()).toBeEnabled()
  })
})

describe('ActivarCuentaPage — mapeo de respuestas', () => {
  it('204 → navega a login con avisoCuentaActivada (no password) y SIN auto-login', async () => {
    fetchMock.mockResolvedValue(mockResponse(204))

    renderPagina()

    escribirPassword('passphrase-larga-1')
    fireEvent.click(boton())

    // Clave PROPIA de activación, no la de recuperación.
    expect(
      await screen.findByText('login: cuenta-activada'),
    ).toBeInTheDocument()
    expect(screen.queryByText('login: password-actualizada')).toBeNull()
    // Sin auto-login: una sola llamada (POST /password), no una segunda de sesión.
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('422 → remite al administrador y NO ofrece auto-reenvío (sin enlace)', async () => {
    fetchMock.mockResolvedValue(mockResponse(422))

    renderPagina()

    escribirPassword('passphrase-larga-1')
    fireEvent.click(boton())

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent(
      'Este enlace de activación ya no es válido. Pide a tu administrador que te reenvíe la invitación.',
    )
    // Aserción NEGATIVA: no hay acción de auto-reenvío (el invitado no puede).
    expect(
      screen.queryByRole('link', { name: 'Solicitar un enlace nuevo' }),
    ).toBeNull()
    expect(screen.queryByText(/solicita.*enlace/i)).toBeNull()
  })

  it('400 → mensaje de política heredado (mínimo 12 caracteres)', async () => {
    fetchMock.mockResolvedValue(mockResponse(400, 'texto técnico del backend'))

    renderPagina()

    escribirPassword('passphrase-larga-1')
    fireEvent.click(boton())

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent(
      'La contraseña debe tener al menos 12 caracteres.',
    )
    expect(screen.queryByText(/texto técnico del backend/)).toBeNull()
  })
})

describe('ActivarCuentaPage — sin PII ni token en logs', () => {
  it('no registra el token ni la contraseña en consola', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(
      (m) => vi.spyOn(console, m).mockImplementation(() => {}),
    )
    fetchMock.mockResolvedValue(mockResponse(204))

    renderPagina()

    escribirPassword('passphrase-larga-1')
    fireEvent.click(boton())
    await screen.findByText('login: cuenta-activada')

    const filtra = (secreto: string) =>
      spies.some((spy) =>
        spy.mock.calls.some((call) => JSON.stringify(call).includes(secreto)),
      )
    expect(filtra('tok-abc')).toBe(false)
    expect(filtra('passphrase-larga-1')).toBe(false)
  })
})
