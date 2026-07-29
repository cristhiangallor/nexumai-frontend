// Etiquetas de presentación (es-MX) y formateo de fecha para la vista de usuarios.
// Separa el TEXTO visible del valor de dominio: el badge/tabla muestran "Activo", el
// contrato transporta "ACTIVO".

import type { EstadoUsuario } from '@/core/api'

/** Estado de dominio → texto visible (es-MX). */
export const ETIQUETA_ESTADO: Record<EstadoUsuario, string> = {
  INVITADO: 'Invitado',
  ACTIVO: 'Activo',
  DESACTIVADO: 'Desactivado',
}

// Instancia única del formateador (crear uno por render es caro). Fecha sin hora: en el
// listado basta el día de alta.
const formateadorFecha = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'medium',
})

/** Formatea una fecha-hora ISO a fecha es-MX; entrada inválida → guion. */
export function formatearFecha(iso: string): string {
  const fecha = new Date(iso)
  return Number.isNaN(fecha.getTime()) ? '—' : formateadorFecha.format(fecha)
}
