import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'

import { EstadoError } from '@/components/estados'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/core/http'
import { RUTAS } from '@/rutas'

import { useInvitarUsuario } from './useInvitarUsuario'
import { useRolesAsignables } from './useRolesAsignables'

// Validación de EXPERIENCIA (formato de correo), no de seguridad. El backend valida de
// verdad; la unicidad del correo NO se anticipa (la resuelve el 409).
const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const CLASE_CAMPO =
  'mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring'

/** Envoltura de página con enlace de regreso y título, común a todos los estados. */
function Marco({ children }: { children: React.ReactNode }) {
  return (
    <main className="p-6">
      <Link
        to={RUTAS.usuarios}
        className="mb-4 inline-block rounded text-sm text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        ← Volver a usuarios
      </Link>
      <h1 className="m-0 mb-6 text-2xl font-medium tracking-normal text-foreground">
        Invitar usuario
      </h1>
      {children}
    </main>
  )
}

export function InvitarUsuarioPage() {
  const navigate = useNavigate()
  const roles = useRolesAsignables()
  const invitar = useInvitarUsuario()

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [rolId, setRolId] = useState('')

  // Opciones del selector ordenadas por nombre en el front (la lista no trae orden).
  const rolesOrdenados = useMemo(
    () =>
      [...(roles.data ?? [])].sort((a, b) =>
        a.nombre.localeCompare(b.nombre, 'es-MX'),
      ),
    [roles.data],
  )

  const catalogoCargando = roles.isPending
  const catalogoVacio = roles.isSuccess && rolesOrdenados.length === 0

  const emailFormatoInvalido = email !== '' && !FORMATO_CORREO.test(email)
  const formularioValido =
    nombre.trim() !== '' &&
    email.trim() !== '' &&
    !emailFormatoInvalido &&
    rolId !== ''

  // Mapeo de errores del envío. El 409 (correo duplicado) va JUNTO AL CAMPO; el resto,
  // como error general del formulario. Se conserva lo capturado (no se resetea el form).
  const correoDuplicado =
    invitar.error instanceof ApiError && invitar.error.status === 409
  const errorGeneral = invitar.isError && !correoDuplicado

  // El formato inválido se muestra EN VIVO (no tras un intento): como el botón se
  // deshabilita hasta que el formulario es válido, sin este mensaje el usuario no
  // sabría por qué no puede enviar.
  const errorCorreo = correoDuplicado
    ? 'Ya existe una cuenta con ese correo en la organización.'
    : emailFormatoInvalido
      ? 'Ingresa un correo válido.'
      : undefined

  function onSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!formularioValido || catalogoCargando || catalogoVacio) {
      return
    }
    invitar.mutate(
      { nombre: nombre.trim(), email: email.trim(), rolId },
      {
        onSuccess: (respuesta) => {
          // Navegación (la invalidación de la caché ya la hizo el hook). El aviso lleva
          // el correo que el propio actor tecleó, a su misma pantalla destino.
          navigate(RUTAS.usuarios, {
            state: { avisoInvitacionEnviada: respuesta.email },
          })
        },
      },
    )
  }

  // Sin catálogo no se puede invitar (el POST exige rolId): error de carga → reintento.
  if (roles.isError) {
    return (
      <Marco>
        <EstadoError
          mensaje="No se pudieron cargar los roles. Sin ellos no puedes invitar."
          onReintentar={() => roles.refetch()}
        />
      </Marco>
    )
  }

  return (
    <Marco>
      <form onSubmit={onSubmit} noValidate className="max-w-md">
        {errorGeneral && (
          <p
            role="alert"
            className="mb-4 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger-text"
          >
            No se pudo enviar la invitación. Revisa los datos e inténtalo de
            nuevo.
          </p>
        )}

        <div className="mb-4">
          <label
            htmlFor="nombre"
            className="block text-sm font-medium text-foreground"
          >
            Nombre
          </label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(evento) => setNombre(evento.target.value)}
            className={CLASE_CAMPO}
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-foreground"
          >
            Correo
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            autoComplete="off"
            aria-invalid={errorCorreo ? true : undefined}
            aria-describedby={errorCorreo ? 'email-error' : undefined}
            className={CLASE_CAMPO}
          />
          {errorCorreo && (
            <p id="email-error" className="mt-1 text-sm text-danger-text">
              {errorCorreo}
            </p>
          )}
        </div>

        <div className="mb-6">
          <label
            htmlFor="rol"
            className="block text-sm font-medium text-foreground"
          >
            Rol
          </label>
          <select
            id="rol"
            value={rolId}
            onChange={(evento) => setRolId(evento.target.value)}
            disabled={catalogoCargando || catalogoVacio}
            aria-describedby={catalogoVacio ? 'rol-vacio' : undefined}
            className={CLASE_CAMPO}
          >
            {catalogoCargando ? (
              <option value="">Cargando roles…</option>
            ) : (
              <>
                <option value="">Selecciona un rol</option>
                {rolesOrdenados.map((rol) => (
                  <option key={rol.id} value={rol.id}>
                    {rol.nombre}
                  </option>
                ))}
              </>
            )}
          </select>
          {catalogoVacio && (
            <p
              id="rol-vacio"
              role="status"
              className="mt-1 text-sm text-muted-foreground"
            >
              No hay roles asignables disponibles. No puedes invitar por ahora.
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="default"
          disabled={
            invitar.isPending ||
            catalogoCargando ||
            catalogoVacio ||
            !formularioValido
          }
          className="w-full"
        >
          {invitar.isPending ? 'Enviando…' : 'Enviar invitación'}
        </Button>
      </form>
    </Marco>
  )
}
