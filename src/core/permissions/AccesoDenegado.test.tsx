import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { AccesoDenegado } from './AccesoDenegado'

describe('AccesoDenegado', () => {
  it('muestra un encabezado claro y un mensaje explicativo', () => {
    render(<AccesoDenegado />)

    expect(
      screen.getByRole('heading', { name: 'Acceso denegado' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/no tienes permiso/i)).toBeInTheDocument()
  })

  it('anuncia el estado con role="alert" y enfoca el encabezado', () => {
    render(<AccesoDenegado />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Acceso denegado' }),
    ).toHaveFocus()
  })
})
