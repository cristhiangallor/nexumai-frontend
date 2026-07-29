import { describe, expect, it } from 'vitest'

import { calcularTotalPaginas, paginasVisibles } from './paginacion'

describe('calcularTotalPaginas', () => {
  it('redondea hacia arriba y nunca baja de 1', () => {
    expect(calcularTotalPaginas(0, 20)).toBe(1)
    expect(calcularTotalPaginas(20, 20)).toBe(1)
    expect(calcularTotalPaginas(21, 20)).toBe(2)
    expect(calcularTotalPaginas(45, 20)).toBe(3)
  })
})

describe('paginasVisibles', () => {
  it('muestra todas cuando son 7 o menos', () => {
    expect(paginasVisibles(1, 3)).toEqual([1, 2, 3])
    expect(paginasVisibles(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('inserta elipsis con ventana alrededor de la actual', () => {
    expect(paginasVisibles(5, 20)).toEqual([1, 'gap', 4, 5, 6, 'gap', 20])
    expect(paginasVisibles(1, 20)).toEqual([1, 2, 'gap', 20])
    expect(paginasVisibles(20, 20)).toEqual([1, 'gap', 19, 20])
  })
})
