import { Link, useMatches } from 'react-router'

/**
 * Metadata de ruta legible por el breadcrumb. Convención DIRIGIDA POR DATOS: cada ruta
 * declara su `handle: { titulo }` en el router; el breadcrumb la lee con `useMatches()`.
 * Sin switch hardcodeado por pantalla — al añadir rutas (EPIC 3+) basta su `handle`.
 */
export interface HandleRuta {
  titulo?: string
}

/**
 * Breadcrumb del header derivado de la ruta activa (ADR-014). Recorre los `matches`
 * de React Router y arma un rastro con los que declaran `handle.titulo`. El último es
 * la página actual (`aria-current="page"`, no enlazable); los anteriores enlazan.
 */
export function Breadcrumb() {
  const matches = useMatches()
  const rastro = matches
    .map((match) => ({
      id: match.id,
      pathname: match.pathname,
      titulo: (match.handle as HandleRuta | undefined)?.titulo,
    }))
    .filter(
      (crumb): crumb is { id: string; pathname: string; titulo: string } =>
        Boolean(crumb.titulo),
    )

  if (rastro.length === 0) {
    return null
  }

  return (
    <nav aria-label="Ruta de navegación">
      <ol className="flex items-center gap-2 text-sm">
        {rastro.map((crumb, indice) => {
          const esUltimo = indice === rastro.length - 1
          return (
            <li key={crumb.id} className="flex items-center gap-2">
              {indice > 0 && (
                <span aria-hidden="true" className="text-muted-foreground">
                  /
                </span>
              )}
              {esUltimo ? (
                <span
                  aria-current="page"
                  className="font-medium text-foreground"
                >
                  {crumb.titulo}
                </span>
              ) : (
                <Link
                  to={crumb.pathname}
                  className="text-muted-foreground hover:underline"
                >
                  {crumb.titulo}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
