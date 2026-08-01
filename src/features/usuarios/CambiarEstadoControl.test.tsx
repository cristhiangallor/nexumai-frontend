import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { EstadoUsuario, PerfilResponse } from '@/core/api'
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

const perfilCambiarEstado: PerfilResponse = {
  nombre: 'Jefa',
  correo: 'jefa@x.com',
  rol: 'ADMIN',
  estado: 'ACTIVO',
  empresa: 'Demo',
  sesionExpiraEn: '2026-08-01T00:00:00Z',
  // Sin usuario.asignar_rol: el rol se muestra como texto (no pide catálogo).
  permisos: ['usuario.ver', 'usuario.cambiar_estado'],
}

let fetchMock: ReturnType<typeof vi.fn>

/**
 * Fetch con ESTADO de servidor mutable: el PUT /estado lo actualiza y el refetch del
 * detalle lo refleja (badge nuevo).
 */
function configurar(
  opciones: {
    estadoInicial?: EstadoUsuario
    putStatus?: number
    putError?: boolean
  } = {},
) {
  const {
    estadoInicial = 'ACTIVO',
    putStatus = 204,
    putError = false,
  } = opciones
  const estado = { valor: estadoInicial as EstadoUsuario }
  fetchMock.mockImplementation((url: string, init?: RequestInit) => {
    const u = String(url)
    const metodo = init?.method ?? 'GET'
    if (u.endsWith('/usuarios/u1/estado') && metodo === 'PUT') {
      if (putError) return Promise.reject(new Error('sin red'))
      if (putStatus === 204) {
        const body = JSON.parse(init!.body as string)
        estado.valor = body.estado
      }
      return Promise.resolve(mockResponse(putStatus))
    }
    return Promise.resolve(
      mockResponse(200, {
        id: 'u1',
        nombre: 'Ana',
        email: 'ana@x.com',
        rol: 'RRHH',
        estado: estado.valor,
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

const btn = (name: string) => screen.getByRole('button', { name })
const queryBtn = (name: string) => screen.queryByRole('button', { name })

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

describe('Cambiar estado — visibilidad según estado y permiso', () => {
  it('sin usuario.cambiar_estado: no hay control (el badge sí se ve)', async () => {
    setPerfil({ ...perfilCambiarEstado, permisos: ['usuario.ver'] })
    configurar({ estadoInicial: 'ACTIVO' })

    renderDetalle()

    expect(await screen.findByText('Activo')).toBeInTheDocument() // badge
    expect(queryBtn('Desactivar')).toBeNull()
    expect(queryBtn('Reactivar')).toBeNull()
  })

  it('INVITADO: no se ofrece control de estado, solo la nota', async () => {
    setPerfil(perfilCambiarEstado)
    configurar({ estadoInicial: 'INVITADO' })

    renderDetalle()

    expect(
      await screen.findByText('Pendiente de aceptar la invitación.'),
    ).toBeInTheDocument()
    expect(queryBtn('Desactivar')).toBeNull()
    expect(queryBtn('Reactivar')).toBeNull()
  })
})

describe('Cambiar estado — desactivar (confirmación en dos pasos)', () => {
  it('ACTIVO muestra "Desactivar"; al pulsarlo aparece la confirmación con foco en Cancelar', async () => {
    setPerfil(perfilCambiarEstado)
    configurar({ estadoInicial: 'ACTIVO' })

    renderDetalle()
    fireEvent.click(await screen.findByRole('button', { name: 'Desactivar' }))

    expect(
      screen.getByText(
        '¿Desactivar a este usuario? Perderá el acceso de inmediato.',
      ),
    ).toBeInTheDocument()
    expect(btn('Sí, desactivar')).toBeInTheDocument()
    // Foco en la acción SEGURA al desplegar.
    expect(document.activeElement).toBe(btn('Cancelar'))
  })

  it('Cancelar no envía nada y DEVUELVE el foco al botón "Desactivar"', async () => {
    setPerfil(perfilCambiarEstado)
    configurar({ estadoInicial: 'ACTIVO' })

    renderDetalle()
    fireEvent.click(await screen.findByRole('button', { name: 'Desactivar' }))
    fireEvent.click(btn('Cancelar'))

    // Vuelve al botón inicial, con el foco (no perdido al body).
    expect(document.activeElement).toBe(btn('Desactivar'))
    expect(screen.queryByText(/Perderá el acceso de inmediato/)).toBeNull()
    // Ningún PUT.
    expect(
      fetchMock.mock.calls.some((c) => (c[1]?.method ?? 'GET') === 'PUT'),
    ).toBe(false)
  })

  it('Escape cancela la confirmación y devuelve el foco', async () => {
    setPerfil(perfilCambiarEstado)
    configurar({ estadoInicial: 'ACTIVO' })

    renderDetalle()
    fireEvent.click(await screen.findByRole('button', { name: 'Desactivar' }))
    fireEvent.keyDown(document, { key: 'Escape' })

    expect(document.activeElement).toBe(btn('Desactivar'))
    expect(
      fetchMock.mock.calls.some((c) => (c[1]?.method ?? 'GET') === 'PUT'),
    ).toBe(false)
  })

  it('"Sí, desactivar" → PUT DESACTIVADO, banner, badge nuevo y doble invalidación', async () => {
    setPerfil(perfilCambiarEstado)
    configurar({ estadoInicial: 'ACTIVO' })
    const cliente = crearCliente()
    const invalidarSpy = vi.spyOn(cliente, 'invalidateQueries')

    renderDetalle(cliente)
    fireEvent.click(await screen.findByRole('button', { name: 'Desactivar' }))
    fireEvent.click(btn('Sí, desactivar'))

    expect(await screen.findByText('Usuario desactivado.')).toBeInTheDocument()

    const put = fetchMock.mock.calls.find(
      (c) => (c[1]?.method ?? 'GET') === 'PUT',
    )
    expect(put![0]).toBe('https://api.test/usuarios/u1/estado')
    expect(JSON.parse(put![1].body as string)).toEqual({
      estado: 'DESACTIVADO',
    })

    expect(invalidarSpy).toHaveBeenCalledWith({
      queryKey: ['usuarios', 'lista'],
    })
    expect(invalidarSpy).toHaveBeenCalledWith({
      queryKey: ['usuarios', 'detalle', 'u1'],
    })

    // El badge refleja el estado nuevo y el botón pasa a "Reactivar".
    await waitFor(() =>
      expect(screen.getByText('Desactivado')).toBeInTheDocument(),
    )
    expect(btn('Reactivar')).toBeInTheDocument()
  })
})

describe('Cambiar estado — reactivar (directo)', () => {
  it('DESACTIVADO muestra "Reactivar" y al pulsarlo envía ACTIVO sin confirmación', async () => {
    setPerfil(perfilCambiarEstado)
    configurar({ estadoInicial: 'DESACTIVADO' })

    renderDetalle()
    fireEvent.click(await screen.findByRole('button', { name: 'Reactivar' }))

    // No hay paso de confirmación.
    expect(screen.queryByText(/Perderá el acceso/)).toBeNull()
    expect(await screen.findByText('Usuario reactivado.')).toBeInTheDocument()

    const put = fetchMock.mock.calls.find(
      (c) => (c[1]?.method ?? 'GET') === 'PUT',
    )
    expect(JSON.parse(put![1].body as string)).toEqual({ estado: 'ACTIVO' })
  })
})

describe('Cambiar estado — mapeo de errores', () => {
  it('403 → mensaje NEUTRO (sin insinuar permiso vs. jerarquía) y confirmación COLAPSADA', async () => {
    setPerfil(perfilCambiarEstado)
    configurar({ estadoInicial: 'ACTIVO', putStatus: 403 })

    renderDetalle()
    fireEvent.click(await screen.findByRole('button', { name: 'Desactivar' }))
    fireEvent.click(btn('Sí, desactivar'))

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent(
      'No se pudo cambiar el estado de este usuario.',
    )
    expect(
      screen.queryByText(/permiso|jerarqu|nivel|autoridad|superior/i),
    ).toBeNull()
    // No queda "¿Seguro?" a medias: vuelve el botón inicial.
    expect(screen.queryByText(/Perderá el acceso/)).toBeNull()
    expect(btn('Desactivar')).toBeInTheDocument()
  })

  it('404 → mensaje neutro de no encontrado', async () => {
    setPerfil(perfilCambiarEstado)
    configurar({ estadoInicial: 'ACTIVO', putStatus: 404 })

    renderDetalle()
    fireEvent.click(await screen.findByRole('button', { name: 'Desactivar' }))
    fireEvent.click(btn('Sí, desactivar'))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No encontramos este usuario.',
    )
  })

  it('error de red → error general y confirmación colapsada', async () => {
    setPerfil(perfilCambiarEstado)
    configurar({ estadoInicial: 'ACTIVO', putError: true })

    renderDetalle()
    fireEvent.click(await screen.findByRole('button', { name: 'Desactivar' }))
    fireEvent.click(btn('Sí, desactivar'))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo cambiar el estado. Inténtalo de nuevo.',
    )
    expect(screen.queryByText(/Perderá el acceso/)).toBeNull()
    expect(btn('Desactivar')).toBeInTheDocument()
  })
})
