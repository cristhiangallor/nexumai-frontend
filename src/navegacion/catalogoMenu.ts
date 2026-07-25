// Catálogo del menú, DIRIGIDO POR DATOS (no hardcodeado por superficie). Cada entrada
// declara la clave de permiso que la habilita; `MenuNavegacion` muestra solo las
// entradas cuya clave está en `permisos[]` de la sesión, reutilizando <ConPermiso>.
//
// Alcance F-003 (bloque 2): se aplica solo a los destinos que EXISTEN hoy (inicio y
// perfil). Las entradas de los módulos de dominio (expediente, documentos,
// solicitudes…) se agregan cuando lleguen sus pantallas (EPIC 3+), cada una
// declarando su clave — sin tocar el componente del menú.
//
// TRAMPAS DE LA MATRIZ (NEX-9 §2) a honrar cuando existan sus módulos (todavía NO
// aplican: esos módulos no están en este alcance mínimo):
//  - `recibo`: la acción "aprobar" se etiqueta "Acusar recibo", nunca "Aprobar".
//  - "Superadmin Nexum" opera dentro de un tenant: NO ofrecer "cambiar de tenant".
//  - Alcance "equipo" del Aprobador = un nivel (`jefe_directo_id`), no multinivel.

/** Entrada del menú dirigido por permisos. */
export interface EntradaMenu {
  /** Texto visible (es-MX). */
  etiqueta: string
  /** Ruta destino. */
  ruta: string
  /** Clave `modulo.accion` requerida para ver la entrada. */
  permiso: string
}

/**
 * Catálogo real de la app. Hoy solo destinos existentes, ambos habilitados por
 * `usuario.ver_propio` (permiso universal del usuario autenticado; es el gate de
 * `GET /me`). Crecerá con los módulos de EPIC 3+.
 */
export const catalogoMenu: EntradaMenu[] = [
  { etiqueta: 'Inicio', ruta: '/inicio', permiso: 'usuario.ver_propio' },
  { etiqueta: 'Mi perfil', ruta: '/perfil', permiso: 'usuario.ver_propio' },
]
