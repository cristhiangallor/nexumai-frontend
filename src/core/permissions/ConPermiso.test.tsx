import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import type { PerfilResponse } from '@/core/api'
import { clearSession, setPerfil } from '@/core/session'

import { ConPermiso } from './ConPermiso'

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

describe('ConPermiso', () => {
  it('renderiza los hijos cuando el usuario tiene el permiso', () => {
    setPerfil(perfilCon(['usuario.crear']))

    render(
      <ConPermiso clave="usuario.crear">
        <button>Crear usuario</button>
      </ConPermiso>,
    )

    expect(
      screen.getByRole('button', { name: 'Crear usuario' }),
    ).toBeInTheDocument()
  })

  it('oculta los hijos (no los renderiza) cuando no tiene el permiso', () => {
    setPerfil(perfilCon(['usuario.ver']))

    render(
      <ConPermiso clave="usuario.crear">
        <button>Crear usuario</button>
      </ConPermiso>,
    )

    // Ocultar por defecto: ni siquiera aparece deshabilitado.
    expect(screen.queryByRole('button', { name: 'Crear usuario' })).toBeNull()
  })

  it('oculta los hijos sin sesión', () => {
    render(
      <ConPermiso clave="usuario.ver">
        <span>contenido protegido</span>
      </ConPermiso>,
    )

    expect(screen.queryByText('contenido protegido')).toBeNull()
  })
})
