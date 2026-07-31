import { useMemo, useState } from 'react'

import { EstadoError } from '@/components/estados'
import { Button } from '@/components/ui/button'
import { ApiError } from '@/core/http'

import { useAsignarRol } from './useAsignarRol'
import { useRolesAsignablesDestino } from './useRolesAsignablesDestino'

// Valor centinela del <option> deshabilitado que representa el rol ACTUAL cuando NO está
// en el catálogo por destino (por D-2, un destino de nivel igual/superior al actor tiene
// su rol fuera del catálogo). Nunca se envía: el control no debe MENTIR sobre el estado
// actual ni facilitar un cambio accidental.
const SENTINEL_ACTUAL = '__rol_actual__'

const CLASE_CAMPO =
  'mt-1 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-base outline-none focus:ring-2 focus:ring-ring'

/**
 * Mensaje de error del PUT. El `403` es NEUTRO e indistinguible a propósito (permiso o
 * jerarquía, no se sabe; cuerpo vacío, no se infiere nada). El `404` reusa el tono neutro
 * del detalle. El resto, error general.
 */
function mensajeError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403)
      return 'No se pudo cambiar el rol de este usuario.'
    if (error.status === 404) return 'No encontramos este usuario.'
  }
  return 'No se pudo cambiar el rol. Inténtalo de nuevo.'
}

interface AsignarRolControlProps {
  usuarioId: string
  /** Rol ACTUAL del destino (nombre; `UsuarioResumen.rol` no trae id). `null` si no tiene. */
  rolActual: string | null
  /** Id del `<dt>Rol</dt>` para etiquetar el `<select>` (aria-labelledby). */
  etiquetaId: string
}

/**
 * Control editable de rol dentro del detalle (NEX-48). Solo se monta con
 * `usuario.asignar_rol`. Confirmación explícita: el cambio se aplica al pulsar Guardar,
 * no al cambiar el `<select>`. El backend es la autoridad; aquí no se replica jerarquía.
 */
export function AsignarRolControl({
  usuarioId,
  rolActual,
  etiquetaId,
}: AsignarRolControlProps) {
  const roles = useRolesAsignablesDestino(usuarioId)
  const asignar = useAsignarRol(usuarioId)

  const rolesOrdenados = useMemo(
    () =>
      [...(roles.data ?? [])].sort((a, b) =>
        a.nombre.localeCompare(b.nombre, 'es-MX'),
      ),
    [roles.data],
  )

  // Id del rol actual SI está en el catálogo (casado por nombre: el usuario no trae id).
  const idActualEnCatalogo = rolesOrdenados.find(
    (r) => r.nombre === rolActual,
  )?.id
  // Valor con el que arranca el control: el id actual si es asignable; si no, el centinela
  // (rol fuera del catálogo) o '' (sin rol).
  const valorActual =
    idActualEnCatalogo ?? (rolActual !== null ? SENTINEL_ACTUAL : '')

  const [rolId, setRolId] = useState(valorActual)

  // Resincroniza la selección cuando el catálogo carga o cuando `rolActual` cambia tras
  // el refetch del 204. La firma incluye `dataUpdatedAt` (cambia en cada fetch exitoso),
  // así que un refetch reajusta el control SIN pisar una edición en curso (firma estable
  // mientras el usuario teclea). El banner de éxito (asignar.isSuccess) es estado
  // independiente: este reajuste no lo borra.
  const [firmaSync, setFirmaSync] = useState('')
  const firma = `${rolActual ?? '∅'}|${roles.dataUpdatedAt}`
  if (roles.isSuccess && firma !== firmaSync) {
    setFirmaSync(firma)
    setRolId(valorActual)
  }

  // Catálogo caído: 403/404 no se reintentan (no ayuda; indistinguibles/ausente) → neutro;
  // 500/red sí (EstadoError con reintento).
  if (roles.isError) {
    const status = roles.error instanceof ApiError ? roles.error.status : 0
    if (status === 403 || status === 404) {
      return (
        <p role="status" className="text-sm text-muted-foreground">
          No se puede cambiar el rol de este usuario.
        </p>
      )
    }
    return (
      <EstadoError
        mensaje="No se pudo cargar el cambio de rol. Inténtalo de nuevo."
        onReintentar={() => roles.refetch()}
      />
    )
  }

  const catalogoCargando = roles.isPending
  const rolElegido = rolesOrdenados.find((r) => r.id === rolId)
  // Habilitado solo si hay un rol REAL elegido y difiere del actual.
  const puedeGuardar = Boolean(rolElegido) && rolElegido!.nombre !== rolActual

  function onGuardar() {
    if (!puedeGuardar) return
    asignar.mutate({ rolId })
  }

  return (
    <div>
      <select
        aria-labelledby={etiquetaId}
        value={rolId}
        onChange={(evento) => setRolId(evento.target.value)}
        disabled={catalogoCargando}
        className={CLASE_CAMPO}
      >
        {catalogoCargando ? (
          <option value="">Cargando…</option>
        ) : (
          <>
            {/* Rol actual NO asignable: se muestra como opción deshabilitada, para que el
                control nunca mienta sobre el estado actual. */}
            {idActualEnCatalogo === undefined &&
              (rolActual !== null ? (
                <option value={SENTINEL_ACTUAL} disabled>
                  {rolActual} (rol actual)
                </option>
              ) : (
                <option value="" disabled>
                  Sin rol asignado
                </option>
              ))}
            {rolesOrdenados.map((rol) => (
              <option key={rol.id} value={rol.id}>
                {rol.nombre}
              </option>
            ))}
          </>
        )}
      </select>

      {asignar.isError && (
        <p
          role="alert"
          className="mt-2 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger-text"
        >
          {mensajeError(asignar.error)}
        </p>
      )}
      {asignar.isSuccess && (
        <p
          role="status"
          className="mt-2 rounded-md bg-info-soft px-3 py-2 text-sm text-info-text"
        >
          Rol actualizado.
        </p>
      )}

      <div className="mt-2">
        <Button
          type="button"
          variant="default"
          onClick={onGuardar}
          disabled={!puedeGuardar || asignar.isPending}
        >
          {asignar.isPending ? 'Guardando…' : 'Guardar rol'}
        </Button>
      </div>
    </div>
  )
}
