import { getPerfil } from '@/core/session'

// TODO(NEX-50): vista MÍNIMA y PROVISIONAL. Se creó en F-003 (NEX-51) solo como
// destino real para ejercitar el guard de ruta (RutaProtegida) y el menú dirigido por
// permisos — NO es la historia "Mi perfil" (NEX-50), que la enriquecerá con su diseño
// y alcance completos. No confundir con esa historia ya hecha. Muestra los datos de
// sesión ya obtenidos de `GET /me` (gate usuario.ver_propio, universal). No es un
// módulo de EPIC 3+.
export function PerfilPage() {
  const perfil = getPerfil()

  return (
    <main className="p-6 text-left">
      <h1 className="m-0 mb-4 text-2xl font-medium tracking-normal text-foreground">
        Mi perfil
      </h1>
      {perfil ? (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="font-medium text-muted-foreground">Nombre</dt>
          <dd>{perfil.nombre}</dd>
          <dt className="font-medium text-muted-foreground">Correo</dt>
          <dd>{perfil.correo}</dd>
          <dt className="font-medium text-muted-foreground">Empresa</dt>
          <dd>{perfil.empresa}</dd>
          <dt className="font-medium text-muted-foreground">Rol</dt>
          <dd>{perfil.rol ?? '—'}</dd>
        </dl>
      ) : (
        <p className="text-muted-foreground">No hay sesión activa.</p>
      )}
    </main>
  )
}
