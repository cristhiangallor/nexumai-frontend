import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { EstadoError } from './EstadoError'

describe('EstadoError', () => {
  it('muestra un mensaje humano y se anuncia como alerta', () => {
    render(<EstadoError mensaje="No se pudo cargar la lista." />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No se pudo cargar la lista.',
    )
  })

  it('usa un mensaje por defecto si no se pasa uno', () => {
    render(<EstadoError />)

    expect(screen.getByRole('alert')).toHaveTextContent(/ocurrió un error/i)
  })

  it('no muestra reintento si no recibe el manejador', () => {
    render(<EstadoError />)

    expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull()
  })

  it('muestra reintento y lo dispara cuando recibe el manejador', () => {
    const onReintentar = vi.fn()
    render(<EstadoError onReintentar={onReintentar} />)

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onReintentar).toHaveBeenCalledTimes(1)
  })
})
