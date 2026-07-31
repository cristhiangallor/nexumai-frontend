import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { PerfilResponse, UsuarioResumen } from '@/core/api'
import { RutaProtegida } from '@/core/permissions'
import { clearSession, setPerfil } from '@/core/session'

import { UsuariosPage } from './UsuariosPage'

/** Respuesta con cabeceras (para X-Total-Count) como la consume el cliente HTTP. */
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

const usuarios: UsuarioResumen[] = [
  {
    id: 'u1',
    nombre: 'Ana López',
    email: 'ana@x.com',
    rol: 'RRHH',
    estado: 'ACTIVO',
    createdAt: '2026-01-10T00:00:00Z',
  },
  {
    id: 'u2',
    nombre: 'Beto Ruiz',
    email: 'beto@x.com',
    rol: null,
    estado: 'INVITADO',
    createdAt: '2026-02-20T00:00:00Z',
  },
]

const perfilSinVer: PerfilResponse = {
  nombre: 'Cara Solo',
  correo: 'cara@x.com',
  rol: 'COLABORADOR',
  estado: 'ACTIVO',
  empresa: 'Demo',
  sesionExpiraEn: '2026-07-30T00:00:00Z',
  permisos: ['usuario.ver_propio'], // NO tiene usuario.ver
}

/** Deriva un perfil con la lista de permisos indicada. */
function perfilCon(permisos: string[]): PerfilResponse {
  return { ...perfilSinVer, permisos }
}

let fetchMock: ReturnType<typeof vi.fn>

function crearCliente() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

function renderListado(entrada = '/console/usuarios') {
  return render(
    <QueryClientProvider client={crearCliente()}>
      <MemoryRouter initialEntries={[entrada]}>
        <Routes>
          <Route path="/console/usuarios" element={<UsuariosPage />} />
          <Route path="/console/usuarios/:usuarioId" element={<p>detalle</p>} />
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
  clearSession()
  localStorage.clear()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('UsuariosPage — listado', () => {
  it('renderiza una fila por usuario, con enlace al detalle usando el id del contrato', async () => {
    fetchMock.mockResolvedValue(
      mockResponse(200, usuarios, { 'X-Total-Count': '2' }),
    )

    renderListado()

    const tabla = await screen.findByRole('table')
    // Encabezado + 2 filas de datos.
    expect(within(tabla).getAllByRole('row')).toHaveLength(3)
    expect(
      within(tabla).getByRole('link', { name: 'Ana López' }),
    ).toHaveAttribute('href', '/console/usuarios/u1')
  })

  it('con rol null muestra la ausencia ("Sin rol asignado"), no una celda vacía', async () => {
    fetchMock.mockResolvedValue(
      mockResponse(200, usuarios, { 'X-Total-Count': '2' }),
    )

    renderListado()

    await screen.findByRole('table')
    expect(screen.getAllByText('Sin rol asignado').length).toBeGreaterThan(0)
  })
})

describe('UsuariosPage — filtros y orden (estado en la URL)', () => {
  it('filtrar emite el parámetro y RESETEA a la página 1', async () => {
    fetchMock.mockResolvedValue(
      mockResponse(200, usuarios, { 'X-Total-Count': '40' }),
    )

    renderListado('/console/usuarios?page=2')
    await screen.findByRole('table')

    fireEvent.change(screen.getByLabelText('Nombre'), {
      target: { value: 'ana' },
    })

    await waitFor(() => {
      const url = new URL(fetchMock.mock.calls.at(-1)![0] as string)
      expect(url.searchParams.get('nombre')).toBe('ana')
      expect(url.searchParams.get('page')).toBe('0') // reseteo a la primera
    })
  })

  it('ordenar por un encabezado emite el sort correcto; rol NO es ordenable', async () => {
    fetchMock.mockResolvedValue(
      mockResponse(200, usuarios, { 'X-Total-Count': '2' }),
    )

    renderListado()
    const tabla = await screen.findByRole('table')

    // `rol` no tiene botón de orden (encabezado inerte a propósito).
    expect(within(tabla).queryByRole('button', { name: 'Rol' })).toBeNull()

    fireEvent.click(within(tabla).getByRole('button', { name: 'Nombre' }))

    await waitFor(() => {
      const url = new URL(fetchMock.mock.calls.at(-1)![0] as string)
      expect(url.searchParams.get('sort')).toBe('nombre,asc')
    })
  })

  it('un sort inválido en la URL (rol) se descarta: se pide el orden por defecto, no un 400', async () => {
    fetchMock.mockResolvedValue(
      mockResponse(200, usuarios, { 'X-Total-Count': '2' }),
    )

    renderListado('/console/usuarios?sort=rol,asc')
    await screen.findByRole('table')

    const url = new URL(fetchMock.mock.calls[0][0] as string)
    expect(url.searchParams.get('sort')).toBe('createdAt,desc')
  })
})

describe('UsuariosPage — paginación', () => {
  it('usa X-Total-Count para el total y numerar las páginas', async () => {
    fetchMock.mockResolvedValue(
      mockResponse(200, usuarios, { 'X-Total-Count': '45' }),
    )

    renderListado()
    await screen.findByRole('table')

    expect(screen.getByText(/de 45/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Página 2' })).toBeInTheDocument()
  })
})

describe('UsuariosPage — los cinco estados de UI', () => {
  it('carga: muestra el skeleton (rol "status" oculto "Cargando…")', () => {
    fetchMock.mockReturnValue(new Promise(() => {})) // nunca resuelve

    renderListado()

    expect(screen.getAllByText('Cargando…').length).toBeGreaterThan(0)
  })

  it('vacío genuino (sin filtros): muestra "Aún no hay usuarios"', async () => {
    fetchMock.mockResolvedValue(mockResponse(200, [], { 'X-Total-Count': '0' }))

    renderListado()

    expect(await screen.findByText('Aún no hay usuarios')).toBeInTheDocument()
  })

  it('sin resultados de filtro: variante distinta + acción de limpiar', async () => {
    fetchMock.mockResolvedValue(mockResponse(200, [], { 'X-Total-Count': '5' }))

    renderListado('/console/usuarios?nombre=zzz')

    expect(
      await screen.findByText(/Ningún usuario coincide/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Limpiar filtros' }),
    ).toBeInTheDocument()
  })

  it('error: EstadoError con reintento (no AccesoDenegado)', async () => {
    fetchMock.mockResolvedValue(mockResponse(500))

    renderListado()

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent(/No se pudo cargar la lista/)
    expect(
      screen.getByRole('button', { name: 'Reintentar' }),
    ).toBeInTheDocument()
  })

  it('sin permiso: el guard muestra AccesoDenegado y NO se llama a la API', async () => {
    setPerfil(perfilSinVer)

    render(
      <QueryClientProvider client={crearCliente()}>
        <MemoryRouter initialEntries={['/console/usuarios']}>
          <Routes>
            <Route
              path="/console/usuarios"
              element={
                <RutaProtegida clave="usuario.ver">
                  <UsuariosPage />
                </RutaProtegida>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(await screen.findByText('Acceso denegado')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('UsuariosPage — invitar (NEX-47)', () => {
  it('con usuario.invitar muestra el botón "Invitar usuario"', async () => {
    setPerfil(perfilCon(['usuario.ver', 'usuario.invitar']))
    fetchMock.mockResolvedValue(
      mockResponse(200, usuarios, { 'X-Total-Count': '2' }),
    )

    renderListado()

    await screen.findByRole('table')
    expect(
      screen.getByRole('button', { name: 'Invitar usuario' }),
    ).toBeInTheDocument()
  })

  it('sin usuario.invitar NO renderiza el botón (oculto, no deshabilitado)', async () => {
    setPerfil(perfilCon(['usuario.ver']))
    fetchMock.mockResolvedValue(
      mockResponse(200, usuarios, { 'X-Total-Count': '2' }),
    )

    renderListado()

    await screen.findByRole('table')
    expect(screen.queryByRole('button', { name: 'Invitar usuario' })).toBeNull()
  })

  it('muestra el aviso de invitación enviada desde location.state', async () => {
    fetchMock.mockResolvedValue(
      mockResponse(200, usuarios, { 'X-Total-Count': '2' }),
    )

    render(
      <QueryClientProvider client={crearCliente()}>
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/console/usuarios',
              state: { avisoInvitacionEnviada: 'ana@x.com' },
            },
          ]}
        >
          <Routes>
            <Route path="/console/usuarios" element={<UsuariosPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(
      await screen.findByText('Invitación enviada a ana@x.com.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Invitación enviada a ana@x.com.')).toHaveAttribute(
      'role',
      'status',
    )
  })
})
