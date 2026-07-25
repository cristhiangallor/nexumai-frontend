import { useEffect, useState } from 'react'
import { Outlet } from 'react-router'

import { cn } from '@/lib/utils'

import { AppHeader } from './AppHeader'
import { Sidebar } from './Sidebar'

/**
 * AppShell de la consola (ADR-014): marco de tres zonas — sidebar navy (izquierda) +
 * header (superior) + área de contenido (`<Outlet/>`). Layout route de React Router v7.
 * Reutiliza el gating/menú de F-003 (vía Sidebar → MenuNavegacion); la página enrutada
 * aporta su propio `<main>`.
 *
 * Responsive (ADR-014):
 *  - Escritorio: el sidebar se COLAPSA a oculto (el catálogo no tiene íconos aún, así que
 *    colapsar a íconos se difiere; ver reporte). Toggle con `aria-expanded`.
 *  - Móvil: el sidebar es un DRAWER que se abre/cierra sobre el contenido (backdrop +
 *    Escape lo cierran). Estado de colapso EN MEMORIA (no se persiste).
 */
export function AppShell() {
  const [colapsado, setColapsado] = useState(false)
  const [drawerAbierto, setDrawerAbierto] = useState(false)

  useEffect(() => {
    if (!drawerAbierto) {
      return
    }
    function alTeclado(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        setDrawerAbierto(false)
      }
    }
    document.addEventListener('keydown', alTeclado)
    return () => document.removeEventListener('keydown', alTeclado)
  }, [drawerAbierto])

  return (
    <div className="flex flex-1 text-left">
      {drawerAbierto && (
        <button
          type="button"
          aria-label="Cerrar menú lateral"
          onClick={() => setDrawerAbierto(false)}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}

      <Sidebar
        id="app-sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-40 transition-transform md:static md:z-auto md:transition-none',
          drawerAbierto ? 'translate-x-0' : '-translate-x-full',
          colapsado ? 'md:hidden' : 'md:flex md:translate-x-0',
        )}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          colapsado={colapsado}
          drawerAbierto={drawerAbierto}
          onToggleColapso={() => setColapsado((valor) => !valor)}
          onToggleDrawer={() => setDrawerAbierto((valor) => !valor)}
        />
        <Outlet />
      </div>
    </div>
  )
}
