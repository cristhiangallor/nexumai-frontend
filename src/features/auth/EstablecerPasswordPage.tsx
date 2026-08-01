import { useNavigate, useParams, useSearchParams } from 'react-router'

import { PARAM_TOKEN_PASSWORD, rutaLogin, rutaRecuperar } from '@/rutas'

import {
  FormularioEstablecerPassword,
  type TextosEstablecerPassword,
} from './FormularioEstablecerPassword'

/** Copy del flujo de RECUPERACIÓN (NEX-45). La activación (NEX-69) trae el suyo. */
const TEXTOS_RECUPERACION: TextosEstablecerPassword = {
  titulo: 'Establecer nueva contraseña',
  descripcion: 'Crea una contraseña de al menos 12 caracteres para tu cuenta.',
  etiquetaBoton: 'Guardar contraseña',
  etiquetaBotonEnviando: 'Guardando…',
  // En recuperación, un enlace inválido/expirado se resuelve pidiendo otro uno mismo.
  mensajeEnlaceInvalido: 'El enlace es inválido, expiró o ya se usó.',
}

/**
 * Pantalla pública tenant-scoped (`/:slug/establecer-password?token=...`) del flujo de
 * recuperación. Solo cablea datos: slug de la ruta, token del query param, y enchufa el
 * formulario reutilizable con el copy y la navegación de este flujo. Tras `204` navega
 * al login con una clave de aviso PROPIA de recuperación (la activación usará otra).
 */
export function EstablecerPasswordPage() {
  const { slug = '' } = useParams()
  const [searchParams] = useSearchParams()
  const token = searchParams.get(PARAM_TOKEN_PASSWORD)
  const navigate = useNavigate()

  return (
    <FormularioEstablecerPassword
      slug={slug}
      token={token}
      textos={TEXTOS_RECUPERACION}
      onExito={() =>
        navigate(rutaLogin(slug), {
          replace: true,
          state: { avisoPasswordActualizada: true },
        })
      }
      accionEnlaceInvalido={{
        etiqueta: 'Solicitar un enlace nuevo',
        ruta: rutaRecuperar(slug),
      }}
    />
  )
}
