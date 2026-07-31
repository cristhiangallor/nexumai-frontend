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

import type { PerfilResponse } from '@/core/api'
import { clearSession, setPerfil } from '@/core/session'

import { UsuarioDetallePage } from './UsuarioDetallePage'

function mockResponse(status: number, body?: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  }
}

// Catálogo DESORDENADO: la UI lo ordena → [Administrador (r1), RRHH (r2)].
const CATALOGO = [
  { id: 'r2', nombre: 'RRHH' },
  { id: 'r1', nombre: 'Administrador' },
]

const perfilConAsignar: PerfilResponse = {
  nombre: 'Jefa',
  correo: 'jefa@x.com',
  rol: 'ADMIN',
  estado: 'ACTIVO',
  empresa: 'Demo',
  sesionExpiraEn: '2026-08-01T00:00:00Z',
  permisos: ['usuario.ver', 'usuario.asignar_rol'],
}

let fetchMock: ReturnType<typeof vi.fn>

/**
 * Configura fetch con ESTADO de servidor: el rol del usuario es mutable, así el refetch
 * tras el 204 devuelve el rol nuevo. Devuelve el objeto de estado por si el test lo lee.
 */
function configurar(
  opciones: {
    rolInicial?: string | null
    catalogo?: unknown
    catalogoStatus?: number
    catalogoColgado?: boolean
    putStatus?: number
    putError?: boolean
  } = {},
) {
  const {
    rolInicial = 'RRHH',
    catalogo = CATALOGO,
    catalogoStatus = 200,
    catalogoColgado = false,
    putStatus = 204,
    putError = false,
  } = opciones
  const estado = { rol: rolInicial }
  fetchMock.mockImplementation((url: string, init?: RequestInit) => {
    const u = String(url)
    const metodo = init?.method ?? 'GET'
    if (u.includes('roles-asignables')) {
      if (catalogoColgado) return new Promise(() => {})
      return Promise.resolve(mockResponse(catalogoStatus, catalogo))
    }
    if (u.endsWith('/usuarios/u1/rol') && metodo === 'PUT') {
      if (putError) return Promise.reject(new Error('sin red'))
      if (putStatus === 204) {
        const body = JSON.parse(init!.body as string)
        const nuevo = CATALOGO.find((r) => r.id === body.rolId)
        if (nuevo) estado.rol = nuevo.nombre
      }
      return Promise.resolve(mockResponse(putStatus))
    }
    // Detalle del usuario (rol tomado del estado mutable).
    return Promise.resolve(
      mockResponse(200, {
        id: 'u1',
        nombre: 'Ana',
        email: 'ana@x.com',
        rol: estado.rol,
        estado: 'ACTIVO',
        createdAt: '2026-01-10T00:00:00Z',
      }),
    )
  })
  return estado
}

function crearCliente() {
  return new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
}

function renderDetalle(cliente = crearCliente()) {
  render(
    <QueryClientProvider client={cliente}>
      <MemoryRouter initialEntries={['/console/usuarios/u1']}>
        <Routes>
          <Route
            path="/console/usuarios/:usuarioId"
            element={<UsuarioDetallePage />}
          />
          <Route path="/console/usuarios" element={<p>listado</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return cliente
}

const combo = () => screen.getByRole('combobox') as HTMLSelectElement
const botonGuardar = () => screen.getByRole('button', { name: 'Guardar rol' })

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

describe('Asignar rol — visibilidad según permiso', () => {
  it('con usuario.asignar_rol: control editable, poblado y ordenado, rol actual preseleccionado', async () => {
    setPerfil(perfilConAsignar)
    configurar({ rolInicial: 'RRHH' })

    renderDetalle()

    await screen.findByRole('option', { name: 'Administrador' })
    // Rol actual (RRHH) está en el catálogo: sin opción "(rol actual)"; preseleccionado.
    expect(
      within(combo())
        .getAllByRole('option')
        .map((o) => o.textContent),
    ).toEqual(['Administrador', 'RRHH'])
    expect(combo().value).toBe('r2')
    expect(botonGuardar()).toBeDisabled()
  })

  it('sin el permiso: el rol se muestra como texto, sin control', async () => {
    setPerfil({ ...perfilConAsignar, permisos: ['usuario.ver'] })
    configurar({ rolInicial: 'RRHH' })

    renderDetalle()

    expect(await screen.findByText('RRHH')).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).toBeNull()
  })
})

describe('Asignar rol — habilitación de Guardar', () => {
  it('deshabilitado si el rol no cambió; habilitado si cambió', async () => {
    setPerfil(perfilConAsignar)
    configurar({ rolInicial: 'RRHH' })

    renderDetalle()
    await screen.findByRole('option', { name: 'Administrador' })

    expect(botonGuardar()).toBeDisabled()
    fireEvent.change(combo(), { target: { value: 'r1' } })
    expect(botonGuardar()).toBeEnabled()
    fireEvent.change(combo(), { target: { value: 'r2' } })
    expect(botonGuardar()).toBeDisabled()
  })
})

describe('Asignar rol — rol actual fuera del catálogo (D-2) y sin rol', () => {
  it('rol actual NO asignable: opción deshabilitada "(rol actual)" seleccionada; Guardar off hasta elegir', async () => {
    setPerfil(perfilConAsignar)
    configurar({ rolInicial: 'Director' }) // no está en el catálogo

    renderDetalle()
    await screen.findByRole('option', { name: 'Administrador' })

    const opcionActual = screen.getByRole('option', {
      name: 'Director (rol actual)',
    }) as HTMLOptionElement
    expect(opcionActual.disabled).toBe(true)
    expect(combo().value).toBe('__rol_actual__')
    expect(botonGuardar()).toBeDisabled()

    fireEvent.change(combo(), { target: { value: 'r1' } })
    expect(botonGuardar()).toBeEnabled()
  })

  it('rol null: placeholder "Sin rol asignado"; Guardar off hasta elegir', async () => {
    setPerfil(perfilConAsignar)
    configurar({ rolInicial: null })

    renderDetalle()
    await screen.findByRole('option', { name: 'Administrador' })

    const placeholder = screen.getByRole('option', {
      name: 'Sin rol asignado',
    }) as HTMLOptionElement
    expect(placeholder.disabled).toBe(true)
    expect(combo().value).toBe('')
    expect(botonGuardar()).toBeDisabled()

    fireEvent.change(combo(), { target: { value: 'r1' } })
    expect(botonGuardar()).toBeEnabled()
  })
})

describe('Asignar rol — mapeo de respuestas del PUT', () => {
  it('204 → banner inline, doble invalidación (lista Y detalle) y el select refleja el rol nuevo con Guardar off', async () => {
    setPerfil(perfilConAsignar)
    configurar({ rolInicial: 'RRHH' })
    const cliente = crearCliente()
    const invalidarSpy = vi.spyOn(cliente, 'invalidateQueries')

    renderDetalle(cliente)
    await screen.findByRole('option', { name: 'Administrador' })

    fireEvent.change(combo(), { target: { value: 'r1' } })
    fireEvent.click(botonGuardar())

    // Banner inline de éxito.
    expect(await screen.findByText('Rol actualizado.')).toBeInTheDocument()

    // El cuerpo del PUT lleva el rolId elegido.
    const put = fetchMock.mock.calls.find(
      (c) => (c[1]?.method ?? 'GET') === 'PUT',
    )
    expect(JSON.parse(put![1].body as string)).toEqual({ rolId: 'r1' })

    // Doble invalidación, ambas claves EXACTAS de useUsuarios.
    expect(invalidarSpy).toHaveBeenCalledWith({
      queryKey: ['usuarios', 'lista'],
    })
    expect(invalidarSpy).toHaveBeenCalledWith({
      queryKey: ['usuarios', 'detalle', 'u1'],
    })

    // Tras el refetch: el select refleja el rol NUEVO (Administrador) con Guardar
    // deshabilitado, y el banner SIGUE visible (estado independiente del refetch).
    await waitFor(() => expect(combo().value).toBe('r1'))
    expect(botonGuardar()).toBeDisabled()
    expect(screen.getByText('Rol actualizado.')).toBeInTheDocument()
  })

  it('403 → mensaje NEUTRO, sin insinuar permiso vs. jerarquía; conserva la selección', async () => {
    setPerfil(perfilConAsignar)
    configurar({ rolInicial: 'RRHH', putStatus: 403 })

    renderDetalle()
    await screen.findByRole('option', { name: 'Administrador' })

    fireEvent.change(combo(), { target: { value: 'r1' } })
    fireEvent.click(botonGuardar())

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent(
      'No se pudo cambiar el rol de este usuario.',
    )
    expect(
      screen.queryByText(/permiso|jerarqu|nivel|autoridad|superior/i),
    ).toBeNull()
    expect(combo().value).toBe('r1') // no pierde la selección
  })

  it('404 → mensaje neutro de no encontrado', async () => {
    setPerfil(perfilConAsignar)
    configurar({ rolInicial: 'RRHH', putStatus: 404 })

    renderDetalle()
    await screen.findByRole('option', { name: 'Administrador' })

    fireEvent.change(combo(), { target: { value: 'r1' } })
    fireEvent.click(botonGuardar())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No encontramos este usuario.',
    )
  })

  it('422 → error general sin perder la selección', async () => {
    setPerfil(perfilConAsignar)
    configurar({ rolInicial: 'RRHH', putStatus: 422 })

    renderDetalle()
    await screen.findByRole('option', { name: 'Administrador' })

    fireEvent.change(combo(), { target: { value: 'r1' } })
    fireEvent.click(botonGuardar())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo cambiar el rol. Inténtalo de nuevo.',
    )
    expect(combo().value).toBe('r1')
  })

  it('error de red → error general sin perder la selección', async () => {
    setPerfil(perfilConAsignar)
    configurar({ rolInicial: 'RRHH', putError: true })

    renderDetalle()
    await screen.findByRole('option', { name: 'Administrador' })

    fireEvent.change(combo(), { target: { value: 'r1' } })
    fireEvent.click(botonGuardar())

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo cambiar el rol. Inténtalo de nuevo.',
    )
    expect(combo().value).toBe('r1')
  })
})

describe('Asignar rol — estados del catálogo por destino', () => {
  it('cargando: control en carga y Guardar deshabilitado', async () => {
    setPerfil(perfilConAsignar)
    configurar({ catalogoColgado: true })

    renderDetalle()

    // El detalle cargó (correo visible) pero el catálogo sigue en curso.
    await screen.findByText('ana@x.com')
    expect(combo()).toBeDisabled()
    expect(
      screen.getByRole('option', { name: 'Cargando…' }),
    ).toBeInTheDocument()
    expect(botonGuardar()).toBeDisabled()
  })

  it('error 500/red al cargar el catálogo: EstadoError con reintento', async () => {
    setPerfil(perfilConAsignar)
    configurar({ catalogoStatus: 500 })

    renderDetalle()

    expect(
      await screen.findByText(/No se pudo cargar el cambio de rol/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Reintentar' }),
    ).toBeInTheDocument()
  })

  it('403/404 al cargar el catálogo: mensaje neutro, SIN reintento', async () => {
    setPerfil(perfilConAsignar)
    configurar({ catalogoStatus: 403 })

    renderDetalle()

    expect(
      await screen.findByText('No se puede cambiar el rol de este usuario.'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull()
  })
})
