import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'

import { setUnauthorizedHandler } from './core/http'
import './index.css'
import { router } from './router.tsx'

// Cliente de TanStack Query (estado de servidor). Único a nivel de app.
const queryClient = new QueryClient()

// Handler global de 401 INESPERADO (sesión expirada/invalidada) — NEX-62. Redirige al
// login del tenant con aviso de "sesión expirada". El slug lo captura `core/http` ANTES
// de limpiar la sesión y lo pasa aquí. Se distingue de:
//  - "acceso denegado" (falta de permisos → AccesoDenegado, otra pantalla),
//  - el aviso de logout degradado de F-005 ("no pudimos confirmarlo con el servidor").
// El logout voluntario NO pasa por aquí (usa `skipUnauthorizedHandler`).
setUnauthorizedHandler((slug) => {
  router.navigate(slug ? `/${slug}/login` : '/', {
    replace: true,
    state: { avisoSesionExpirada: true },
  })
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
