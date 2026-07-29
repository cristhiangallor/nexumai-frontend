import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { UsuarioResumen } from '@/core/api'

import { UsuarioDetallePage } from './UsuarioDetallePage'

function mockResponse(status: number, body?: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  }
}

const usuario: UsuarioResumen = {
  id: 'u1',
  nombre: 'Ana López',
  email: 'ana@x.com',
  rol: 'RRHH',
  estado: 'ACTIVO',
  createdAt: '2026-01-10T00:00:00Z',
}

let fetchMock: ReturnType<typeof vi.fn>

function renderDetalle(entrada = '/console/usuarios/u1') {
  const cliente = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={cliente}>
      <MemoryRouter initialEntries={[entrada]}>
        <Routes>
          <Route path="/console/usuarios" element={<p>listado</p>} />
          <Route
            path="/console/usuarios/:usuarioId"
            element={<UsuarioDetallePage />}
          />
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

describe('UsuarioDetallePage', () => {
  it('carga y muestra los campos del usuario', async () => {
    fetchMock.mockResolvedValue(mockResponse(200, usuario))

    renderDetalle()

    expect(await screen.findByText('ana@x.com')).toBeInTheDocument()
    expect(screen.getByText('Ana López')).toBeInTheDocument()
    expect(screen.getByText('RRHH')).toBeInTheDocument()
    // Pega al endpoint por id.
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.test/usuarios/u1')
  })

  it('404: mensaje NEUTRO que no insinúa que exista en otra empresa/tenant', async () => {
    fetchMock.mockResolvedValue(mockResponse(404))

    renderDetalle('/console/usuarios/desconocido')

    expect(
      await screen.findByText('No encontramos este usuario'),
    ).toBeInTheDocument()
    // No debe filtrar que podría existir en otro tenant.
    expect(
      screen.queryByText(/otra empresa|otro tenant|another|existe en/i),
    ).toBeNull()
  })
})
