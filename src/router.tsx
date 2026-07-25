import { createBrowserRouter, redirect } from 'react-router'

import { AppShell } from './console/AppShell'
import { ConsoleHome } from './console/ConsoleHome'
import { ConsoleLayout } from './console/ConsoleLayout'
import { RutaProtegida } from './core/permissions'
import { getToken } from './core/session'
import { LoginPage } from './features/auth/LoginPage'
import { PerfilPage } from './features/perfil/PerfilPage'
import { LandingPublicaPlaceholder } from './LandingPublicaPlaceholder'
import { PortalHome } from './portal/PortalHome'
import { PortalLayout } from './portal/PortalLayout'
import { PostLoginPlaceholder } from './PostLoginPlaceholder'

/**
 * Convergencia de rutas de `/` (F-004): decide a dónde cae la raíz según la sesión.
 * Con token → `/inicio` (cierra el lado con-sesión del TODO de F-002). Sin token →
 * `null` (renderiza el `element`, la landing pública).
 *
 * Decisión de producto (2026-07-25): "/" es territorio PÚBLICO; como el login es
 * tenant-scoped (`/:slug/login`), "/" no redirige a login sin slug. Sin sesión se
 * muestra la landing pública (por ahora, placeholder consciente).
 */
export function redirigirSegunSesion() {
  return getToken() ? redirect('/inicio') : null
}

export const router = createBrowserRouter([
  {
    path: '/',
    loader: redirigirSegunSesion,
    // Con sesión el loader redirige a /inicio; sin sesión, landing pública (placeholder).
    element: <LandingPublicaPlaceholder />,
  },
  {
    // Ruta paramétrica: el `slug` (tenant) se lee con `useParams` en LoginPage.
    path: '/:slug/login',
    element: <LoginPage />,
  },
  {
    // AppShell de la consola (F-004): marco de tres zonas. Reemplaza el LayoutApp
    // provisional de F-003 preservando su menú/gating (vía Sidebar → MenuNavegacion).
    element: <AppShell />,
    children: [
      {
        // Destino autenticado tras el login (F-002), ahora dentro del AppShell.
        // `handle.titulo` alimenta el breadcrumb (convención dirigida por datos).
        path: '/inicio',
        handle: { titulo: 'Inicio' },
        element: <PostLoginPlaceholder />,
      },
      {
        // Ruta protegida por el guard: sin `usuario.ver_propio` → AccesoDenegado.
        path: '/perfil',
        handle: { titulo: 'Mi perfil' },
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
