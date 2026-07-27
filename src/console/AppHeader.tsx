import { Button } from '@/components/ui/button'

import { Breadcrumb } from './Breadcrumb'
import { UserMenu } from './UserMenu'

interface AppHeaderProps {
  /** Sidebar oculto en escritorio (colapsado). */
  colapsado: boolean
  /** Drawer del sidebar abierto en móvil. */
  drawerAbierto: boolean
  onToggleColapso: () => void
  onToggleDrawer: () => void
}

/** Ícono hamburguesa (móvil). Decorativo: el nombre accesible va en el botón. */
function IconoMenu() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

/** Ícono de colapso (escritorio). Decorativo. */
function IconoColapso() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="11 17 6 12 11 7" />
      <polyline points="18 17 13 12 18 7" />
    </svg>
  )
}

/**
 * Header de la consola (ADR-014): toggles del sidebar (hamburguesa en móvil, colapso en
 * escritorio) + breadcrumb (izquierda) + menú de usuario (derecha). Sin notificaciones
 * (diferidas). Los toggles exponen `aria-expanded`/`aria-controls` sobre el sidebar.
 */
export function AppHeader({
  colapsado,
  drawerAbierto,
  onToggleColapso,
  onToggleDrawer,
}: AppHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onToggleDrawer}
        aria-expanded={drawerAbierto}
        aria-controls="app-sidebar"
        aria-label={drawerAbierto ? 'Cerrar menú' : 'Abrir menú'}
        className="md:hidden"
      >
        <IconoMenu />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onToggleColapso}
        aria-expanded={!colapsado}
        aria-controls="app-sidebar"
        aria-label={colapsado ? 'Expandir menú' : 'Colapsar menú'}
        className="hidden md:inline-flex"
      >
        <IconoColapso />
      </Button>

      <Breadcrumb />

      <div className="ml-auto">
        <UserMenu />
      </div>
    </header>
  )
}
