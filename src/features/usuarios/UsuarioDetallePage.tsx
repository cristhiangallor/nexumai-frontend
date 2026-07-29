// Detalle de un usuario (/console/usuarios/:usuarioId). Solo lectura, mismos campos que
// la fila del listado. Un 404 significa "no existe O es de otro tenant", indistinguibles
// a propósito: se muestra un mensaje NEUTRO que NO insinúa que pudiera existir en otra
// empresa.

import { Link, useParams } from 'react-router'

import {
  EstadoBadge,
  EstadoError,
  SkeletonCard,
  tonoDeEstadoUsuario,
} from '@/components/estados'
import { ApiError } from '@/core/http'
import { AccesoDenegado } from '@/core/permissions'
import { PARAM_USUARIO_ID, RUTAS } from '@/rutas'

import { ETIQUETA_ESTADO, formatearFecha } from './etiquetas'
import { useUsuario } from './useUsuarios'

/** Mensaje neutro para "no encontrado". No revela si existe en otro tenant. */
function NoEncontrado() {
  return (
    <div
      role="status"
      className="rounded-lg border border-border p-8 text-center"
    >
      <p className="font-medium text-foreground">No encontramos este usuario</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Puede que el enlace sea incorrecto o que el usuario ya no esté
        disponible.
      </p>
    </div>
  )
}

export function UsuarioDetallePage() {
  const id = useParams()[PARAM_USUARIO_ID]
  const { data, isPending, isError, error, refetch } = useUsuario(id)

  // Revocación de permiso en caliente (403): AccesoDenegado, no EstadoError.
  if (isError && error instanceof ApiError && error.status === 403) {
    return <AccesoDenegado />
  }

  return (
    <main className="p-6">
      <Link
        to={RUTAS.usuarios}
        className="mb-4 inline-block rounded text-sm text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        ← Volver a usuarios
      </Link>
      <h1 className="m-0 mb-6 text-2xl font-medium tracking-normal text-foreground">
        Detalle del usuario
      </h1>

      {isPending ? (
        <SkeletonCard />
      ) : isError ? (
        error instanceof ApiError && error.status === 404 ? (
          <NoEncontrado />
        ) : (
          <EstadoError
            mensaje="No se pudo cargar el usuario. Inténtalo de nuevo."
            onReintentar={() => refetch()}
          />
        )
      ) : (
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
          <dt className="font-medium text-muted-foreground">Nombre</dt>
          <dd>{data.nombre}</dd>
          <dt className="font-medium text-muted-foreground">Correo</dt>
          <dd>{data.email}</dd>
          <dt className="font-medium text-muted-foreground">Rol</dt>
          <dd>
            {data.rol ?? (
              <span className="text-muted-foreground">Sin rol asignado</span>
            )}
          </dd>
          <dt className="font-medium text-muted-foreground">Estado</dt>
          <dd>
            <EstadoBadge tono={tonoDeEstadoUsuario(data.estado)}>
              {ETIQUETA_ESTADO[data.estado]}
            </EstadoBadge>
          </dd>
          <dt className="font-medium text-muted-foreground">Fecha de alta</dt>
          <dd>{formatearFecha(data.createdAt)}</dd>
        </dl>
      )}
    </main>
  )
}
