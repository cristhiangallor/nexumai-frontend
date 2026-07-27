import { TriangleAlert } from 'lucide-react'

interface EstadoErrorProps {
  /** Mensaje HUMANO (nunca el error técnico crudo). */
  mensaje?: string
  /** Manejador de reintento opcional: si se recibe, se muestra el botón; si no, no. */
  onReintentar?: () => void
}

/**
 * Estado de error: algo se ROMPIÓ (falla de carga/red), tono danger soft. Muestra un
 * mensaje humano, nunca el error técnico crudo. `role="alert"` (asertivo), como el
 * banner de error del login.
 *
 * NO cubre `403` (eso es `AccesoDenegado`, F-003) ni `401` (lo maneja `core/http`):
 * "error" aquí significa que algo se rompió, no falta de permisos.
 */
export function EstadoError({ mensaje, onReintentar }: EstadoErrorProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-md bg-danger-soft p-8 text-center"
    >
      <TriangleAlert aria-hidden="true" className="size-8 text-danger-text" />
      <p className="text-sm text-danger-text">
        {mensaje ??
          'Ocurrió un error al cargar la información. Inténtalo de nuevo.'}
      </p>
      {onReintentar && (
        <button
          type="button"
          onClick={onReintentar}
          className="rounded-md border border-danger-text/30 px-4 py-2 text-sm font-medium text-danger-text hover:bg-danger-text/10"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}
