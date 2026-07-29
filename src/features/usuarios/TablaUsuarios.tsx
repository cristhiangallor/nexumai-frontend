// Tabla de usuarios para escritorio (en móvil se usan tarjetas apiladas, ver
// TarjetasUsuarios). Solo lectura: cada fila enlaza al detalle. Encabezados ordenables
// para nombre/correo/estado/fecha; `rol` NO es ordenable (el contrato lo marca
// permanente, no transitorio): su encabezado va deshabilitado a propósito.

import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react'
import { Link } from 'react-router'

import { EstadoBadge, tonoDeEstadoUsuario } from '@/components/estados'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { UsuarioResumen } from '@/core/api'
import { rutaUsuario } from '@/rutas'

import type { CampoOrden, Orden } from './consultaUsuarios'
import { ETIQUETA_ESTADO, formatearFecha } from './etiquetas'

interface TablaUsuariosProps {
  usuarios: UsuarioResumen[]
  orden: Orden
  onOrdenarPor: (campo: CampoOrden) => void
}

/** Indicador visual de orden: activo → dirección; inactivo → doble chevron tenue. */
function IndicadorOrden({
  activo,
  direccion,
}: {
  activo: boolean
  direccion: Orden['direccion']
}) {
  if (!activo) {
    return (
      <ChevronsUpDown
        aria-hidden="true"
        className="size-4 text-muted-foreground/40"
      />
    )
  }
  const Icono = direccion === 'asc' ? ChevronUp : ChevronDown
  return <Icono aria-hidden="true" className="size-4 text-primary" />
}

/** Encabezado ordenable: `<th>` con `aria-sort` y un `<button>` (accesible por teclado). */
function EncabezadoOrdenable({
  campo,
  etiqueta,
  orden,
  onOrdenarPor,
}: {
  campo: CampoOrden
  etiqueta: string
  orden: Orden
  onOrdenarPor: (campo: CampoOrden) => void
}) {
  const activo = orden.campo === campo
  const ariaSort = activo
    ? orden.direccion === 'asc'
      ? 'ascending'
      : 'descending'
    : 'none'

  return (
    <TableHead aria-sort={ariaSort} scope="col">
      <button
        type="button"
        onClick={() => onOrdenarPor(campo)}
        className="inline-flex items-center gap-1 rounded font-medium text-foreground hover:text-primary focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        {etiqueta}
        <IndicadorOrden activo={activo} direccion={orden.direccion} />
      </button>
    </TableHead>
  )
}

export function TablaUsuarios({
  usuarios,
  orden,
  onOrdenarPor,
}: TablaUsuariosProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <EncabezadoOrdenable
            campo="nombre"
            etiqueta="Nombre"
            orden={orden}
            onOrdenarPor={onOrdenarPor}
          />
          <EncabezadoOrdenable
            campo="email"
            etiqueta="Correo"
            orden={orden}
            onOrdenarPor={onOrdenarPor}
          />
          {/* `rol` no es ordenable por contrato: encabezado inerte, no un botón. */}
          <TableHead scope="col" aria-disabled="true">
            <span className="text-muted-foreground">Rol</span>
          </TableHead>
          <EncabezadoOrdenable
            campo="estado"
            etiqueta="Estado"
            orden={orden}
            onOrdenarPor={onOrdenarPor}
          />
          <EncabezadoOrdenable
            campo="createdAt"
            etiqueta="Fecha"
            orden={orden}
            onOrdenarPor={onOrdenarPor}
          />
        </TableRow>
      </TableHeader>
      <TableBody>
        {usuarios.map((usuario) => (
          <TableRow key={usuario.id}>
            <TableCell>
              <Link
                to={rutaUsuario(usuario.id)}
                className="rounded font-medium text-primary hover:underline focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                {usuario.nombre}
              </Link>
            </TableCell>
            <TableCell>{usuario.email}</TableCell>
            <TableCell>
              {usuario.rol ?? (
                <span className="text-muted-foreground">Sin rol asignado</span>
              )}
            </TableCell>
            <TableCell>
              <EstadoBadge tono={tonoDeEstadoUsuario(usuario.estado)}>
                {ETIQUETA_ESTADO[usuario.estado]}
              </EstadoBadge>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatearFecha(usuario.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
