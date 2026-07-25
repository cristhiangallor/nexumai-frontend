import { Outlet } from 'react-router'

import { MenuNavegacion } from './MenuNavegacion'

// TODO(superficies): estructura de navegación MÍNIMA y PROVISIONAL donde cuelga el
// menú dirigido por permisos. El layout definitivo de las superficies (consola/portal)
// se decide en sus historias — esto NO lo resuelve. Cuelga los destinos autenticados
// provisionales (/inicio de F-002, /perfil) bajo un menú común. La convergencia de
// rutas (qué es público/protegido, a dónde cae "/") sigue pendiente: landing "/" de
// F-001 y placeholder /inicio de F-002 se conectan aquí, no se resuelven.
export function LayoutApp() {
  return (
    <>
      <MenuNavegacion />
      <Outlet />
    </>
  )
}
