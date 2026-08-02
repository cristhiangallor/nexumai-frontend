import { usePerfil } from '@/core/session'

import { PerfilDetalle } from './PerfilDetalle'

/**
 * "Mi perfil" en la consola (NEX-50): pantalla de SOLO LECTURA del perfil propio. Llena
 * la ruta placeholder que dejó F-008.
 *
 * FUENTE = sesión, sin `GET /me`. El perfil completo ya vive en `core/session` (lo pobló
 * el login) y esta página vive tras `RutaProtegida usuario.ver_propio`, que evalúa
 * `getPerfil()?.permisos`: si el perfil es `null` el guard niega y la página NO monta.
 * Por el invariante, si monta, el perfil está — así que se pinta directo, sin carga/error.
 *
 * Mapea el `PerfilResponse` a SOLO los campos visibles (`DatosPerfil`) antes de montar la
 * presentación: `permisos[]` y `sesionExpiraEn` ni siquiera se pasan (frontera con NEX-70,
 * decisión C). El fallback `null` es defensivo: por el guard, inalcanzable en runtime.
 */
export function PerfilPage() {
  const perfil = usePerfil()

  return (
    <main className="p-6 text-left">
      <h1 className="m-0 mb-6 text-2xl font-medium tracking-normal text-foreground">
        Mi perfil
      </h1>
      {perfil && (
        <PerfilDetalle
          nombre={perfil.nombre}
          correo={perfil.correo}
          rol={perfil.rol}
          empresa={perfil.empresa}
          estado={perfil.estado}
        />
      )}
    </main>
  )
}
