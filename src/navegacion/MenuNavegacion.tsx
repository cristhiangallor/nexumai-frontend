import { NavLink } from 'react-router'

import { ConPermiso } from '@/core/permissions'

import { catalogoMenu, type EntradaMenu } from './catalogoMenu'

interface MenuNavegacionProps {
  /** Catálogo a renderizar. Por defecto, el catálogo real de la app. */
  entradas?: EntradaMenu[]
  /** Clases del `<nav>` contenedor. Por defecto, barra horizontal. */
  className?: string
  /** Clases de la lista `<ul>`. Por defecto, horizontal. */
  listClassName?: string
  /** Clases de cada `<NavLink>`. Por defecto, enlace de barra. */
  itemClassName?: string
}

/**
 * Menú dirigido por permisos: mapea el catálogo y muestra cada entrada solo si el
 * usuario tiene su clave, reutilizando <ConPermiso> (ocultar por defecto, NEX-9 §4).
 * No reimplementa la verificación. Como `usePermiso` es reactivo
 * (`useSyncExternalStore` sobre `core/session`), el menú se re-evalúa cuando la
 * sesión cambia (reautenticación/cierre) SIN recargar.
 *
 * La presentación es inyectable (className/listClassName/itemClassName) para que el
 * mismo menú/gating se pinte como barra (por defecto) o como sidebar vertical (AppShell
 * de la consola, F-004), sin duplicar la lógica de permisos.
 */
export function MenuNavegacion({
  entradas = catalogoMenu,
  className = 'border-b border-border p-4',
  listClassName = 'flex flex-wrap gap-4',
  itemClassName = 'text-sm font-medium text-foreground hover:underline aria-[current=page]:underline',
}: MenuNavegacionProps) {
  return (
    <nav aria-label="Navegación principal" className={className}>
      <ul className={listClassName}>
        {entradas.map((entrada) => (
          <ConPermiso key={entrada.ruta} clave={entrada.permiso}>
            <li>
              <NavLink to={entrada.ruta} className={itemClassName}>
                {entrada.etiqueta}
              </NavLink>
            </li>
          </ConPermiso>
        ))}
      </ul>
    </nav>
  )
}
