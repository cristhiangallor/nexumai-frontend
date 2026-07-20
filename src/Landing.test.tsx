import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { Landing } from '@/Landing'

describe('Landing', () => {
  it('muestra los links a Consola y Portal', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('link', { name: 'Consola (RRHH)' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Portal del colaborador' }),
    ).toBeInTheDocument()
  })
})
