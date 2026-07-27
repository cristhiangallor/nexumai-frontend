import { Inbox, SearchX } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface AccionEstado {
  etiqueta: string
  onAccionar: () => void
}

interface EstadoVacioProps {
  /**
   * - `vacio`: no hay datos todavía (vacío genuino).
   * - `sin-resultados`: sí hay datos, pero el filtro no encontró coincidencias.
   */
  variante: 'vacio' | 'sin-resultados'
  /** Título opcional; la pantalla puede nombrar la entidad ("No hay usuarios"). */
  titulo?: string
  /** Descripción opcional que orienta al usuario. */
  descripcion?: string
  /** Acción opcional que inyecta la pantalla (crear el primero / limpiar filtros). */
  accion?: AccionEstado
}

// Contenido por defecto DISTINTO por variante: no decir "no hay usuarios" cuando sí los
// hay pero el filtro los ocultó. El componente NO conoce filtros ni permisos.
const CONTENIDO = {
  vacio: {
    Icono: Inbox,
    titulo: 'Aún no hay nada aquí',
    descripcion:
      'Cuando se agregue el primer registro, aparecerá en esta lista.',
  },
  'sin-resultados': {
    Icono: SearchX,
    titulo: 'Sin resultados',
    descripcion:
      'Ningún elemento coincide con los filtros. Prueba a ajustarlos.',
  },
} as const

/**
 * Estado vacío (Bloque 1 del sistema de diseño), en dos variantes visiblemente
 * distintas (ícono + mensaje). La acción es opcional: sin acción no se renderiza botón.
 * Sobrio: ícono lucide tenue + texto muted, centrado. `role="status"` (informativo, no
 * error) para que el lector de pantalla lo anuncie con cortesía.
 */
export function EstadoVacio({
  variante,
  titulo,
  descripcion,
  accion,
}: EstadoVacioProps) {
  const base = CONTENIDO[variante]
  const Icono = base.Icono

  return (
    <div
      role="status"
      className="flex flex-col items-center justify-center gap-3 p-8 text-center"
    >
      <Icono aria-hidden="true" className="size-10 text-muted-foreground/50" />
      <div className="space-y-1">
        <p className="font-medium text-foreground">{titulo ?? base.titulo}</p>
        <p className="text-sm text-muted-foreground">
          {descripcion ?? base.descripcion}
        </p>
      </div>
      {accion && (
        <Button
          type="button"
          variant="default"
          onClick={accion.onAccionar}
          className="mt-1"
        >
          {accion.etiqueta}
        </Button>
      )}
    </div>
  )
}
