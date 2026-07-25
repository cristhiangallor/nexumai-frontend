import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import type { PerfilResponse } from '@/core/api'
import { clearSession, setPerfil } from '@/core/session'

import { UserMenu } from './UserMenu'

function perfilCon(nombre: string, rol: string | null): PerfilResponse {
  return {
    nombre,
    correo: 'ana@example.com',
    rol,
    estado: 'ACTIVO',
    empresa: 'Razón Social Demo',
    sesionExpiraEn: '2026-07-25T20:00:00Z',
    permisos: ['usuario.ver_propio'],
  }
}

afterEach(() => {
  clearSession()
})

describe('UserMenu', () => {
  it('muestra nombre y rol de la sesión', () => {
    setPerfil(perfilCon('Ana López', 'RRHH'))

    render(<UserMenu />)

    expect(screen.getByText('Ana López')).toBeInTheDocument()
    expect(screen.getByText('RRHH')).toBeInTheDocument()
  })

  it('revela el ítem "Cerrar sesión" (placeholder) al abrir el menú', () => {
    setPerfil(perfilCon('Ana López', 'RRHH'))

    render(<UserMenu />)

    // Cerrado: el disparador expone aria-expanded=false y el ítem no está.
    const disparador = screen.getByRole('button', { name: /Ana López/ })
    expect(disparador).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).toBeNull()

    fireEvent.click(disparador)

    expect(disparador).toHaveAttribute('aria-expanded', 'true')
    expect(
      screen.getByRole('button', { name: 'Cerrar sesión' }),
    ).toBeInTheDocument()
  })

  it('no renderiza nada sin sesión', () => {
    const { container } = render(<UserMenu />)

    expect(container).toBeEmptyDOMElement()
  })
})
