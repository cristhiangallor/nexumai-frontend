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
} as const

/** Patrón del login del tenant para la config del router (único path con `:slug`). */
export const PATRON_LOGIN = '/:slug/login'

/** Nombre del parámetro de ruta del detalle de usuario (para el router y `useParams`). */
export const PARAM_USUARIO_ID = 'usuarioId'

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
