import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import type { PerfilResponse } from '@/core/api'
import { clearSession, setPerfil } from '@/core/session'

import { usePermiso } from './usePermiso'

function perfilCon(permisos: string[]): PerfilResponse {
  return {
    nombre: 'Ana López',
    correo: 'ana@example.com',
    rol: 'RRHH',
    estado: 'ACTIVO',
    empresa: 'Razón Social Demo',
    sesionExpiraEn: '2026-07-25T20:00:00Z',
    permisos,
  }
}

afterEach(() => {
  clearSession()
})

describe('usePermiso', () => {
  it('devuelve true cuando la sesión tiene la clave exacta', () => {
    setPerfil(perfilCon(['expediente.ver_propio', 'usuario.ver']))

    expect(renderHook(() => usePermiso('usuario.ver')).result.current).toBe(
      true,
    )
  })

  it('devuelve false cuando la sesión no tiene la clave', () => {
    setPerfil(perfilCon(['usuario.ver']))

    expect(renderHook(() => usePermiso('usuario.crear')).result.current).toBe(
      false,
    )
  })

  it('lee el alcance DENTRO de la clave, no lo infiere', () => {
    // Tener ver_propio no implica ver_todos: la UI compara la clave literal.
    setPerfil(perfilCon(['expediente.ver_propio']))

    expect(
      renderHook(() => usePermiso('expediente.ver_propio')).result.current,
    ).toBe(true)
    expect(
      renderHook(() => usePermiso('expediente.ver_todos')).result.current,
    ).toBe(false)
  })

  it('devuelve false sin sesión (no lanza)', () => {
    expect(renderHook(() => usePermiso('usuario.ver')).result.current).toBe(
      false,
    )
  })
})
