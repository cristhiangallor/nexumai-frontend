import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getPerfil, getToken } from '@/core/session'

import { LoginPage } from './LoginPage'

/** Respuesta mínima con la forma que consume el cliente HTTP central. */
function mockResponse(status: number, body?: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  }
}

const perfilDemo = {
  nombre: 'Ana López',
  correo: 'ana@example.com',
  rol: 'RRHH',
  estado: 'ACTIVO' as const,
  empresa: 'Razón Social Demo',
  sesionExpiraEn: '2026-07-24T20:00:00Z',
  permisos: ['usuario.ver_propio'],
}

let fetchMock: ReturnType<typeof vi.fn>

function renderLogin(ruta = '/acme/login') {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="/:slug/login" element={<LoginPage />} />
          <Route
            path="/inicio"
            element={<p>Destino provisional tras login</p>}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

/** Rellena correo + contraseña con valores válidos. */
function llenarCredencialesValidas() {
  fireEvent.change(screen.getByLabelText('Correo'), {
    target: { value: 'ana@example.com' },
  })
  fireEvent.change(screen.getByLabelText('Contraseña'), {
    target: { value: 'secreto123' },
  })
}

function enviar() {
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }))
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

describe('LoginPage — accesibilidad y estructura', () => {
  it('expone los campos por su label y un botón de envío; enfoca el correo', () => {
    renderLogin()

    expect(screen.getByLabelText('Correo')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Iniciar sesión' }),
    ).toBeInTheDocument()
    // El slug no es un campo del formulario (viene de la ruta).
    expect(screen.queryByLabelText(/empresa|tenant|slug/i)).toBeNull()
    expect(screen.getByLabelText('Correo')).toHaveFocus()
  })
})

describe('LoginPage — validación de experiencia', () => {
  it('exige correo y contraseña, y no llama a la API', async () => {
    renderLogin()

    enviar()

    expect(await screen.findByText('El correo es obligatorio')).toBeVisible()
    expect(screen.getByText('La contraseña es obligatoria')).toBeVisible()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rechaza un correo mal formado', async () => {
    renderLogin()

    fireEvent.change(screen.getByLabelText('Correo'), {
      target: { value: 'no-es-correo' },
    })
    fireEvent.change(screen.getByLabelText('Contraseña'), {
      target: { value: 'secreto123' },
    })
    enviar()

    expect(await screen.findByText('Ingresa un correo válido')).toBeVisible()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('LoginPage — 401 anti-enumeración', () => {
  it('muestra un único mensaje genérico y no revela el motivo', async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(401))
    renderLogin()

    llenarCredencialesValidas()
    enviar()

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('Correo o contraseña incorrectos')
    // No debe filtrar si el correo/tenant existe o si la cuenta está inactiva.
    expect(
      screen.queryByText(/no existe|inactiv|desactivad|tenant|empresa/i),
    ).toBeNull()
    // Solo se intentó /login; nunca se llegó a /me.
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('LoginPage — estado de carga', () => {
  it('deshabilita el botón mientras el envío está en curso', async () => {
    let resolverLogin: (value: unknown) => void = () => {}
    fetchMock
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolverLogin = resolve
        }),
      )
      .mockResolvedValueOnce(mockResponse(200, perfilDemo))
    renderLogin()

    llenarCredencialesValidas()
    enviar()

    const botonCargando = await screen.findByRole('button', {
      name: 'Iniciando sesión…',
    })
    expect(botonCargando).toBeDisabled()

    // Se resuelve el flujo para no dejar promesas colgando.
    resolverLogin(mockResponse(200, { token: 'token-abc' }))
    expect(
      await screen.findByText('Destino provisional tras login'),
    ).toBeVisible()
  })
})

describe('LoginPage — flujo de éxito', () => {
  it('login → /me → guarda sesión → redirige al placeholder', async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse(200, { token: 'token-abc' }))
      .mockResolvedValueOnce(mockResponse(200, perfilDemo))
    renderLogin('/acme/login')

    llenarCredencialesValidas()
    enviar()

    expect(
      await screen.findByText('Destino provisional tras login'),
    ).toBeInTheDocument()

    // El slug de la ruta viaja en el request de /login.
    const cuerpoLogin = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(cuerpoLogin).toEqual({
      slug: 'acme',
      email: 'ana@example.com',
      password: 'secreto123',
    })
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.test/login')
    expect(fetchMock.mock.calls[1][0]).toBe('https://api.test/me')

    // Sesión guardada por el módulo de sesión.
    expect(getToken()).toBe('token-abc')
    expect(getPerfil()).toEqual(perfilDemo)
  })

  it('si /me falla tras el login, limpia la sesión y no redirige', async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse(200, { token: 'token-abc' }))
      .mockResolvedValueOnce(mockResponse(500))
    renderLogin()

    llenarCredencialesValidas()
    enviar()

    // Muestra error genérico y permanece en el login (no hay token huérfano).
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.queryByText('Destino provisional tras login')).toBeNull()
    expect(getToken()).toBeNull()
    expect(getPerfil()).toBeNull()
  })
})
