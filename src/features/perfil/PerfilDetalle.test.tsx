import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { type DatosPerfil, PerfilDetalle } from './PerfilDetalle'

const base: DatosPerfil = {
  nombre: 'Ana López',
  correo: 'ana@x.com',
  rol: 'RRHH',
  empresa: 'Razón Social Demo',
  estado: 'ACTIVO',
}

describe('PerfilDetalle (presentación pura)', () => {
  it('es montable de forma AISLADA (recibe datos por props) — costura para NEX-70', () => {
    // Sin router, sin sesión, sin providers: solo props. Es la prueba de que el portal
    // (NEX-70) podrá reutilizarlo montándolo en su propio AppShell.
    render(<PerfilDetalle {...base} />)

    expect(screen.getByText('Ana López')).toBeInTheDocument()
    expect(screen.getByText('ana@x.com')).toBeInTheDocument()
    expect(screen.getByText('RRHH')).toBeInTheDocument()
    expect(screen.getByText('Razón Social Demo')).toBeInTheDocument() // NOMBRE, no id
    expect(screen.getByText('Activo')).toBeInTheDocument() // badge
  })

  it('rol null → "Sin rol asignado"', () => {
    render(<PerfilDetalle {...base} rol={null} />)

    expect(screen.getByText('Sin rol asignado')).toBeInTheDocument()
  })

  it('mapea el estado a su etiqueta es-MX', () => {
    render(<PerfilDetalle {...base} estado="DESACTIVADO" />)

    expect(screen.getByText('Desactivado')).toBeInTheDocument()
  })
})
