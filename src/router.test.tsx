import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'

import { clearSession, setToken } from '@/core/session'

import { LandingPublicaPlaceholder } from './LandingPublicaPlaceholder'
import { redirigirSegunSesion } from './router'

afterEach(() => {
  clearSession()
})

function routerDePrueba(inicial: string) {
  return createMemoryRouter(
    [
      {
        path: '/',
        loader: redirigirSegunSesion,
        element: <LandingPublicaPlaceholder />,
      },
      { path: '/inicio', element: <p>estoy en inicio</p> },
    ],
    { initialEntries: [inicial] },
  )
}

describe('convergencia de rutas — redirigirSegunSesion (/)', () => {
  it('con sesión (token) redirige a /inicio', () => {
    setToken('token-abc')

    const resultado = redirigirSegunSesion()

    expect(resultado).toBeInstanceOf(Response)
    const respuesta = resultado as Response
    expect(respuesta.status).toBe(302)
    expect(respuesta.headers.get('Location')).toBe('/inicio')
  })

  it('sin sesión no redirige (renderiza el placeholder)', () => {
    const resultado = redirigirSegunSesion()

    expect(resultado).toBeNull()
  })
})

describe('convergencia de rutas — integración de "/"', () => {
  it('sin sesión, "/" muestra la landing pública (placeholder, no la de F-001)', async () => {
    render(<RouterProvider router={routerDePrueba('/')} />)

    expect(
      await screen.findByText(/landing pública pendiente/i),
    ).toBeInTheDocument()
    // La landing de F-001 (eliminada) tenía este link; no debe aparecer.
    expect(screen.queryByRole('link', { name: 'Consola (RRHH)' })).toBeNull()
  })

  it('con sesión, "/" redirige a /inicio', async () => {
    setToken('token-abc')

    render(<RouterProvider router={routerDePrueba('/')} />)

    expect(await screen.findByText('estoy en inicio')).toBeInTheDocument()
  })
})
