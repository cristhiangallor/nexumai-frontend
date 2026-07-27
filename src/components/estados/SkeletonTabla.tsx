import { Skeleton } from '@/components/ui/skeleton'

interface SkeletonTablaProps {
  /** Número de columnas. */
  columnas: number
  /** Número de filas (por defecto 5). */
  filas?: number
}

/**
 * Skeleton genérico con FORMA de tabla: `columnas` × `filas` de bloques pulsantes
 * (`Skeleton`, superficie muted). Es decorativo (`aria-hidden`); un `role="status"`
 * oculto anuncia "Cargando…" a lectores de pantalla, para no anunciar una tabla vacía.
 * Genérico por forma: no es el skeleton de ninguna pantalla concreta.
 */
export function SkeletonTabla({ columnas, filas = 5 }: SkeletonTablaProps) {
  return (
    <div>
      <span role="status" className="sr-only">
        Cargando…
      </span>
      <div aria-hidden="true" className="space-y-2">
        {Array.from({ length: filas }).map((_, indiceFila) => (
          <div key={indiceFila} className="flex gap-3">
            {Array.from({ length: columnas }).map((_, indiceColumna) => (
              <Skeleton key={indiceColumna} className="h-8 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
