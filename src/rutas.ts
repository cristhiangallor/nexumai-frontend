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
} as const

/** Patrón del login del tenant para la config del router (único path con `:slug`). */
export const PATRON_LOGIN = '/:slug/login'

/**
 * Paths absolutos para navegar / enlazar. Único lugar donde se construyen: si la
 * consola pasara a ser tenant-scoped, bastaría reescribir estos valores aquí.
 */
export const RUTAS = {
  raiz: '/',
  consola: `/${SEGMENTOS.consola}`,
  inicio: `/${SEGMENTOS.consola}/${SEGMENTOS.inicio}`,
  perfil: `/${SEGMENTOS.consola}/${SEGMENTOS.perfil}`,
} as const

/**
 * Construye el path del login de un tenant. El `slug` es el ÚNICO parámetro que va en
 * la URL (las rutas de consola son slug-less). Lo usan el logout y el handler de 401.
 */
export function rutaLogin(slug: string): string {
  return `/${slug}/login`
}
