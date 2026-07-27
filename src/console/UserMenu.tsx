import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { getPerfil } from '@/core/session'
import { useLogout } from '@/features/auth/useLogout'

/**
 * Menú de usuario del header (ADR-014): avatar (iniciales) + nombre + rol leídos de la
 * sesión (`getPerfil()`, poblado por login en F-002). Patrón de disclosure accesible:
 * el botón expone `aria-expanded`/`aria-controls`; Escape y clic-fuera cierran.
 *
 * El ítem "Cerrar sesión" es ESTRUCTURA / placeholder consciente (frontera planeada con
 * NEX-44, no botón olvidado): está presente y es foco-navegable, pero SIN lógica. El
 * cableado (POST /logout → limpiar sesión → redirigir) es NEX-44. Sin notificaciones.
 */
export function UserMenu() {
  const perfil = getPerfil()
  const [abierto, setAbierto] = useState(false)
  const contenedorRef = useRef<HTMLDivElement>(null)
  const { cerrarSesion, cerrandoSesion } = useLogout()

  useEffect(() => {
    if (!abierto) {
      return
    }
    function alClicFuera(evento: MouseEvent) {
      if (
        contenedorRef.current &&
        !contenedorRef.current.contains(evento.target as Node)
      ) {
        setAbierto(false)
      }
    }
    function alTeclado(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        setAbierto(false)
      }
    }
    document.addEventListener('mousedown', alClicFuera)
    document.addEventListener('keydown', alTeclado)
    return () => {
      document.removeEventListener('mousedown', alClicFuera)
      document.removeEventListener('keydown', alTeclado)
    }
  }, [abierto])

  if (!perfil) {
    return null
  }

  const iniciales = perfil.nombre.trim().charAt(0).toUpperCase()

  return (
    <div ref={contenedorRef} className="relative">
      <Button
        type="button"
        variant="ghost"
        aria-expanded={abierto}
        aria-controls="user-menu-panel"
        onClick={() => setAbierto((valor) => !valor)}
        className="h-auto gap-2 px-2 py-1"
      >
        <span
          aria-hidden="true"
          className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground"
        >
          {iniciales}
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-medium text-foreground">
            {perfil.nombre}
          </span>
          <span className="block text-xs text-muted-foreground">
            {perfil.rol ?? '—'}
          </span>
        </span>
      </Button>

      {abierto && (
        <div
          id="user-menu-panel"
          className="absolute right-0 z-50 mt-1 w-48 rounded-md border border-border bg-popover p-1 shadow"
        >
          {/* Cierre de sesión (NEX-44): dispara el servicio `useLogout`. Estado de
              carga en la propia acción (deshabilitada + texto), sin doble disparo. */}
          <Button
            type="button"
            variant="ghost"
            onClick={cerrarSesion}
            disabled={cerrandoSesion}
            className="w-full justify-start"
          >
            {cerrandoSesion ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </Button>
        </div>
      )}
    </div>
  )
}
