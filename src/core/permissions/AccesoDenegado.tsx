import { useEffect, useRef } from 'react'

/**
 * Pantalla de acceso denegado (decisión de UX 1 de F-003; "sin permisos" como
 * estado de UI de primera clase, NEX-9 §4): mensaje explícito, no redirección
 * silenciosa. Componente reutilizable — el guard de ruta (bloque 2) la usará al
 * entrar (incl. por URL directa) a algo sin permiso.
 *
 * Recuerda: el gating es EXPERIENCIA; el backend es el único enforcement.
 *
 * Accesibilidad: el contenedor es un `role="alert"` para que los lectores de
 * pantalla anuncien el estado, y el foco se mueve al encabezado al montar para que
 * el usuario aterrice en él.
 */
export function AccesoDenegado() {
  const encabezadoRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    encabezadoRef.current?.focus()
  }, [])

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div
        role="alert"
        className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center"
      >
        <h1
          ref={encabezadoRef}
          tabIndex={-1}
          className="m-0 mb-2 text-2xl font-medium tracking-normal text-foreground"
        >
          Acceso denegado
        </h1>
        <p className="text-muted-foreground">
          No tienes permiso para ver esta sección. Si crees que es un error,
          contacta a la persona administradora de tu empresa.
        </p>
      </div>
    </main>
  )
}
