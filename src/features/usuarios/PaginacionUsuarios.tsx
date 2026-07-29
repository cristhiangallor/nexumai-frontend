// Paginación del listado. Usa el total de `X-Total-Count` para numerar las páginas y
// mostrar el rango ("Mostrando 1–20 de 137"). Si el total es DESCONOCIDO (la cabecera
// no llegó: proxy/CORS), degrada con elegancia: sin números ni total, solo Anterior/
// Siguiente, deshabilitando "Siguiente" cuando la página no viene llena.

import { Button } from '@/components/ui/button'

import { calcularTotalPaginas, paginasVisibles } from './paginacion'

interface PaginacionUsuariosProps {
  /** Página actual (1-based). */
  pagina: number
  /** Total de elementos, o `null` si la cabecera no llegó. */
  total: number | null
  /** Tamaño de página. */
  tamano: number
  /** Cantidad de filas en la página actual (para inferir "última" sin total). */
  cantidadEnPagina: number
  onIrAPagina: (pagina: number) => void
}

export function PaginacionUsuarios({
  pagina,
  total,
  tamano,
  cantidadEnPagina,
  onIrAPagina,
}: PaginacionUsuariosProps) {
  const totalConocido = total !== null
  const totalPaginas = totalConocido
    ? calcularTotalPaginas(total, tamano)
    : null

  const desde = (pagina - 1) * tamano + 1
  const hasta = totalConocido
    ? Math.min(pagina * tamano, total)
    : desde + cantidadEnPagina - 1

  const resumen = totalConocido
    ? `Mostrando ${desde}–${hasta} de ${total}`
    : `Página ${pagina}`

  const sinAnterior = pagina <= 1
  const sinSiguiente = totalConocido
    ? pagina >= (totalPaginas as number)
    : cantidadEnPagina < tamano

  return (
    <nav
      aria-label="Paginación"
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-muted-foreground">{resumen}</p>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={sinAnterior}
          onClick={() => onIrAPagina(pagina - 1)}
        >
          Anterior
        </Button>

        {totalConocido &&
          paginasVisibles(pagina, totalPaginas as number).map((item, indice) =>
            item === 'gap' ? (
              <span
                key={`gap-${indice}`}
                aria-hidden="true"
                className="px-2 text-muted-foreground"
              >
                …
              </span>
            ) : (
              <Button
                key={item}
                type="button"
                variant={item === pagina ? 'default' : 'ghost'}
                size="sm"
                aria-current={item === pagina ? 'page' : undefined}
                aria-label={`Página ${item}`}
                onClick={() => onIrAPagina(item)}
              >
                {item}
              </Button>
            ),
          )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={sinSiguiente}
          onClick={() => onIrAPagina(pagina + 1)}
        >
          Siguiente
        </Button>
      </div>
    </nav>
  )
}
