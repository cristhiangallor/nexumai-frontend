import { NavLink } from 'react-router'

import { ConPermiso } from '@/core/permissions'

import { catalogoMenu, type EntradaMenu } from './catalogoMenu'

interface MenuNavegacionProps {
  /** Catálogo a renderizar. Por defecto, el catálogo real de la app. */
  entradas?: EntradaMenu[]
}

/**
 * Menú dirigido por permisos: mapea el catálogo y muestra cada entrada solo si el
 * usuario tiene su clave, reutilizando <ConPermiso> (ocultar por defecto, NEX-9 §4).
 * No reimplementa la verificación. Como `usePermiso` es reactivo
 * (`useSyncExternalStore` sobre `core/session`), el menú se re-evalúa cuando la
 * sesión cambia (reautenticación/cierre) SIN recargar.
 */
export function MenuNavegacion({
  entradas = catalogoMenu,
}: MenuNavegacionProps) {
  return (
    <nav
      aria-label="Navegación principal"
      className="border-b border-border p-4"
    >
      <ul className="flex flex-wrap gap-4">
        {entradas.map((entrada) => (
          <ConPermiso key={entrada.ruta} clave={entrada.permiso}>
            <li>
              <NavLink
                to={entrada.ruta}
                className="text-sm font-medium text-foreground hover:underline aria-[current=page]:underline"
              >
                {entrada.etiqueta}
              </NavLink>
            </li>
          </ConPermiso>
        ))}
      </ul>
    </nav>
  )
}
