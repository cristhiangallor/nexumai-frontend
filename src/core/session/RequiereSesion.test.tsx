import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider, useParams } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'

import { RequiereSesion } from './RequiereSesion'
import { clearSession, setSlug, setToken } from './session'

function PantallaLogin() {
  const { slug } = useParams()
  return <p>login de {slug}</p>
}

function montar(inicial = '/inicio') {
  const router = createMemoryRouter(
    [
      {
        path: '/inicio',
        element: (
          <RequiereSesion>
            <p>contenido privado</p>
          </RequiereSesion>
        ),
      },
      { path: '/:slug/login', element: <PantallaLogin /> },
      { path: '/', element: <p>landing pública</p> },
    ],
    { initialEntries: [inicial] },
  )
  return render(<RouterProvider router={router} />)
}

afterEach(() => {
  clearSession()
})

describe('RequiereSesion (guard de sesión)', () => {
  it('con sesión (token) renderiza el contenido privado', () => {
    setToken('token-abc')

    montar()

    expect(screen.getByText('contenido privado')).toBeInTheDocument()
  })

  it('sin sesión: no renderiza la ruta privada y redirige al login conservando el slug', () => {
    setSlug('acme') // slug persistido (F-005), sin token

    montar()

    expect(screen.queryByText('contenido privado')).toBeNull()
    expect(screen.getByText('login de acme')).toBeInTheDocument()
  })

  it('sin sesión y sin slug: redirige a "/" sin fallar', () => {
    montar()

    expect(screen.queryByText('contenido privado')).toBeNull()
    expect(screen.getByText('landing pública')).toBeInTheDocument()
  })
})
