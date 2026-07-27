import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { EstadoVacio } from './EstadoVacio'

describe('EstadoVacio', () => {
  it('variante "vacio" muestra su mensaje neutro y se anuncia (role=status)', () => {
    render(<EstadoVacio variante="vacio" />)

    expect(screen.getByText('Aún no hay nada aquí')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('variante "sin-resultados" muestra un mensaje DISTINTO', () => {
    render(<EstadoVacio variante="sin-resultados" />)

    expect(screen.getByText('Sin resultados')).toBeInTheDocument()
    // No debe confundirse con el vacío genuino.
    expect(screen.queryByText('Aún no hay nada aquí')).toBeNull()
  })

  it('permite sobreescribir título y descripción (la entidad la pone la pantalla)', () => {
    render(
      <EstadoVacio
        variante="vacio"
        titulo="No hay usuarios"
        descripcion="Invita al primero."
      />,
    )

    expect(screen.getByText('No hay usuarios')).toBeInTheDocument()
    expect(screen.getByText('Invita al primero.')).toBeInTheDocument()
  })

  it('sin acción inyectada no renderiza botón', () => {
    render(<EstadoVacio variante="vacio" />)

    expect(screen.queryByRole('button')).toBeNull()
  })

  it('con acción renderiza el botón y lo dispara', () => {
    const onAccionar = vi.fn()
    render(
      <EstadoVacio
        variante="sin-resultados"
        accion={{ etiqueta: 'Limpiar filtros', onAccionar }}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(onAccionar).toHaveBeenCalledTimes(1)
  })
})
