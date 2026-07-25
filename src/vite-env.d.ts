/// <reference types="vite/client" />

// Tipado de las variables de entorno propias (Vite las expone en `import.meta.env`
// solo si llevan el prefijo `VITE_`). No agregar `import` en este archivo: rompería
// la ampliación de la interfaz (doc oficial de Vite).
interface ImportMetaEnv {
  /** Base URL del backend por entorno. Ej.: `https://api.nexum.example`. */
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
