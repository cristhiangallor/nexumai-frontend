import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { PerfilResponse } from '@/core/api'
import { RutaProtegida } from '@/core/permissions'
import { clearSession, setPerfil } from '@/core/session'

import { PerfilPage } from './PerfilPage'

const perfil: PerfilResponse = {
  nombre: 'Ana López',
  correo: 'ana@x.com',
  rol: 'RRHH',
  estado: 'ACTIVO',
  empresa: 'Razón Social Demo',
  sesionExpiraEn: '2026-08-05T20:00:00Z',
  permisos: ['usuario.ver_propio', 'usuario.ver'],
}

let fetchMock: ReturnType<typeof vi.fn>

/** Monta PerfilPage BAJO el guard real (RutaProtegida usuario.ver_propio). */
function renderBajoGuard() {
  return render(
    <MemoryRouter initialEntries={['/console/perfil']}>
      <Routes>
        <Route
          path="/console/perfil"
          element={
            <RutaProtegida clave="usuario.ver_propio">
              <PerfilPage />
            </RutaProtegida>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  clearSession()
  localStorage.clear()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('PerfilPage — reuso de sesión (invariante del guard)', () => {
  it('montada bajo guard satisfecho: pinta el perfil SIN ninguna petición', () => {
    setPerfil(perfil)

    renderBajoGuard()

    // Invariante: el guard dejó pasar (hay usuario.ver_propio) → la página monta y pinta.
    expect(screen.getByText('Ana López')).toBeInTheDocument()
    expect(screen.getByText('ana@x.com')).toBeInTheDocument()
    expect(screen.getByText('RRHH')).toBeInTheDocument()
    expect(screen.getByText('Razón Social Demo')).toBeInTheDocument()
    expect(screen.getByText('Activo')).toBeInTheDocument()
    // Reuso de sesión: NO se llama a GET /me (ni a nada).
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rol null → "Sin rol asignado"', () => {
    setPerfil({ ...perfil, rol: null })

    renderBajoGuard()

    expect(screen.getByText('Sin rol asignado')).toBeInTheDocument()
  })
})

describe('PerfilPage — no filtra datos técnicos', () => {
  it('permisos[] NO aparece en el DOM', () => {
    setPerfil(perfil)

    renderBajoGuard()

    // Ninguna clave modulo.accion visible.
    expect(screen.queryByText('usuario.ver_propio')).toBeNull()
    expect(screen.queryByText('usuario.ver')).toBeNull()
    expect(screen.queryByText(/permiso/i)).toBeNull()
  })

  it('sesionExpiraEn NO aparece en el DOM', () => {
    setPerfil(perfil)

    renderBajoGuard()

    expect(screen.queryByText('2026-08-05T20:00:00Z')).toBeNull()
    expect(screen.queryByText(/expira|sesión/i)).toBeNull()
  })
})

describe('PerfilPage — solo lectura', () => {
  it('no hay inputs ni botones de acción sobre el perfil', () => {
    setPerfil(perfil)

    renderBajoGuard()

    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.queryByRole('combobox')).toBeNull()
  })
})
