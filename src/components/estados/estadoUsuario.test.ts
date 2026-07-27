import { describe, expect, it } from 'vitest'

import { tonoDeEstadoUsuario } from './estadoUsuario'

describe('tonoDeEstadoUsuario', () => {
  it('ACTIVO → success', () => {
    expect(tonoDeEstadoUsuario('ACTIVO')).toBe('success')
  })

  it('INVITADO → info', () => {
    expect(tonoDeEstadoUsuario('INVITADO')).toBe('info')
  })

  it('DESACTIVADO → neutral (gris, no danger/rojo)', () => {
    expect(tonoDeEstadoUsuario('DESACTIVADO')).toBe('neutral')
  })
})
