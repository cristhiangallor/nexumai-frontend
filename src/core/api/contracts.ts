// Tipos de contrato de la API, escritos A MANO para F-002-login.
//
// Decisión (spec 54329347): mientras no lleguen historias con muchos tipos, NO se
// monta el pipeline de openapi-typescript (NEX-41). Estos dos contratos son pequeños
// y están documentados, así que se tipan a mano aquí. Cuando exista el generador,
// este archivo se reemplaza por los tipos generados desde `api/openapi.yaml`.
//
// Los NOMBRES de campo replican el formato de cable del backend (español canónico:
// nombre, correo, estado, empresa, permisos…). No renombrar por conveniencia.

/** Cuerpo de `POST /login`. El `slug` identifica el tenant y viene de la ruta. */
export interface LoginRequest {
  slug: string
  email: string
  password: string
}

/** `200` de `POST /login`. Solo el token: sin PII ni claims (ADR-007). */
export interface LoginResponse {
  token: string
}

/**
 * Cuerpo de `POST /password/recuperacion` (endpoint ANÓNIMO, NEX-45). Responde `202`
 * exista o no la cuenta (anti-enumeración); el enlace se envía por correo, nunca en la
 * respuesta HTTP.
 */
export interface RecuperarPasswordRequest {
  slug: string
  email: string
}

/**
 * Cuerpo de `POST /password` (endpoint ANÓNIMO, NEX-45; también lo usa la activación de
 * invitado, NEX-47). `token` viene del enlace del correo. `204` éxito; `400` si la
 * contraseña no cumple la política (mínimo 12); `422` token inválido/expirado/ya usado.
 */
export interface EstablecerPasswordRequest {
  slug: string
  token: string
  password: string
}

/** Estado del usuario en su tenant. Tras un login exitoso siempre es `ACTIVO`. */
export type EstadoUsuario = 'INVITADO' | 'ACTIVO' | 'DESACTIVADO'

/**
 * Rol que el actor puede OTORGAR al invitar (`GET /usuarios/roles-asignables`, gate
 * `usuario.invitar`). El backend YA filtra por jerarquía: la UI pinta lo que llega y NO
 * replica lógica de roles. Colección cerrada, SIN orden garantizado (se ordena en el
 * front si se quiere).
 */
export interface RolAsignable {
  id: string
  nombre: string
}

/**
 * Cuerpo de `POST /usuarios/invitaciones` (gate `usuario.invitar`). `rolId` es el `id`
 * del rol elegido del catálogo. La UI NUNCA construye ni envía el tenant: lo deriva el
 * backend del token.
 */
export interface InvitarUsuarioRequest {
  nombre: string
  email: string
  rolId: string
}

/**
 * `201` de `POST /usuarios/invitaciones`. El token de activación NUNCA viene aquí (solo
 * por correo).
 */
export interface InvitarUsuarioResponse {
  usuarioId: string
  nombre: string
  email: string
  rolId: string
}

/**
 * Cuerpo de `PUT /usuarios/{id}/rol` (gate `usuario.asignar_rol`, NEX-48). `204` éxito;
 * `403` sin permiso O violación de jerarquía (indistinguible, cuerpo vacío); `404`
 * destino inexistente/otro tenant; `422` rolId no válido del tenant.
 */
export interface AsignarRolRequest {
  rolId: string
}

/**
 * Fila de `GET /usuarios` y cuerpo de `GET /usuarios/{id}` (gate `usuario.ver`).
 *
 * Los nombres replican el formato de cable de ESTE endpoint: `email` y `createdAt`
 * (no `correo`/`sesionExpiraEn` como en `/me`). No renombrar por consistencia con
 * otros contratos: cada endpoint transporta su forma tal cual.
 *
 * `rol` es `string | null` de forma legítima (un INVITADO puede no tener rol). Se
 * transporta el `null` fielmente: la CAPA DE DATOS no lo esconde con un valor por
 * defecto — es la UI quien decide cómo mostrar la ausencia.
 */
export interface UsuarioResumen {
  /** UUID del usuario. Siempre presente. Es el id de enlace al detalle. */
  id: string
  nombre: string
  email: string
  rol: string | null
  estado: EstadoUsuario
  /** Fecha-hora ISO 8601 de alta. Campo ordenable y por defecto del listado. */
  createdAt: string
}

/** `200` de `GET /me` (gate universal `usuario.ver_propio`). */
export interface PerfilResponse {
  nombre: string
  correo: string
  /** `null` solo si es INVITADO sin rol; tras login siempre hay rol. */
  rol: string | null
  estado: EstadoUsuario
  /** Nombre de la razón social del tenant, no su id. */
  empresa: string
  /** Fecha-hora ISO 8601. Sesión de 8h, sin refresh token. */
  sesionExpiraEn: string
  /**
   * Claves de permiso `modulo.accion` que el backend evalúa en cada gate.
   * Nunca `null`, orden alfabético. Informativo para gating de UI (NEX-51),
   * NO es seguridad: el backend siempre revalida.
   */
  permisos: string[]
}
