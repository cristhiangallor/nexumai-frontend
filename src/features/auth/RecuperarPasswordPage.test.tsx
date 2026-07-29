import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RecuperarPasswordPage } from './RecuperarPasswordPage'

function mockResponse(status: number, body?: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  }
}

let fetchMock: ReturnType<typeof vi.fn>

function renderPagina(ruta = '/acme/recuperar') {
  const cliente = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={cliente}>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="/:slug/recuperar" element={<RecuperarPasswordPage />} />
          <Route path="/:slug/login" element={<p>login</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
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

describe('RecuperarPasswordPage', () => {
  it('envía { slug, email } al endpoint anónimo (sin Bearer)', async () => {
    fetchMock.mockResolvedValue(mockResponse(202))

    renderPagina()

    fireEvent.change(screen.getByLabelText('Correo'), {
      target: { value: 'ana@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }))

    await screen.findByRole('status')

    expect(fetchMock.mock.calls[0][0]).toBe(
      'https://api.test/password/recuperacion',
    )
    const init = fetchMock.mock.calls[0][1]
    expect(JSON.parse(init.body as string)).toEqual({
      slug: 'acme',
      email: 'ana@example.com',
    })
    // Endpoint anónimo: no adjunta Authorization.
    expect(init.headers.Authorization).toBeUndefined()
  })

  it('muestra la confirmación UNIFORME y no revela si la cuenta existe', async () => {
    fetchMock.mockResolvedValue(mockResponse(202))

    renderPagina()

    fireEvent.change(screen.getByLabelText('Correo'), {
      target: { value: 'ana@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }))

    const confirmacion = await screen.findByRole('status')
    expect(confirmacion).toHaveTextContent(
      'Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña.',
    )
    // No revela existencia ni hace eco del correo.
    expect(
      screen.queryByText(/no existe|no está registrad|cuenta no|no encontr/i),
    ).toBeNull()
    expect(screen.queryByText(/ana@example\.com/)).toBeNull()
  })

  it('exige un correo válido antes de llamar a la API (validación de experiencia)', async () => {
    renderPagina()

    fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }))
    expect(await screen.findByText('El correo es obligatorio')).toBeVisible()

    fireEvent.change(screen.getByLabelText('Correo'), {
      target: { value: 'no-es-correo' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }))
    expect(await screen.findByText('Ingresa un correo válido')).toBeVisible()

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('ante un error de red, comunica sin bloquear (banner genérico, el formulario sigue)', async () => {
    fetchMock.mockRejectedValue(new Error('sin red'))

    renderPagina()

    fireEvent.change(screen.getByLabelText('Correo'), {
      target: { value: 'ana@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }))

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent(/No se pudo enviar la solicitud/)
    // El formulario sigue disponible para reintentar.
    expect(screen.getByLabelText('Correo')).toBeInTheDocument()
  })

  it('no registra el correo (PII) en consola', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(
      (m) => vi.spyOn(console, m).mockImplementation(() => {}),
    )
    fetchMock.mockResolvedValue(mockResponse(202))

    renderPagina()

    fireEvent.change(screen.getByLabelText('Correo'), {
      target: { value: 'ana@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Enviar enlace' }))
    await screen.findByRole('status')

    const seFiltro = spies.some((spy) =>
      spy.mock.calls.some((call) =>
        JSON.stringify(call).includes('ana@example.com'),
      ),
    )
    expect(seFiltro).toBe(false)
  })
})
