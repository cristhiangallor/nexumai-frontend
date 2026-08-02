import { EstadoBadge, tonoDeEstadoUsuario } from '@/components/estados'
import type { EstadoUsuario } from '@/core/api'

// Etiqueta es-MX del estado. INLINE a propósito (no se importa `ETIQUETA_ESTADO` de la
// feature `usuarios`): así este componente NO se acopla a ese módulo y NEX-70 puede
// montarlo en el portal sin arrastrar la consola de usuarios. El tono sí es genérico
// (`components/estados`).
const ETIQUETA_ESTADO: Record<EstadoUsuario, string> = {
  INVITADO: 'Invitado',
  ACTIVO: 'Activo',
  DESACTIVADO: 'Desactivado',
}

/**
 * SOLO los campos VISIBLES del perfil. A propósito NO incluye `permisos[]` (array técnico
 * de gating) ni `sesionExpiraEn`: al no recibirlos, este componente NO puede filtrarlos
 * por construcción de tipos. `empresa` es el NOMBRE del tenant (el contrato no da id).
 */
export interface DatosPerfil {
  nombre: string
  correo: string
  rol: string | null
  empresa: string
  estado: EstadoUsuario
}

/**
 * Presentación PURA del perfil (solo lectura). Recibe los datos por props y los pinta; no
 * sabe de dónde vienen (sesión, /me…) ni en qué layout vive. Es la COSTURA para NEX-70:
 * el portal montará este mismo componente en su AppShell. Estructura semántica (`<dl>`),
 * como el detalle de F-009.
 */
export function PerfilDetalle({
  nombre,
  correo,
  rol,
  empresa,
  estado,
}: DatosPerfil) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
      <dt className="font-medium text-muted-foreground">Nombre</dt>
      <dd>{nombre}</dd>
      <dt className="font-medium text-muted-foreground">Correo</dt>
      <dd>{correo}</dd>
      <dt className="font-medium text-muted-foreground">Empresa</dt>
      <dd>{empresa}</dd>
      <dt className="font-medium text-muted-foreground">Rol</dt>
      <dd>
        {rol ?? <span className="text-muted-foreground">Sin rol asignado</span>}
      </dd>
      <dt className="font-medium text-muted-foreground">Estado</dt>
      <dd>
        <EstadoBadge tono={tonoDeEstadoUsuario(estado)}>
          {ETIQUETA_ESTADO[estado]}
        </EstadoBadge>
      </dd>
    </dl>
  )
}
