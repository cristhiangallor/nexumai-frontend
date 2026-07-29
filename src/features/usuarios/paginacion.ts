// Cálculo puro de paginación (sin React): total de páginas y qué números mostrar con
// ventana + elipsis. Separado del componente para testear sin tocar el DOM.

/** Total de páginas a partir del conteo y el tamaño. Mínimo 1 (nunca 0 páginas). */
export function calcularTotalPaginas(total: number, tamano: number): number {
  return Math.max(1, Math.ceil(total / tamano))
}

/**
 * Números de página a mostrar, con elipsis (`'gap'`) cuando hay demasiadas. Siempre
 * incluye la primera y la última, más una ventana alrededor de la actual. Con 7 páginas
 * o menos, se muestran todas.
 */
export function paginasVisibles(
  actual: number,
  totalPaginas: number,
): (number | 'gap')[] {
  if (totalPaginas <= 7) {
    return Array.from({ length: totalPaginas }, (_, i) => i + 1)
  }
  const paginas: (number | 'gap')[] = [1]
  const inicio = Math.max(2, actual - 1)
  const fin = Math.min(totalPaginas - 1, actual + 1)
  if (inicio > 2) paginas.push('gap')
  for (let p = inicio; p <= fin; p++) paginas.push(p)
  if (fin < totalPaginas - 1) paginas.push('gap')
  paginas.push(totalPaginas)
  return paginas
}
