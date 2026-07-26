import { fireEvent, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'

import type { PerfilResponse } from '@/core/api'
import { clearSession, setPerfil } from '@/core/session'

import { AppShell } from './AppShell'

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

function renderShell(permisos: string[]) {
  setPerfil(perfilCon(permisos))
  const router = createMemoryRouter(
    [
      {
        element: <AppShell />,
        children: [{ path: '/inicio', element: <p>contenido de inicio</p> }],
      },
    ],
    { initialEntries: ['/inicio'] },
  )
  return render(<RouterProvider router={router} />)
}

afterEach(() => {
  clearSession()
})

describe('AppShell', () => {
  it('monta las tres zonas: sidebar (nav), header (banner) y contenido (outlet)', () => {
    renderShell(['usuario.ver_propio'])

    expect(
      screen.getByRole('navigation', { name: 'Navegación principal' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByText('contenido de inicio')).toBeInTheDocument()
  })

  it('el sidebar reutiliza el menú dirigido por permisos (recorta por sesión)', () => {
    renderShell(['usuario.ver_propio'])

    expect(screen.getByRole('link', { name: 'Inicio' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mi perfil' })).toBeInTheDocument()
  })

  it('oculta las entradas del menú cuando la sesión no tiene el permiso', () => {
    renderShell([])

    expect(screen.queryByRole('link', { name: 'Inicio' })).toBeNull()
    expect(screen.queryByRole('link', { name: 'Mi perfil' })).toBeNull()
  })

  it('el toggle de colapso (escritorio) expone aria-expanded y alterna', () => {
    renderShell(['usuario.ver_propio'])

    const colapsar = screen.getByRole('button', { name: 'Colapsar menú' })
    // El sidebar (aria-controls) existe y el toggle es un <button> (operable por teclado).
    expect(colapsar).toHaveAttribute('aria-controls', 'app-sidebar')
    expect(colapsar).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(colapsar)

    const expandir = screen.getByRole('button', { name: 'Expandir menú' })
    expect(expandir).toHaveAttribute('aria-expanded', 'false')
  })

  it('el drawer (móvil) abre/cierra: aria-expanded alterna y aparece el backdrop', () => {
    renderShell(['usuario.ver_propio'])

    const abrir = screen.getByRole('button', { name: 'Abrir menú' })
    expect(abrir).toHaveAttribute('aria-expanded', 'false')
    expect(
      screen.queryByRole('button', { name: 'Cerrar menú lateral' }),
    ).toBeNull()

    fireEvent.click(abrir)

    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    // El backdrop aparece (cierra el drawer al pulsarlo).
    expect(
      screen.getByRole('button', { name: 'Cerrar menú lateral' }),
    ).toBeInTheDocument()
  })
})
