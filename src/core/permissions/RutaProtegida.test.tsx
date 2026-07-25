import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import type { PerfilResponse } from '@/core/api'
import { clearSession, setPerfil } from '@/core/session'

import { RutaProtegida } from './RutaProtegida'

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

describe('RutaProtegida', () => {
  it('renderiza el contenido cuando el usuario tiene el permiso', () => {
    setPerfil(perfilCon(['usuario.ver_propio']))

    render(
      <RutaProtegida clave="usuario.ver_propio">
        <p>contenido protegido</p>
      </RutaProtegida>,
    )

    expect(screen.getByText('contenido protegido')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Acceso denegado' }),
    ).toBeNull()
  })

  it('muestra AccesoDenegado (no redirige) cuando falta el permiso', () => {
    setPerfil(perfilCon(['usuario.ver_propio']))

    render(
      <RutaProtegida clave="configuracion.ver">
        <p>contenido protegido</p>
      </RutaProtegida>,
    )

    expect(
      screen.getByRole('heading', { name: 'Acceso denegado' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('contenido protegido')).toBeNull()
  })

  it('muestra AccesoDenegado sin sesión', () => {
    render(
      <RutaProtegida clave="usuario.ver_propio">
        <p>contenido protegido</p>
      </RutaProtegida>,
    )

    expect(
      screen.getByRole('heading', { name: 'Acceso denegado' }),
    ).toBeInTheDocument()
  })
})
