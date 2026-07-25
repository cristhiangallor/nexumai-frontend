// TODO(landing pública): DECISIÓN DE PRODUCTO (2026-07-25) — la raíz "/" es territorio
// PÚBLICO. El login es tenant-scoped (`/:slug/login`), así que "/" NO puede redirigir a
// login sin conocer el slug. Aquí irá una LANDING PÚBLICA (historia futura) que capturará
// el slug del tenant. Esto es un placeholder consciente que reemplaza el interino de
// F-001; NO es la landing real (contenido/marketing/captura de slug es otra historia).
export function LandingPublicaPlaceholder() {
  return (
    <main className="p-6 text-left">
      <h1 className="m-0 mb-2 text-2xl font-medium tracking-normal text-foreground">
        Nexum Compliance
      </h1>
      <p className="text-muted-foreground">Landing pública pendiente.</p>
    </main>
  )
}
