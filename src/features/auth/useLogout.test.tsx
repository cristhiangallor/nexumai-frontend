import { act, fireEvent, render, screen } from '@testing-library/react'
import {
  createMemoryRouter,
  RouterProvider,
  useLocation,
  useParams,
} from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { PerfilResponse } from '@/core/api'
import { setUnauthorizedHandler } from '@/core/http'
import { RutaProtegida } from '@/core/permissions'
import {
  clearSession,
  getPerfil,
  getSlug,
  getToken,
  setPerfil,
  setSlug,
  setToken,
} from '@/core/session'

import { type EstadoAvisoCierreSesion, useLogout } from './useLogout'

/** Respuesta mínima con la forma que consume el cliente HTTP. */
function mockResponse(status: number, body?: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  }
}

function perfilCon(permisos: string[]): PerfilResponse {
  return {
    nombre: 'Ana López',
    correo: 'ana@example.com',
    rol: 'RRHH',
    estado: 'ACTIVO',
    empresa: 'Razón Social Demo',
    sesionExpiraEn: '2026-07-25T20:00:00Z',
    permisos,
  }
}

/** Botón que dispara el cierre de sesión, con el mismo cableado que el menú de usuario. */
function Disparador() {
  const { cerrarSesion, cerrandoSesion } = useLogout()
  return (
    <button type="button" onClick={cerrarSesion} disabled={cerrandoSesion}>
      {cerrandoSesion ? 'Cerrando sesión…' : 'Cerrar sesión'}
    </button>
  )
}

/** Pantalla de login falsa: muestra el slug de la ruta y el aviso de `location.state`. */
function PantallaLogin() {
  const { slug } = useParams()
  const location = useLocation()
  const aviso = (location.state as EstadoAvisoCierreSesion | null)
    ?.avisoCierreSesion
  return (
    <div>
      <p>login de {slug}</p>
      {aviso && <p role="status">aviso de cierre</p>}
    </div>
  )
}

function montar(entrada = '/inicio') {
  const router = createMemoryRouter(
    [
      { path: '/inicio', element: <Disparador /> },
      { path: '/:slug/login', element: <PantallaLogin /> },
      { path: '/', element: <p>landing pública</p> },
    ],
    { initialEntries: [entrada] },
  )
  return render(<RouterProvider router={router} />)
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

describe('useLogout — flujo de cierre de sesión', () => {
  it('llama a POST /logout, limpia la sesión y redirige conservando el slug', async () => {
    setToken('token-abc')
    setSlug('acme')
    setPerfil(perfilCon(['usuario.ver_propio']))
    fetchMock.mockResolvedValue(mockResponse(200))

    montar()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    // Redirige a /:slug/login conservando el slug.
    expect(await screen.findByText('login de acme')).toBeInTheDocument()
    // Llamó al endpoint correcto por POST.
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.test/logout')
    expect(fetchMock.mock.calls[0][1].method).toBe('POST')
    // Limpió toda la sesión.
    expect(getToken()).toBeNull()
    expect(getPerfil()).toBeNull()
    expect(getSlug()).toBeNull()
    // 200 → sin aviso.
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('un 401 NO produce aviso y sí limpia la sesión (sesión ya invalidada)', async () => {
    setToken('token-abc')
    setSlug('acme')
    setPerfil(perfilCon(['usuario.ver_propio']))
    fetchMock.mockResolvedValue(mockResponse(401))

    montar()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    // La redirección conserva el slug (→ /:slug/login, NO /), aunque el 401 dispare
    // clearSession dentro de core/http: el slug se capturó ANTES de la petición.
    expect(await screen.findByText('login de acme')).toBeInTheDocument()
    expect(screen.queryByText('landing pública')).toBeNull()
    expect(screen.queryByRole('status')).toBeNull()
    // El almacenamiento se limpió (incl. el slug); la redirección usó el capturado.
    expect(getToken()).toBeNull()
    expect(getSlug()).toBeNull()
  })

  it('un fallo de red limpia la sesión igual y produce el aviso', async () => {
    setToken('token-abc')
    setSlug('acme')
    setPerfil(perfilCon(['usuario.ver_propio']))
    fetchMock.mockRejectedValue(new TypeError('fallo de red'))

    montar()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(await screen.findByText('login de acme')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('aviso de cierre')
    expect(getToken()).toBeNull()
  })

  it('sin slug (sesión previa a NEX-44) redirige a "/" sin fallar', async () => {
    setToken('token-abc')
    setPerfil(perfilCon(['usuario.ver_propio']))
    // Sin setSlug → getSlug() es null.
    fetchMock.mockResolvedValue(mockResponse(200))

    montar()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(await screen.findByText('landing pública')).toBeInTheDocument()
    expect(getToken()).toBeNull()
  })

  it('muestra estado de carga y evita el doble disparo (una sola petición)', async () => {
    setToken('token-abc')
    setSlug('acme')
    setPerfil(perfilCon(['usuario.ver_propio']))
    let resolver: (value: unknown) => void = () => {}
    fetchMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolver = resolve
      }),
    )

    montar()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    // Estado de carga: botón deshabilitado con texto de progreso.
    const cargando = await screen.findByRole('button', {
      name: 'Cerrando sesión…',
    })
    expect(cargando).toBeDisabled()
    // Segundo disparo ignorado (deshabilitado + guarda por ref).
    fireEvent.click(cargando)

    await act(async () => {
      resolver(mockResponse(200))
    })
    expect(await screen.findByText('login de acme')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('un segundo logout (sesión ya cerrada) no rompe la UI', async () => {
    // Sin token/slug (como tras un primer logout); el backend responde 401.
    setPerfil(perfilCon(['usuario.ver_propio']))
    fetchMock.mockResolvedValue(mockResponse(401))

    montar()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    // Sin slug → "/", sin aviso (401), sin excepción.
    expect(await screen.findByText('landing pública')).toBeInTheDocument()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('tras limpiar la sesión (efecto del logout), una ruta protegida queda bloqueada', () => {
    setPerfil(perfilCon(['usuario.ver_propio']))

    render(
      <RutaProtegida clave="usuario.ver_propio">
        <p>contenido privado</p>
      </RutaProtegida>,
    )
    expect(screen.getByText('contenido privado')).toBeInTheDocument()

    // clearSession es lo que el servicio de logout ejecuta en TODOS los caminos.
    act(() => {
      clearSession()
    })

    expect(
      screen.getByRole('heading', { name: 'Acceso denegado' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('contenido privado')).toBeNull()
  })

  it('un 401 voluntario NO dispara el handler global (skip) ni doble redirección', async () => {
    setToken('token-abc')
    setSlug('acme')
    setPerfil(perfilCon(['usuario.ver_propio']))
    const handlerGlobal = vi.fn()
    setUnauthorizedHandler(handlerGlobal)
    fetchMock.mockResolvedValue(mockResponse(401))

    montar()
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    // Redirige una sola vez a /:slug/login; el skip evitó el handler global de
    // sesión expirada.
    expect(await screen.findByText('login de acme')).toBeInTheDocument()
    expect(handlerGlobal).not.toHaveBeenCalled()
    expect(getToken()).toBeNull()
  })
})
