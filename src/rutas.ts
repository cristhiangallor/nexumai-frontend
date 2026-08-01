/**
 * Fuente ÚNICA de rutas de la app (ADR-015 / NEX-65). Ningún otro archivo escribe
 * paths con literales: el router los DECLARA desde aquí (segmentos) y los consumidores
 * (redirecciones, catálogo del menú, destino post-login, guards) NAVEGAN desde aquí
 * (paths absolutos).
 *
 * Por qué centralizar: si algún día las rutas privadas deben llevar `/:slug`, el cambio
 * se concentra en este módulo en vez de propagarse por decenas de archivos. Hoy la
 * consola es slug-less; el `slug` vive SOLO en el login del tenant.
 */

/** Segmentos para la CONFIG del router (rutas anidadas relativas). */
export const SEGMENTOS = {
  /** Prefijo del layout de la consola: `/console`. */
  consola: 'console',
  /** Hijo relativo → `/console/inicio`. */
  inicio: 'inicio',
  /** Hijo relativo → `/console/perfil`. */
  perfil: 'perfil',
  /** Hijo relativo → `/console/usuarios` (listado; el detalle cuelga de aquí). */
  usuarios: 'usuarios',
  /** Hijo relativo de `usuarios` → `/console/usuarios/invitar` (NEX-47). */
  invitarUsuario: 'invitar',
} as const

/** Patrón del login del tenant para la config del router (único path con `:slug`). */
export const PATRON_LOGIN = '/:slug/login'

/** Patrón público para solicitar recuperación de contraseña (NEX-45). */
export const PATRON_RECUPERAR = '/:slug/recuperar'

/**
 * Patrón público para establecer una nueva contraseña (NEX-45). El `token` NO va en el
 * path: viaja como query param `?token=...` y se lee con `useSearchParams`.
 */
export const PATRON_ESTABLECER_PASSWORD = '/:slug/establecer-password'

/**
 * Patrón público para activar la cuenta de un invitado (NEX-69). Mismo patrón que
 * establecer-password: el `token` de activación viaja como query param `?token=...`.
 */
export const PATRON_ACTIVAR = '/:slug/activar'

/** Nombre del parámetro de ruta del detalle de usuario (para el router y `useParams`). */
export const PARAM_USUARIO_ID = 'usuarioId'

/** Nombre del query param del token de establecer contraseña (para la URL y su lectura). */
export const PARAM_TOKEN_PASSWORD = 'token'

/**
 * Paths absolutos para navegar / enlazar. Único lugar donde se construyen: si la
 * consola pasara a ser tenant-scoped, bastaría reescribir estos valores aquí.
 */
export const RUTAS = {
  raiz: '/',
  consola: `/${SEGMENTOS.consola}`,
  inicio: `/${SEGMENTOS.consola}/${SEGMENTOS.inicio}`,
  perfil: `/${SEGMENTOS.consola}/${SEGMENTOS.perfil}`,
  usuarios: `/${SEGMENTOS.consola}/${SEGMENTOS.usuarios}`,
  invitarUsuario: `/${SEGMENTOS.consola}/${SEGMENTOS.usuarios}/${SEGMENTOS.invitarUsuario}`,
} as const

/**
 * Construye el path del login de un tenant. El `slug` es el ÚNICO parámetro que va en
 * la URL (las rutas de consola son slug-less). Lo usan el logout y el handler de 401.
 */
export function rutaLogin(slug: string): string {
  return `/${slug}/login`
}

/**
 * Construye el path del detalle de un usuario a partir de su `id` de contrato. Único
 * lugar donde se arma este path (lo usan la tabla y las tarjetas del listado).
 */
export function rutaUsuario(id: string): string {
  return `/${SEGMENTOS.consola}/${SEGMENTOS.usuarios}/${id}`
}

/** Construye el path para solicitar recuperación de contraseña de un tenant (NEX-45). */
export function rutaRecuperar(slug: string): string {
  return `/${slug}/recuperar`
}

/**
 * Construye el path para establecer contraseña. El `token` (opcional) se anexa como
 * query param — así lo arma el enlace del correo; la pantalla lo lee del query. Sin
 * token, devuelve el path base (p. ej. el enlace "solicitar enlace nuevo" no lo lleva).
 */
export function rutaEstablecerPassword(slug: string, token?: string): string {
  const base = `/${slug}/establecer-password`
  return token
    ? `${base}?${PARAM_TOKEN_PASSWORD}=${encodeURIComponent(token)}`
    : base
}

/**
 * Construye el path para activar una cuenta de invitado (NEX-69). El `token` (opcional)
 * se anexa como query param, igual que `rutaEstablecerPassword`; así lo arma el enlace
 * del correo de invitación.
 */
export function rutaActivar(slug: string, token?: string): string {
  const base = `/${slug}/activar`
  return token
    ? `${base}?${PARAM_TOKEN_PASSWORD}=${encodeURIComponent(token)}`
    : base
}
