// Vista de usuarios para móvil: tarjetas de campos apilados, sin scroll horizontal (la
// tabla vive solo en escritorio). Cada tarjeta ENTERA es el enlace al detalle.

import { Link } from 'react-router'

import { EstadoBadge, tonoDeEstadoUsuario } from '@/components/estados'
import type { UsuarioResumen } from '@/core/api'
import { rutaUsuario } from '@/rutas'

import { ETIQUETA_ESTADO, formatearFecha } from './etiquetas'

/** Un campo apilado (etiqueta arriba, valor abajo) dentro de la tarjeta. */
function Campo({
  etiqueta,
  children,
}: {
  etiqueta: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd className="break-words">{children}</dd>
    </div>
  )
}

export function TarjetasUsuarios({ usuarios }: { usuarios: UsuarioResumen[] }) {
  return (
    <ul className="space-y-3">
      {usuarios.map((usuario) => (
        <li key={usuario.id}>
          <Link
            to={rutaUsuario(usuario.id)}
            className="block rounded-lg border border-border p-4 hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-primary">{usuario.nombre}</span>
              <EstadoBadge tono={tonoDeEstadoUsuario(usuario.estado)}>
                {ETIQUETA_ESTADO[usuario.estado]}
              </EstadoBadge>
            </div>
            <dl className="mt-3 space-y-2 text-sm">
              <Campo etiqueta="Correo">{usuario.email}</Campo>
              <Campo etiqueta="Rol">
                {usuario.rol ?? (
                  <span className="text-muted-foreground">
                    Sin rol asignado
                  </span>
                )}
              </Campo>
              <Campo etiqueta="Fecha">
                {formatearFecha(usuario.createdAt)}
              </Campo>
            </dl>
          </Link>
        </li>
      ))}
    </ul>
  )
}
