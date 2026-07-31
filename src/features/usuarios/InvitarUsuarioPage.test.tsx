import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { PerfilResponse } from '@/core/api'
import { RutaProtegida } from '@/core/permissions'
import { clearSession, setPerfil } from '@/core/session'

import { InvitarUsuarioPage } from './InvitarUsuarioPage'

function mockResponse(status: number, body?: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  }
}

// Catálogo DESORDENADO a propósito: la lista no garantiza orden; la UI lo ordena.
const ROLES = [
  { id: 'r2', nombre: 'RRHH' },
  { id: 'r1', nombre: 'Administrador' },
]

const RESPUESTA_201 = {
  usuarioId: 'u9',
  nombre: 'Ana',
  email: 'ana@x.com',
  rolId: 'r1',
}

const perfilConInvitar: PerfilResponse = {
  nombre: 'Jefa',
  correo: 'jefa@x.com',
  rol: 'ADMIN',
  estado: 'ACTIVO',
  empresa: 'Demo',
  sesionExpiraEn: '2026-08-01T00:00:00Z',
  permisos: ['usuario.ver', 'usuario.invitar'],
}

let fetchMock: ReturnType<typeof vi.fn>

/** Configura fetch por URL: catálogo de roles y alta de invitación. */
function configurarFetch(opciones: {
  roles?: unknown
  rolesStatus?: number
  rolesColgado?: boolean
  invite?: unknown
  inviteStatus?: number
  inviteError?: boolean
}) {
  const {
    roles = ROLES,
    rolesStatus = 200,
    rolesColgado = false,
    invite = RESPUESTA_201,
    inviteStatus = 201,
    inviteError = false,
  } = opciones
  fetchMock.mockImplementation((url: string) => {
    const u = String(url)
    if (u.includes('roles-asignables')) {
      if (rolesColgado) return new Promise(() => {})
      return Promise.resolve(mockResponse(rolesStatus, roles))
    }
    if (u.includes('usuarios/invitaciones')) {
      if (inviteError) return Promise.reject(new Error('sin red'))
      return Promise.resolve(mockResponse(inviteStatus, invite))
    }
    return Promise.resolve(mockResponse(200, []))
  })
}

/** Stub del listado que revela el aviso recibido por location.state. */
function ListadoStub() {
  const state = useLocation().state as {
    avisoInvitacionEnviada?: string
  } | null
  return (
    <p>
      listado
      {state?.avisoInvitacionEnviada
        ? ` aviso:${state.avisoInvitacionEnviada}`
        : ''}
    </p>
  )
}

function crearCliente() {
  return new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  })
}

function renderInvitar(cliente = crearCliente()) {
  render(
    <QueryClientProvider client={cliente}>
      <MemoryRouter initialEntries={['/console/usuarios/invitar']}>
        <Routes>
          <Route
            path="/console/usuarios/invitar"
            element={<InvitarUsuarioPage />}
          />
          <Route path="/console/usuarios" element={<ListadoStub />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return cliente
}

function llenarFormularioValido() {
  fireEvent.change(screen.getByLabelText('Nombre'), {
    target: { value: 'Ana' },
  })
  fireEvent.change(screen.getByLabelText('Correo'), {
    target: { value: 'ana@x.com' },
  })
  fireEvent.change(screen.getByLabelText('Rol'), { target: { value: 'r1' } })
}

beforeEach(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'https://api.test')
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  clearSession()
  localStorage.clear()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('InvitarUsuarioPage — catálogo de roles (selector)', () => {
  it('puebla el selector ordenado por nombre; pinta el nombre y guarda el id como valor', async () => {
    configurarFetch({})

    renderInvitar()

    await screen.findByRole('option', { name: 'Administrador' })
    const select = screen.getByLabelText('Rol')
    const opciones = within(select).getAllByRole('option')
    // [placeholder, Administrador (r1), RRHH (r2)] — ordenado alfabéticamente.
    expect(opciones.map((o) => o.textContent)).toEqual([
      'Selecciona un rol',
      'Administrador',
      'RRHH',
    ])
    expect((opciones[1] as HTMLOptionElement).value).toBe('r1')
    expect((opciones[2] as HTMLOptionElement).value).toBe('r2')
  })

  it('cargando: selector en carga y botón de enviar deshabilitado', () => {
    configurarFetch({ rolesColgado: true })

    renderInvitar()

    expect(screen.getByLabelText('Rol')).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Enviar invitación' }),
    ).toBeDisabled()
  })

  it('catálogo vacío: comunica que no hay roles y NO deja enviar', async () => {
    configurarFetch({ roles: [] })

    renderInvitar()

    expect(
      await screen.findByText(/No hay roles asignables disponibles/),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Enviar invitación' }),
    ).toBeDisabled()
  })

  it('error al cargar el catálogo: EstadoError con reintento', async () => {
    configurarFetch({ rolesStatus: 500 })

    renderInvitar()

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent(/No se pudieron cargar los roles/)
    expect(
      screen.getByRole('button', { name: 'Reintentar' }),
    ).toBeInTheDocument()
  })
})

describe('InvitarUsuarioPage — validación de experiencia', () => {
  it('exige nombre, correo válido y rol antes de habilitar enviar', async () => {
    configurarFetch({})

    renderInvitar()
    await screen.findByRole('option', { name: 'Administrador' })

    const boton = screen.getByRole('button', { name: 'Enviar invitación' })
    expect(boton).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Nombre'), {
      target: { value: 'Ana' },
    })
    fireEvent.change(screen.getByLabelText('Correo'), {
      target: { value: 'no-es-correo' },
    })
    expect(screen.getByText('Ingresa un correo válido.')).toBeInTheDocument()
    expect(boton).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Correo'), {
      target: { value: 'ana@x.com' },
    })
    expect(screen.queryByText('Ingresa un correo válido.')).toBeNull()
    expect(boton).toBeDisabled() // aún falta el rol

    fireEvent.change(screen.getByLabelText('Rol'), { target: { value: 'r1' } })
    expect(boton).toBeEnabled()
  })
})

describe('InvitarUsuarioPage — mapeo de respuestas', () => {
  it('201 → navega al listado con el aviso e invalida la query de usuarios', async () => {
    configurarFetch({})
    const cliente = crearCliente()
    const invalidarSpy = vi.spyOn(cliente, 'invalidateQueries')

    renderInvitar(cliente)
    await screen.findByRole('option', { name: 'Administrador' })

    llenarFormularioValido()
    fireEvent.click(screen.getByRole('button', { name: 'Enviar invitación' }))

    expect(
      await screen.findByText('listado aviso:ana@x.com'),
    ).toBeInTheDocument()

    // El cuerpo lleva el id del rol (no el nombre) y el tenant NO se envía.
    const llamadaPost = fetchMock.mock.calls.find((c) =>
      String(c[0]).includes('usuarios/invitaciones'),
    )
    expect(JSON.parse(llamadaPost![1].body as string)).toEqual({
      nombre: 'Ana',
      email: 'ana@x.com',
      rolId: 'r1',
    })
    // La invalidación vive en la capa de datos (prefijo del listado).
    expect(invalidarSpy).toHaveBeenCalledWith({
      queryKey: ['usuarios', 'lista'],
    })
  })

  it('409 → mensaje JUNTO AL CAMPO de correo, no error general', async () => {
    configurarFetch({ inviteStatus: 409 })

    renderInvitar()
    await screen.findByRole('option', { name: 'Administrador' })

    llenarFormularioValido()
    fireEvent.click(screen.getByRole('button', { name: 'Enviar invitación' }))

    expect(
      await screen.findByText(/Ya existe una cuenta con ese correo/),
    ).toBeInTheDocument()
    // El campo correo apunta a su error; no aparece el banner general.
    const email = screen.getByLabelText('Correo')
    expect(email).toHaveAttribute('aria-describedby', 'email-error')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('422 → error general SIN perder lo capturado en el formulario', async () => {
    configurarFetch({ inviteStatus: 422 })

    renderInvitar()
    await screen.findByRole('option', { name: 'Administrador' })

    llenarFormularioValido()
    fireEvent.click(screen.getByRole('button', { name: 'Enviar invitación' }))

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent(/No se pudo enviar la invitación/)
    // Se conserva lo tecleado.
    expect(screen.getByLabelText('Nombre')).toHaveValue('Ana')
    expect(screen.getByLabelText('Correo')).toHaveValue('ana@x.com')
    expect(screen.getByLabelText('Rol')).toHaveValue('r1')
  })

  it('error de red → error general, sin perder lo capturado', async () => {
    configurarFetch({ inviteError: true })

    renderInvitar()
    await screen.findByRole('option', { name: 'Administrador' })

    llenarFormularioValido()
    fireEvent.click(screen.getByRole('button', { name: 'Enviar invitación' }))

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent(/No se pudo enviar la invitación/)
    expect(screen.getByLabelText('Nombre')).toHaveValue('Ana')
  })
})

describe('InvitarUsuarioPage — permiso', () => {
  it('sin usuario.invitar el guard da AccesoDenegado y no pide el catálogo', async () => {
    setPerfil({ ...perfilConInvitar, permisos: ['usuario.ver'] })
    configurarFetch({})

    render(
      <QueryClientProvider client={crearCliente()}>
        <MemoryRouter initialEntries={['/console/usuarios/invitar']}>
          <Routes>
            <Route
              path="/console/usuarios/invitar"
              element={
                <RutaProtegida clave="usuario.invitar">
                  <InvitarUsuarioPage />
                </RutaProtegida>
              }
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(await screen.findByText('Acceso denegado')).toBeInTheDocument()
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some((c) =>
          String(c[0]).includes('roles-asignables'),
        ),
      ).toBe(false),
    )
  })
})
