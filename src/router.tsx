import { createBrowserRouter } from 'react-router'

import { ConsoleHome } from './console/ConsoleHome'
import { ConsoleLayout } from './console/ConsoleLayout'
import { LoginPage } from './features/auth/LoginPage'
import { Landing } from './Landing'
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
    // Destino autenticado provisional tras el login (decisión B). Ver TODO.
    path: '/inicio',
    element: <PostLoginPlaceholder />,
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
