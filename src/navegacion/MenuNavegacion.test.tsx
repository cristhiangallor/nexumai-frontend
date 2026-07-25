import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'

import type { PerfilResponse } from '@/core/api'
import { clearSession, setPerfil } from '@/core/session'

import type { EntradaMenu } from './catalogoMenu'
import { MenuNavegacion } from './MenuNavegacion'

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

const entradas: EntradaMenu[] = [
  { etiqueta: 'Alfa', ruta: '/alfa', permiso: 'alfa.ver' },
  { etiqueta: 'Beta', ruta: '/beta', permiso: 'beta.ver' },
]

function renderMenu(props?: { entradas?: EntradaMenu[] }) {
  return render(
    <MemoryRouter>
      <MenuNavegacion entradas={props?.entradas ?? entradas} />
    </MemoryRouter>,
  )
}

afterEach(() => {
  clearSession()
})

describe('MenuNavegacion', () => {
  it('es un landmark de navegación con nombre accesible', () => {
    setPerfil(perfilCon(['alfa.ver']))

    renderMenu()

    expect(
      screen.getByRole('navigation', { name: 'Navegación principal' }),
    ).toBeInTheDocument()
  })

  it('muestra solo las entradas cuya clave está en permisos[]', () => {
    setPerfil(perfilCon(['alfa.ver']))

    renderMenu()

    expect(screen.getByRole('link', { name: 'Alfa' })).toBeInTheDocument()
    // Ocultar por defecto: la entrada sin permiso ni aparece.
    expect(screen.queryByRole('link', { name: 'Beta' })).toBeNull()
  })

  it('no muestra ninguna entrada sin sesión', () => {
    renderMenu()

    expect(screen.queryByRole('link')).toBeNull()
  })

  it('se re-evalúa cuando cambia la sesión, sin recargar ni remontar', () => {
    // Sesión inicial: solo Alfa.
    setPerfil(perfilCon(['alfa.ver']))
    renderMenu()

    expect(screen.getByRole('link', { name: 'Alfa' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Beta' })).toBeNull()

    // Cambio de sesión (reautenticación con otros permisos) — misma UI montada.
    act(() => {
      setPerfil(perfilCon(['beta.ver']))
    })

    // El menú reaccionó a la mutación de core/session vía useSyncExternalStore.
    expect(screen.queryByRole('link', { name: 'Alfa' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Beta' })).toBeInTheDocument()
  })
})
