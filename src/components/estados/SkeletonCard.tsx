import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton genérico con FORMA de tarjeta (encabezado + líneas de texto). Decorativo
 * (`aria-hidden`) + `role="status"` oculto "Cargando…". Genérico por forma: no es el
 * skeleton de ninguna pantalla concreta.
 */
export function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border p-4">
      <span role="status" className="sr-only">
        Cargando…
      </span>
      <div aria-hidden="true" className="space-y-3">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  )
}
