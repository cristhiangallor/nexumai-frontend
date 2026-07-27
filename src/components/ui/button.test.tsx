import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Button } from './button'

describe('Button (primitivo)', () => {
  it('renderiza un <button> nativo y reenvía aria-*, disabled y ref', () => {
    const ref = vi.fn()
    render(
      <Button
        ref={ref}
        disabled
        aria-expanded
        aria-controls="panel"
        aria-label="Alternar"
      >
        X
      </Button>,
    )

    const btn = screen.getByRole('button', { name: 'Alternar' })
    expect(btn.tagName).toBe('BUTTON')
    expect(btn).toBeDisabled() // disabled NATIVO, no aria-disabled
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    expect(btn).toHaveAttribute('aria-controls', 'panel')
    expect(ref).toHaveBeenCalled()
    expect(ref.mock.calls[0][0]?.tagName).toBe('BUTTON')
  })

  it('trae focus-visible consistente y disabled uniforme en la base', () => {
    render(<Button>Aceptar</Button>)
    const btn = screen.getByRole('button', { name: 'Aceptar' })

    expect(btn).toHaveClass('focus-visible:ring-ring/50')
    expect(btn).toHaveClass('disabled:opacity-50')
  })

  it('la variante default mapea el §14 primario (color, hover, active, peso 600)', () => {
    render(<Button variant="default">Guardar</Button>)
    const btn = screen.getByRole('button', { name: 'Guardar' })

    expect(btn).toHaveClass('bg-primary')
    expect(btn).toHaveClass('hover:bg-primary-hover')
    expect(btn).toHaveClass('active:bg-primary-active')
    expect(btn).toHaveClass('font-semibold')
  })

  it('la variante secondary mapea el §14 secundario (borde/texto morado, peso 600)', () => {
    render(<Button variant="secondary">Cancelar</Button>)
    const btn = screen.getByRole('button', { name: 'Cancelar' })

    expect(btn).toHaveClass('border-primary-border')
    expect(btn).toHaveClass('text-primary')
    expect(btn).toHaveClass('font-semibold')
  })

  it('ghost no hereda 600 (peso 600 solo primario/secundario)', () => {
    render(<Button variant="ghost">Menú</Button>)
    const btn = screen.getByRole('button', { name: 'Menú' })

    expect(btn).not.toHaveClass('font-semibold')
    expect(btn).toHaveClass('font-medium')
  })
})
