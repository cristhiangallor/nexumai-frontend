import { createBrowserRouter, Outlet, redirect } from 'react-router'

import { AppShell } from './console/AppShell'
import { RutaProtegida } from './core/permissions'
import { getToken, RequiereSesion } from './core/session'
import { ActivarCuentaPage } from './features/auth/ActivarCuentaPage'
import { EstablecerPasswordPage } from './features/auth/EstablecerPasswordPage'
import { LoginPage } from './features/auth/LoginPage'
import { RecuperarPasswordPage } from './features/auth/RecuperarPasswordPage'
import { PerfilPage } from './features/perfil/PerfilPage'
import { InvitarUsuarioPage } from './features/usuarios/InvitarUsuarioPage'
import { UsuarioDetallePage } from './features/usuarios/UsuarioDetallePage'
import { UsuariosPage } from './features/usuarios/UsuariosPage'
import { LandingPublicaPlaceholder } from './LandingPublicaPlaceholder'
import { PostLoginPlaceholder } from './PostLoginPlaceholder'
import {
  PARAM_USUARIO_ID,
  PATRON_ACTIVAR,
  PATRON_ESTABLECER_PASSWORD,
  PATRON_LOGIN,
  PATRON_RECUPERAR,
  RUTAS,
  SEGMENTOS,
} from './rutas'

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
    // Público tenant-scoped (NEX-45): solicitar enlace de recuperación.
    path: PATRON_RECUPERAR,
    element: <RecuperarPasswordPage />,
  },
  {
    // Público tenant-scoped (NEX-45): establecer contraseña con el token del enlace
    // (query param). Sin guard: es anónimo. Mismo endpoint que reusa NEX-69.
    path: PATRON_ESTABLECER_PASSWORD,
    element: <EstablecerPasswordPage />,
  },
  {
    // Público tenant-scoped (NEX-69): activar cuenta de invitado con el token del correo
    // (query param). Anónimo, mismo endpoint POST /password que establecer-password.
    path: PATRON_ACTIVAR,
    element: <ActivarCuentaPage />,
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
        // Usuarios: el padre es SOLO layout (Outlet) + `handle.titulo` para el
        // breadcrumb. El guard de PERMISO vive en CADA hijo (NEX-47), porque el gate
        // pertenece a la ruta, no al layout: listado y detalle exigen `usuario.ver`;
        // invitar exige `usuario.invitar`. `invitar` (estático) rankea por encima de
        // `:usuarioId` (dinámico) en React Router, así que nunca se captura como un id.
        path: SEGMENTOS.usuarios,
        handle: { titulo: 'Usuarios' },
        element: <Outlet />,
        children: [
          {
            index: true,
            element: (
              <RutaProtegida clave="usuario.ver">
                <UsuariosPage />
              </RutaProtegida>
            ),
          },
          {
            path: SEGMENTOS.invitarUsuario,
            handle: { titulo: 'Invitar' },
            element: (
              <RutaProtegida clave="usuario.invitar">
                <InvitarUsuarioPage />
              </RutaProtegida>
            ),
          },
          {
            path: `:${PARAM_USUARIO_ID}`,
            handle: { titulo: 'Detalle' },
            element: (
              <RutaProtegida clave="usuario.ver">
                <UsuarioDetallePage />
              </RutaProtegida>
            ),
          },
        ],
      },
    ],
  },
])
