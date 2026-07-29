import { render, screen } from '@testing-library/react'
import {
  createMemoryRouter,
  Outlet,
  redirect,
  RouterProvider,
  useParams,
} from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'

import { RUTAS } from '@/rutas'

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

  it('una ruta ANIDADA bajo /console sin sesión redirige al login (el prefijo no afecta al guard)', () => {
    setSlug('acme') // slug persistido (F-005), sin token

    const router = createMemoryRouter(
      [
        {
          path: 'console',
          element: (
            <RequiereSesion>
              <Outlet />
            </RequiereSesion>
          ),
          children: [{ path: 'inicio', element: <p>consola inicio</p> }],
        },
        { path: '/:slug/login', element: <PantallaLogin /> },
      ],
      { initialEntries: ['/console/inicio'] },
    )
    render(<RouterProvider router={router} />)

    expect(screen.queryByText('consola inicio')).toBeNull()
    expect(screen.getByText('login de acme')).toBeInTheDocument()
  })

  it('con sesión, /console (índice) aterriza en /console/inicio', async () => {
    setToken('token-abc')

    // Router MÍNIMO: solo las rutas que este caso ejercita (índice de /console y su
    // redirect a /console/inicio). NO añadir aquí la ruta `/:slug/login`: una ruta
    // dinámica hermana hace que react-router, al reconciliar el estado tras el redirect
    // del loader índice, lea `manifest[match.route.id]` como undefined y lance un
    // unhandled rejection (los asserts pasan, pero vitest sale con exit 1). El redirect
    // se prueba igual sin esa ruta irrelevante.
    const router = createMemoryRouter(
      [
        {
          path: 'console',
          element: (
            <RequiereSesion>
              <Outlet />
            </RequiereSesion>
          ),
          children: [
            { index: true, loader: () => redirect(RUTAS.inicio) },
            { path: 'inicio', element: <p>consola inicio</p> },
          ],
        },
      ],
      { initialEntries: ['/console'] },
    )
    render(<RouterProvider router={router} />)

    expect(await screen.findByText('consola inicio')).toBeInTheDocument()
  })
})
