// TODO(NEX-51/dashboard): destino autenticado provisional tras el login (decisión B
// de F-002). Reemplazar por enrutamiento por rol/superficie cuando exista el
// dashboard; ver la landing provisional de "/" en F-001. Andamiaje, no diseño.
export function PostLoginPlaceholder() {
  return (
    <main style={{ padding: '16px' }}>
      <h1>Sesión iniciada</h1>
      <p>Destino provisional tras el inicio de sesión.</p>
    </main>
  )
}
