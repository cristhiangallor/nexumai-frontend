import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { SkeletonTabla } from './SkeletonTabla'

describe('SkeletonTabla', () => {
  it('respeta columnas y filas recibidas (columnas × filas bloques)', () => {
    const { container } = render(<SkeletonTabla columnas={4} filas={3} />)

    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(
      12,
    )
  })

  it('usa 5 filas por defecto', () => {
    const { container } = render(<SkeletonTabla columnas={2} />)

    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(
      10,
    )
  })

  it('anuncia el estado de carga a lectores de pantalla', () => {
    const { getByRole } = render(<SkeletonTabla columnas={2} filas={1} />)

    expect(getByRole('status')).toHaveTextContent('Cargando…')
  })
})
