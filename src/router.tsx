import { createBrowserRouter, Outlet, redirect } from 'react-router'

import { AppShell } from './console/AppShell'
import { RutaProtegida } from './core/permissions'
import { getToken, RequiereSesion } from './core/session'
import { LoginPage } from './features/auth/LoginPage'
import { PerfilPage } from './features/perfil/PerfilPage'
import { UsuarioDetallePage } from './features/usuarios/UsuarioDetallePage'
import { UsuariosPage } from './features/usuarios/UsuariosPage'
import { LandingPublicaPlaceholder } from './LandingPublicaPlaceholder'
import { PostLoginPlaceholder } from './PostLoginPlaceholder'
import { PARAM_USUARIO_ID, PATRON_LOGIN, RUTAS, SEGMENTOS } from './rutas'

/**
 * Convergencia de rutas de `/` (F-004): decide a dónde cae la raíz según la sesión.
 * Con token → `RUTAS.inicio` (dentro de la consola). Sin token → `null` (renderiza la
 * landing pública). Paths centralizados en `rutas.ts` (ADR-015).
 *
 * Decisión de producto (2026-07-25): "/" es territorio PÚBLICO; como el login es
 * tenant-scoped, "/" no redirige a login sin slug. Sin sesión → landing pública.
 */
export function redirigirSegunSesion() {
  return getToken() ? redirect(RUTAS.inicio) : null
}

export const router = createBrowserRouter([
  {
    path: '/',
    loader: redirigirSegunSesion,
    element: <LandingPublicaPlaceholder />,
  },
  {
    // Único path con `:slug` (tenant). El slug se lee con `useParams` en LoginPage.
    path: PATRON_LOGIN,
    element: <LoginPage />,
  },
  {
    // Consola (NEX-65): layout bajo el prefijo `/console`, envuelto por el guard de
    // SESIÓN (NEX-61) — el guard es agnóstico del path. `handle.titulo` aporta el nivel
    // "Consola" al breadcrumb. Los hijos son relativos → /console/inicio, /console/perfil.
    path: SEGMENTOS.consola,
    handle: { titulo: 'Consola' },
    element: (
      <RequiereSesion>
        <AppShell />
      </RequiereSesion>
    ),
    children: [
      {
        // Índice de la consola (NEX-65): `/console` redirige a `/console/inicio`, para
        // que teclear `/console` o pulsar el crumb "Consola" del breadcrumb no aterrice
        // en un AppShell con contenido vacío. Sin literales: usa el módulo de rutas.
        index: true,
        loader: () => redirect(RUTAS.inicio),
      },
      {
        // Destino autenticado tras el login (F-002).
        path: SEGMENTOS.inicio,
        handle: { titulo: 'Inicio' },
        element: <PostLoginPlaceholder />,
      },
      {
        // Sesión (guard padre) + permiso: sin `usuario.ver_propio` → AccesoDenegado.
        path: SEGMENTOS.perfil,
        handle: { titulo: 'Mi perfil' },
        element: (
          <RutaProtegida clave="usuario.ver_propio">
            <PerfilPage />
          </RutaProtegida>
        ),
      },
      {
        // Usuarios (NEX-46): listado + detalle. El guard de PERMISO envuelve un Outlet,
        // así que ambos hijos exigen `usuario.ver` (sin él → AccesoDenegado, antes de
        // fetch). `handle.titulo` aporta el nivel "Usuarios" al breadcrumb.
        path: SEGMENTOS.usuarios,
        handle: { titulo: 'Usuarios' },
        element: (
          <RutaProtegida clave="usuario.ver">
            <Outlet />
          </RutaProtegida>
        ),
        children: [
          { index: true, element: <UsuariosPage /> },
          {
            path: `:${PARAM_USUARIO_ID}`,
            handle: { titulo: 'Detalle' },
            element: <UsuarioDetallePage />,
          },
        ],
      },
    ],
  },
])
