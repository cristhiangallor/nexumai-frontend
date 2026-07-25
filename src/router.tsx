import { createBrowserRouter } from 'react-router'

import { ConsoleHome } from './console/ConsoleHome'
import { ConsoleLayout } from './console/ConsoleLayout'
import { RutaProtegida } from './core/permissions'
import { LoginPage } from './features/auth/LoginPage'
import { PerfilPage } from './features/perfil/PerfilPage'
import { Landing } from './Landing'
import { LayoutApp } from './navegacion/LayoutApp'
import { PortalHome } from './portal/PortalHome'
import { PortalLayout } from './portal/PortalLayout'
import { PostLoginPlaceholder } from './PostLoginPlaceholder'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Landing />,
  },
  {
    // Ruta paramétrica: el `slug` (tenant) se lee con `useParams` en LoginPage.
    path: '/:slug/login',
    element: <LoginPage />,
  },
  {
    // Estructura de navegación mínima y provisional (LayoutApp) que cuelga el menú
    // dirigido por permisos sobre los destinos autenticados de hoy. Ver TODO en
    // LayoutApp; el layout definitivo de las superficies es de sus historias.
    element: <LayoutApp />,
    children: [
      {
        // Destino autenticado provisional tras el login (decisión B, F-002).
        path: '/inicio',
        element: <PostLoginPlaceholder />,
      },
      {
        // Ruta protegida por el guard: sin `usuario.ver_propio` → AccesoDenegado.
        path: '/perfil',
        element: (
          <RutaProtegida clave="usuario.ver_propio">
            <PerfilPage />
          </RutaProtegida>
        ),
      },
    ],
  },
  {
    path: '/console',
    element: <ConsoleLayout />,
    children: [{ index: true, element: <ConsoleHome /> }],
  },
  {
    path: '/portal',
    element: <PortalLayout />,
    children: [{ index: true, element: <PortalHome /> }],
  },
])
