import { afterEach, describe, expect, it } from 'vitest'

import type { PerfilResponse } from '@/core/api/contracts'
import {
  clearSession,
  getPerfil,
  getSlug,
  getToken,
  setPerfil,
  setSlug,
  setToken,
} from '@/core/session'

const perfilDemo: PerfilResponse = {
  nombre: 'Ana López',
  correo: 'ana@example.com',
  rol: 'RRHH',
  estado: 'ACTIVO',
  empresa: 'Razón Social Demo',
  sesionExpiraEn: '2026-07-24T20:00:00Z',
  permisos: ['usuario.ver_propio'],
}

afterEach(() => {
  // Deja la sesión (localStorage + estado en memoria) limpia entre pruebas.
  clearSession()
})

describe('módulo de sesión — token', () => {
  it('devuelve null cuando no hay token', () => {
    expect(getToken()).toBeNull()
  })

  it('guarda y lee el token', () => {
    setToken('token-abc')
    expect(getToken()).toBe('token-abc')
  })

  it('persiste el token en localStorage (sobrevive recargas)', () => {
    setToken('token-abc')
    expect(localStorage.getItem('nexum.token')).toBe('token-abc')
  })

  it('nunca expone el token en una clave que parezca URL o log', () => {
    setToken('token-abc')
    // El token no debe aparecer bajo ninguna clave con pinta de PII/URL.
    for (let i = 0; i < localStorage.length; i++) {
      expect(localStorage.key(i)).toBe('nexum.token')
    }
  })
})

describe('módulo de sesión — perfil', () => {
  it('devuelve null cuando aún no se ha cargado el perfil', () => {
    expect(getPerfil()).toBeNull()
  })

  it('guarda y lee el PerfilResponse completo, incluidos permisos', () => {
    setPerfil(perfilDemo)
    expect(getPerfil()).toEqual(perfilDemo)
    expect(getPerfil()?.permisos).toEqual(['usuario.ver_propio'])
  })

  it('no persiste el perfil (PII) en localStorage', () => {
    setPerfil(perfilDemo)
    // security.md: el perfil (nombre/correo = PII) vive en memoria, no en disco.
    expect(localStorage.length).toBe(0)
  })
})

describe('módulo de sesión — clearSession', () => {
  it('limpia token y perfil de una vez', () => {
    setToken('token-abc')
    setPerfil(perfilDemo)

    clearSession()

    expect(getToken()).toBeNull()
    expect(getPerfil()).toBeNull()
    expect(localStorage.getItem('nexum.token')).toBeNull()
  })
})

describe('módulo de sesión — slug del tenant', () => {
  it('devuelve null cuando no hay slug', () => {
    expect(getSlug()).toBeNull()
  })

  it('guarda y lee el slug', () => {
    setSlug('acme')
    expect(getSlug()).toBe('acme')
  })

  it('clearSession también borra el slug (no deja rastro del tenant)', () => {
    setToken('token-abc')
    setSlug('acme')
    setPerfil(perfilDemo)

    clearSession()

    expect(getToken()).toBeNull()
    expect(getSlug()).toBeNull()
    expect(getPerfil()).toBeNull()
  })
})
