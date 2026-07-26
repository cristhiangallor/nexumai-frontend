import { render, screen, within } from '@testing-library/react'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'

import { Breadcrumb } from './Breadcrumb'

function Layout() {
  return (
    <>
      <Breadcrumb />
      <Outlet />
    </>
  )
}

function renderEnRuta(inicial: string) {
  const router = createMemoryRouter(
    [
      {
        element: <Layout />,
        children: [
          { path: '/inicio', handle: { titulo: 'Inicio' }, element: <p>i</p> },
          {
            path: '/perfil',
            handle: { titulo: 'Mi perfil' },
            element: <p>p</p>,
          },
        ],
      },
    ],
    { initialEntries: [inicial] },
  )
  return render(<RouterProvider router={router} />)
}

describe('Breadcrumb', () => {
  it('refleja la ruta activa leyendo handle.titulo (/perfil → "Mi perfil")', () => {
    renderEnRuta('/perfil')

    const nav = screen.getByRole('navigation', { name: 'Ruta de navegación' })
    const actual = within(nav).getByText('Mi perfil')
    expect(actual).toBeInTheDocument()
    expect(actual).toHaveAttribute('aria-current', 'page')
  })

  it('cambia con la ruta (/inicio → "Inicio")', () => {
    renderEnRuta('/inicio')

    expect(
      screen.getByRole('navigation', { name: 'Ruta de navegación' }),
    ).toHaveTextContent('Inicio')
  })
})
