import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { EstadoBadge, type Tono } from './EstadoBadge'

// Clase literal característica de cada tono (superficie).
const CLASE_POR_TONO: Record<Tono, string> = {
  success: 'bg-success-soft',
  info: 'bg-info-soft',
  warning: 'bg-warning-soft',
  danger: 'bg-danger-soft',
  neutral: 'bg-muted',
}

describe('EstadoBadge', () => {
  it.each(['success', 'info', 'warning', 'danger', 'neutral'] as Tono[])(
    'renderiza el tono "%s" con su clase literal',
    (tono) => {
      render(<EstadoBadge tono={tono}>Etiqueta</EstadoBadge>)

      expect(screen.getByText('Etiqueta')).toHaveClass(CLASE_POR_TONO[tono])
    },
  )
})
