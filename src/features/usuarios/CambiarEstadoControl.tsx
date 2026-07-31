import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import type { EstadoUsuario } from '@/core/api'
import { ApiError } from '@/core/http'

import { useCambiarEstadoUsuario } from './useCambiarEstadoUsuario'

const ID_CONFIRMAR = 'confirmar-desactivar-texto'

/**
 * Mensaje de error del PUT. El `403` es NEUTRO e indistinguible (permiso o jerarquía, no
 * se sabe; cuerpo vacío, no se infiere). El `404` reusa el tono neutro del detalle.
 */
function mensajeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403)
      return 'No se pudo cambiar el estado de este usuario.'
    if (error.status === 404) return 'No encontramos este usuario.'
  }
  return 'No se pudo cambiar el estado. Inténtalo de nuevo.'
}

interface CambiarEstadoControlProps {
  usuarioId: string
  estadoActual: EstadoUsuario
}

/**
 * Control de estado dentro del detalle (NEX-49). Solo se monta con
 * `usuario.cambiar_estado`. Según el estado ACTUAL:
 *  - ACTIVO → "Desactivar" con confirmación en dos pasos INLINE (no modal).
 *  - DESACTIVADO → "Reactivar" directo (benigno y reversible).
 *  - INVITADO → sin control; nota de por qué (el paso INVITADO→ACTIVO es de NEX-69).
 *
 * Al colapsar la confirmación (Cancelar, Escape o éxito) el foco VUELVE al botón que
 * reaparece, para no perderlo al `body` (fallo accesible clásico de estos patrones).
 */
export function CambiarEstadoControl({
  usuarioId,
  estadoActual,
}: CambiarEstadoControlProps) {
  const cambiar = useCambiarEstadoUsuario(usuarioId)
  const [confirmando, setConfirmando] = useState(false)

  const principalRef = useRef<HTMLButtonElement>(null)
  const cancelarRef = useRef<HTMLButtonElement>(null)
  const previoConfirmando = useRef(false)

  // Gestión del foco: al ABRIR la confirmación, va a "Cancelar" (acción segura: un Enter
  // accidental cancela, no desactiva). Al CERRARLA, vuelve al botón principal que
  // reaparece. No roba foco en el montaje inicial (previo === actual === false).
  useEffect(() => {
    if (confirmando && !previoConfirmando.current) {
      cancelarRef.current?.focus()
    } else if (!confirmando && previoConfirmando.current) {
      principalRef.current?.focus()
    }
    previoConfirmando.current = confirmando
  }, [confirmando])

  function onConfirmarDesactivar() {
    cambiar.mutate(
      { estado: 'DESACTIVADO' },
      // Éxito o error: la confirmación se COLAPSA (no queda "¿Seguro?" a medias); el
      // error se muestra en el banner de abajo.
      {
        onSuccess: () => setConfirmando(false),
        onError: () => setConfirmando(false),
      },
    )
  }

  function onReactivar() {
    cambiar.mutate({ estado: 'ACTIVO' })
  }

  // Escape cancela mientras la confirmación está abierta (y no hay envío en curso). Como
  // el foco vive dentro del grupo, un listener de documento lo cubre desde cualquier
  // elemento sin colgar un handler de teclado en el `<div>` no interactivo.
  const cambiarPendiente = cambiar.isPending
  useEffect(() => {
    if (!confirmando) return
    function onTecla(evento: globalThis.KeyboardEvent) {
      if (evento.key === 'Escape' && !cambiarPendiente) {
        setConfirmando(false)
      }
    }
    document.addEventListener('keydown', onTecla)
    return () => document.removeEventListener('keydown', onTecla)
  }, [confirmando, cambiarPendiente])

  // Estado enviado en la última mutación → texto del banner de éxito.
  const mensajeExito =
    cambiar.variables?.estado === 'DESACTIVADO'
      ? 'Usuario desactivado.'
      : 'Usuario reactivado.'

  if (estadoActual === 'INVITADO') {
    return (
      <p className="mt-2 text-sm text-muted-foreground">
        Pendiente de aceptar la invitación.
      </p>
    )
  }

  return (
    <div className="mt-2">
      {estadoActual === 'ACTIVO' ? (
        confirmando ? (
          <div
            role="group"
            aria-labelledby={ID_CONFIRMAR}
            className="rounded-md border border-border p-3"
          >
            <p id={ID_CONFIRMAR} className="text-sm text-foreground">
              ¿Desactivar a este usuario? Perderá el acceso de inmediato.
            </p>
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={onConfirmarDesactivar}
                disabled={cambiar.isPending}
              >
                {cambiar.isPending ? 'Desactivando…' : 'Sí, desactivar'}
              </Button>
              <Button
                ref={cancelarRef}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmando(false)}
                disabled={cambiar.isPending}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button
            ref={principalRef}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setConfirmando(true)}
          >
            Desactivar
          </Button>
        )
      ) : (
        // DESACTIVADO → reactivar directo.
        <Button
          ref={principalRef}
          type="button"
          variant="default"
          size="sm"
          onClick={onReactivar}
          disabled={cambiar.isPending}
        >
          {cambiar.isPending ? 'Reactivando…' : 'Reactivar'}
        </Button>
      )}

      {cambiar.isError && (
        <p
          role="alert"
          className="mt-2 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger-text"
        >
          {mensajeError(cambiar.error)}
        </p>
      )}
      {cambiar.isSuccess && (
        <p
          role="status"
          className="mt-2 rounded-md bg-info-soft px-3 py-2 text-sm text-info-text"
        >
          {mensajeExito}
        </p>
      )}
    </div>
  )
}
