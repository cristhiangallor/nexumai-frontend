import { cn } from '@/lib/utils'
import { MenuNavegacion } from '@/navegacion/MenuNavegacion'

interface SidebarProps {
  /** id para enlazar con `aria-controls` de los toggles del header. */
  id?: string
  /** Clases de posicionamiento/visibilidad que inyecta el AppShell (colapso/drawer). */
  className?: string
}

/**
 * Sidebar navy de la consola (ADR-014). Reutiliza el menú dirigido por datos + gating
 * de F-003 (`MenuNavegacion` sobre `catalogoMenu` + `ConPermiso`): solo lo re-viste en
 * vertical con los tokens del manual (`--color-sidebar` navy #000D31, ítem activo en
 * morado primario). NO reimplementa el filtrado por permiso.
 *
 * El posicionamiento (fijo en escritorio, drawer en móvil, oculto al colapsar) lo
 * controla el AppShell vía `className`; este componente solo pinta el contenido.
 */
export function Sidebar({ id, className }: SidebarProps) {
  return (
    <aside
      id={id}
      className={cn(
        'flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground',
        className,
      )}
    >
      <div className="px-4 py-4 text-lg font-semibold tracking-tight">
        Nexum Compliance
      </div>
      <MenuNavegacion
        className="px-3 pb-4"
        listClassName="flex flex-col gap-1"
        itemClassName="block rounded-md px-3 py-2 text-sm font-medium text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground aria-[current=page]:bg-sidebar-primary aria-[current=page]:text-sidebar-primary-foreground"
      />
    </aside>
  )
}
