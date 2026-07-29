// Filtros del listado: nombre + correo (dos campos SEPARADOS a propósito — se combinan
// con AND en el servidor) y estado (select nativo). Los campos de texto se aplican con
// debounce para no disparar un request por cada tecla; el estado se aplica al instante.
//
// La fuente de verdad es la URL (ver useConsultaUsuarios): aquí solo hay estado LOCAL
// transitorio para el texto en curso, sincronizado con la consulta cuando cambia desde
// fuera (limpiar filtros, botón atrás).

import { useEffect, useState } from 'react'

import type { EstadoUsuario } from '@/core/api'

import { type ConsultaUsuarios, ESTADOS_USUARIO } from './consultaUsuarios'
import { ETIQUETA_ESTADO } from './etiquetas'

/** Retardo del debounce de los campos de texto (ms). */
const RETARDO_DEBOUNCE = 300

const CLASE_CAMPO =
  'mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring'

interface FiltrosUsuariosProps {
  consulta: ConsultaUsuarios
  onFiltrar: (
    parcial: Partial<Pick<ConsultaUsuarios, 'nombre' | 'email'>> & {
      estado?: EstadoUsuario | null
    },
  ) => void
}

export function FiltrosUsuarios({ consulta, onFiltrar }: FiltrosUsuariosProps) {
  const [nombre, setNombre] = useState(consulta.nombre)
  const [email, setEmail] = useState(consulta.email)

  // Sincroniza el texto local si la consulta cambia desde FUERA (limpiar filtros, botón
  // atrás). Patrón React de "ajustar estado en render" comparando con el valor previo:
  // no es un efecto (evita renders en cascada). Nuestros propios commits del debounce ya
  // dejan `consulta` == local, así que no reescriben lo que el usuario está tecleando.
  const [consultaPrev, setConsultaPrev] = useState({
    nombre: consulta.nombre,
    email: consulta.email,
  })
  if (
    consultaPrev.nombre !== consulta.nombre ||
    consultaPrev.email !== consulta.email
  ) {
    setConsultaPrev({ nombre: consulta.nombre, email: consulta.email })
    setNombre(consulta.nombre)
    setEmail(consulta.email)
  }

  // Debounce conjunto: envía ambos campos juntos tras el retardo, evitando que un campo
  // pise al otro. No dispara si el texto local ya coincide con la consulta (montaje /
  // sincronización externa).
  useEffect(() => {
    if (nombre === consulta.nombre && email === consulta.email) return
    const temporizador = setTimeout(
      () => onFiltrar({ nombre, email }),
      RETARDO_DEBOUNCE,
    )
    return () => clearTimeout(temporizador)
  }, [nombre, email, consulta.nombre, consulta.email, onFiltrar])

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div>
        <label
          htmlFor="filtro-nombre"
          className="block text-sm font-medium text-foreground"
        >
          Nombre
        </label>
        <input
          id="filtro-nombre"
          type="text"
          value={nombre}
          onChange={(evento) => setNombre(evento.target.value)}
          placeholder="Buscar por nombre"
          className={CLASE_CAMPO}
        />
      </div>

      <div>
        <label
          htmlFor="filtro-email"
          className="block text-sm font-medium text-foreground"
        >
          Correo
        </label>
        <input
          id="filtro-email"
          type="text"
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
          placeholder="Buscar por correo"
          className={CLASE_CAMPO}
        />
      </div>

      <div>
        <label
          htmlFor="filtro-estado"
          className="block text-sm font-medium text-foreground"
        >
          Estado
        </label>
        <select
          id="filtro-estado"
          value={consulta.estado ?? ''}
          onChange={(evento) =>
            onFiltrar({
              estado:
                evento.target.value === ''
                  ? null
                  : (evento.target.value as EstadoUsuario),
            })
          }
          className={CLASE_CAMPO}
        >
          <option value="">Todos</option>
          {ESTADOS_USUARIO.map((estado) => (
            <option key={estado} value={estado}>
              {ETIQUETA_ESTADO[estado]}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
